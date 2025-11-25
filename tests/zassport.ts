import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Zassport } from "../target/types/zassport";

describe("zassport", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.zassport as Program<Zassport>;
  const provider = anchor.AnchorProvider.env();
  const authority = provider.wallet.publicKey;

  it("Initialize program", async () => {
    const tx = await program.methods.initializeProgram().rpc();
    console.log("Program initialized, transaction signature:", tx);
  });

  it("Register identity", async () => {
    const commitment = Array.from({length: 32}, () => Math.floor(Math.random() * 256));
    const nullifier = Array.from({length: 32}, () => Math.floor(Math.random() * 256));

    const [identityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("identity"), authority.toBuffer()],
      program.programId
    );

    const [reputationPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("reputation"), identityPda.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .registerIdentity(commitment, nullifier)
      .accounts({
        user: authority,
        identity: identityPda,
        nullifierRegistry: PublicKey.findProgramAddressSync(
          [Buffer.from("nullifier_registry")],
          program.programId
        )[0],
        reputationRecord: reputationPda,
      })
      .rpc();

    console.log("Identity registered, transaction signature:", tx);
  });
});
