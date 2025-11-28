import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Ed25519Program, TransactionInstruction, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import nacl from "tweetnacl";
import { Zassport } from "../target/types/zassport";
import { buildPoseidon } from "circomlibjs";
import { expect } from "chai";

describe("Zassport E2E Integration Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Zassport as Program<Zassport>;
  const authority = (provider.wallet as anchor.Wallet).payer;
  let poseidon: any;

  // Test data
  let nullifierRegistryPda: PublicKey;
  let identityPda: PublicKey;
  let reputationPda: PublicKey;
  
  // ZK proof data
  let commitment: number[];
  let nullifier: number[];
  let dateOfBirth: bigint;
  let salt: bigint;

  before(async () => {
    // Initialize Poseidon hash
    poseidon = await buildPoseidon();

    console.log("\n🚀 Test Environment:");
    console.log("   Program:", program.programId.toBase58());
    console.log("   Authority:", authority.publicKey.toBase58());
    console.log("   Cluster:", provider.connection.rpcEndpoint);
  });

  describe("1. Program Initialization", () => {
    it("Should initialize nullifier registry", async () => {
      [nullifierRegistryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("nullifier_registry")],
        program.programId
      );

      try {
        const tx = await program.methods
          .initializeProgram()
          .rpc();

        console.log("   ✅ Registry initialized:", tx.slice(0, 8) + "...");

        // Verify
        const registry = await program.account.nullifierRegistry.fetch(nullifierRegistryPda);
        expect(registry.authority.toBase58()).to.equal(authority.publicKey.toBase58());
        expect(registry.nullifiers.length).to.equal(0);
      } catch (error: any) {
        if (error.toString().includes("already in use")) {
          console.log("   ℹ️  Registry already initialized");
          const registry = await program.account.nullifierRegistry.fetch(nullifierRegistryPda);
          expect(registry).to.not.be.null;
        } else {
          throw error;
        }
      }
    });

    it("Should initialize verifier config (trusted off-chain verifier)", async () => {
      const kp = nacl.sign.keyPair();
      const verifierPriv = Buffer.from(kp.secretKey);
      const verifierPub = Buffer.from(kp.publicKey);
      // Persist in closure for later tests
      (global as any).verifierPriv = verifierPriv;
      (global as any).verifierPub = verifierPub;

      const [verifierConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verifier_config")],
        program.programId
      );

      try {
        const tx = await program.methods
          .initializeVerifierConfig(new PublicKey(verifierPub))
          .accounts({
            verifierConfig: verifierConfigPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log("   ✅ Verifier config initialized:", tx.slice(0, 8) + "...");
      } catch (error: any) {
        if (error.toString().includes("already in use")) {
          console.log("   ℹ️  Verifier config already initialized");
        } else {
          throw error;
        }
      }
    });
  });

  describe("2. ZK Commitment Generation", () => {
    it("Should generate valid Poseidon commitment and nullifier", async () => {
      // Simulate passport data: person born Aug 12, 1999 (age 26)
      const dob = new Date("1999-08-12");
      dateOfBirth = BigInt(Math.floor(dob.getTime() / 1000));
      // Use timestamp + random to ensure unique salts per test run
      salt = BigInt(Date.now() * 1000000 + Math.floor(Math.random() * 1000000));

      // Generate commitment: Poseidon(dateOfBirth, salt)
      const commitmentHash = poseidon([dateOfBirth, salt]);
      const commitmentStr = poseidon.F.toString(commitmentHash);
      const commitmentBuf = bigintToBuffer32BE(BigInt(commitmentStr));
      commitment = Array.from(commitmentBuf);

      // Generate nullifier: Poseidon(commitment)
      const nullifierHash = poseidon([BigInt(commitmentStr)]);
      const nullifierStr = poseidon.F.toString(nullifierHash);
      const nullifierBuf = bigintToBuffer32BE(BigInt(nullifierStr));
      nullifier = Array.from(nullifierBuf);

      console.log("\n   📊 ZK Proof Data:");
      console.log("      DOB:", new Date(Number(dateOfBirth) * 1000).toISOString().split('T')[0]);
      console.log("      Commitment:", Buffer.from(commitment).toString('hex').slice(0, 16) + "...");
      console.log("      Nullifier:", Buffer.from(nullifier).toString('hex').slice(0, 16) + "...");
      
      expect(commitment.length).to.equal(32);
      expect(nullifier.length).to.equal(32);
    });
  });

  describe("3. Identity Registration", () => {
    it("Should register identity with ZK commitment", async () => {
      [identityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("identity"), authority.publicKey.toBuffer()],
        program.programId
      );

      [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), identityPda.toBuffer()],
        program.programId
      );

      try {
        const tx = await program.methods
          .registerIdentity(commitment, nullifier)
          .rpc();

        console.log("   ✅ Identity registered:", tx.slice(0, 8) + "...");

        // Verify identity
        const identity = await program.account.identity.fetch(identityPda);
        expect(identity.owner.toBase58()).to.equal(authority.publicKey.toBase58());
        expect(Array.from(identity.commitment)).to.deep.equal(commitment);
        expect(Array.from(identity.nullifier)).to.deep.equal(nullifier);
        expect(identity.isActive).to.be.true;

        // Verify reputation
        const reputation = await program.account.reputationRecord.fetch(reputationPda);
        expect(reputation.identity.toBase58()).to.equal(identityPda.toBase58());
        expect(reputation.score.toNumber()).to.equal(0);

        console.log("   ✅ Identity verified on-chain");
      } catch (error: any) {
        if (error.toString().includes("already in use")) {
          console.log("   ℹ️  Identity already registered");
          const identity = await program.account.identity.fetch(identityPda);
          expect(identity).to.not.be.null;
          
          // Use the existing commitment and nullifier from on-chain for remaining tests
          commitment = Array.from(identity.commitment);
          nullifier = Array.from(identity.nullifier);
          console.log("   📝 Using existing commitment for proof tests");
        } else {
          throw error;
        }
      }
    });

    it("Should have registered nullifier in registry", async () => {
      const registry = await program.account.nullifierRegistry.fetch(nullifierRegistryPda);
      // Check if ANY nullifier is registered (could be from previous runs)
      expect(registry.nullifiers.length).to.be.greaterThan(0);
      console.log("   ✅ Nullifier registry contains", registry.nullifiers.length, "entries");
    });
  });

  describe("4. Off-chain Attestations (Age)", () => {
    it("Should accept verifier-signed age attestation and set flags", async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const minAge = 18;

      const [verifierConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verifier_config")],
        program.programId
      );

      // Build message matching on-chain
      const msg = buildAgeMessage(
        program.programId,
        authority.publicKey,
        identityPda,
        Buffer.from(commitment),
        Buffer.from(nullifier),
        BigInt(minAge),
        BigInt(nowSec)
      );

      const priv = (global as any).verifierPriv as Buffer;
      const pub = (global as any).verifierPub as Buffer;
      const sig = nacl.sign.detached(msg, priv);

      const edIx: TransactionInstruction = Ed25519Program.createInstructionWithPublicKey({
        publicKey: Buffer.from(pub),
        message: msg,
        signature: Buffer.from(sig),
      });

      const tx = await program.methods
        .attestAge(new BN(minAge), new BN(nowSec))
        .accounts({
          identity: identityPda,
          verifierConfig: verifierConfigPda,
          user: authority.publicKey,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .preInstructions([edIx])
        .rpc();

      console.log("   ✅ Age attestation accepted:", tx.slice(0, 8) + "...");

      const identity = await program.account.identity.fetch(identityPda);
      expect(identity.ageVerified).to.eq(true);
      expect(identity.lastAttestationTs.toNumber()).to.be.greaterThan(0);
    });
  });

  describe("5. Off-chain Attestations (Nationality)", () => {
    it("Should accept verifier-signed nationality attestation and set flags", async () => {
      const allowedNationality = 356; // India ISO 3166-1 numeric
      const nowSec = Math.floor(Date.now() / 1000);

      const [verifierConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verifier_config")],
        program.programId
      );

      const msg = buildNatMessage(
        program.programId,
        authority.publicKey,
        identityPda,
        Buffer.from(commitment),
        Buffer.from(nullifier),
        BigInt(allowedNationality),
        BigInt(nowSec)
      );

      const priv = (global as any).verifierPriv as Buffer;
      const pub = (global as any).verifierPub as Buffer;
      const sig = nacl.sign.detached(msg, priv);

      const edIx: TransactionInstruction = Ed25519Program.createInstructionWithPublicKey({
        publicKey: Buffer.from(pub),
        message: msg,
        signature: Buffer.from(sig),
      });

      const tx = await program.methods
        .attestNationality(new BN(allowedNationality), new BN(nowSec))
        .accounts({
          identity: identityPda,
          verifierConfig: verifierConfigPda,
          user: authority.publicKey,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .preInstructions([edIx])
        .rpc();

      console.log("   ✅ Nationality attestation accepted:", tx.slice(0, 8) + "...");

      const identity = await program.account.identity.fetch(identityPda);
      expect(identity.nationalityVerified).to.eq(true);
      expect(identity.lastAttestationTs.toNumber()).to.be.greaterThan(0);
    });
  });

  describe("6. Governance System", () => {
    let proposalId: number;
    let proposalPda: PublicKey;

    it("Should create governance proposal", async () => {
      proposalId = Math.floor(Date.now() / 1000);
      const proposalIdBuffer = Buffer.alloc(8);
      proposalIdBuffer.writeBigUInt64LE(BigInt(proposalId));
      [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalIdBuffer],
        program.programId
      );

      const votingPeriod = 7 * 24 * 60 * 60; // 7 days

      const tx = await program.methods
        .createProposal(
          new BN(proposalId),
          "Test Governance Proposal",
          "This proposal tests the governance system",
          new BN(votingPeriod)
        )
        .rpc();

      console.log("   ✅ Proposal created:", tx.slice(0, 8) + "...");

      // Verify
      const proposal = await program.account.governanceProposal.fetch(proposalPda);
      expect(proposal.id.toNumber()).to.equal(proposalId);
      expect(proposal.title).to.equal("Test Governance Proposal");
      expect(proposal.executed).to.be.false;
    });

    it("Should cast vote on proposal", async () => {
      const proposalIdBuffer = Buffer.alloc(8);
      proposalIdBuffer.writeBigUInt64LE(BigInt(proposalId));
      const voteRecordPda = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          proposalIdBuffer,
          identityPda.toBuffer(),
        ],
        program.programId
      )[0];

      const tx = await program.methods
        .castVote(new BN(proposalId), { yes: {} })
        .rpc();

      console.log("   ✅ Vote cast:", tx.slice(0, 8) + "...");

      // Verify vote counted
      const proposal = await program.account.governanceProposal.fetch(proposalPda);
      expect(proposal.yesVotes.toNumber()).to.be.greaterThan(0);
    });
  });

  describe("7. Reputation System", () => {
    it("Should update reputation score", async () => {
      const pointsToAdd = 50;

      const tx = await program.methods
        .updateReputation(new BN(pointsToAdd))
        .rpc();

      console.log("   ✅ Reputation updated:", tx.slice(0, 8) + "...");

      // Verify
      const identity = await program.account.identity.fetch(identityPda);
      expect(identity.reputationScore.toNumber()).to.be.greaterThan(0);

      const reputation = await program.account.reputationRecord.fetch(reputationPda);
      expect(reputation.contributions.toNumber()).to.be.greaterThan(0);
    });
  });

  // Helper function
  function bigintToBuffer32BE(value: bigint): Buffer {
    const buf = Buffer.alloc(32);
    let v = value;
    for (let i = 31; i >= 0; i--) {
      buf[i] = Number(v & BigInt(0xff));
      v >>= BigInt(8);
    }
    return buf;
  }

  function buildAgeMessage(
    programId: PublicKey,
    owner: PublicKey,
    identity: PublicKey,
    commitment: Buffer,
    nullifier: Buffer,
    minAge: bigint,
    timestamp: bigint
  ): Buffer {
    const parts = [
      Buffer.from("ZASSPORT|AGE|v1"),
      programId.toBuffer(),
      owner.toBuffer(),
      identity.toBuffer(),
      commitment,
      nullifier,
      u64le(minAge),
      i64le(timestamp),
    ];
    return Buffer.concat(parts);
  }

  function buildNatMessage(
    programId: PublicKey,
    owner: PublicKey,
    identity: PublicKey,
    commitment: Buffer,
    nullifier: Buffer,
    nationality: bigint,
    timestamp: bigint
  ): Buffer {
    const parts = [
      Buffer.from("ZASSPORT|NAT|v1"),
      programId.toBuffer(),
      owner.toBuffer(),
      identity.toBuffer(),
      commitment,
      nullifier,
      u64le(nationality),
      i64le(timestamp),
    ];
    return Buffer.concat(parts);
  }

  function u64le(x: bigint): Buffer {
    const b = Buffer.alloc(8);
    b.writeBigUInt64LE(x);
    return b;
    }

  function i64le(x: bigint): Buffer {
    const b = Buffer.alloc(8);
    b.writeBigInt64LE(x);
    return b;
  }
});
