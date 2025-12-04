/**
 * Tests for Cross-Chain Bridge Service
 */

import {
  CrossChainBridge,
  SUPPORTED_CHAINS,
  CHAIN_CONFIGS,
  type ChainId,
} from '../src/lib/cross-chain';

// Mock ethers
jest.mock('ethers', () => ({
  Contract: jest.fn().mockImplementation(() => ({
    publishMessage: jest.fn().mockResolvedValue({
      hash: '0x1234567890abcdef',
      wait: jest.fn().mockResolvedValue({ blockNumber: 12345 }),
    }),
    completeTransfer: jest.fn().mockResolvedValue({
      hash: '0xfedcba0987654321',
      wait: jest.fn().mockResolvedValue({ blockNumber: 12346 }),
    }),
    quoteEVMDeliveryPrice: jest.fn().mockResolvedValue([
      BigInt(1000000000000000), // 0.001 ETH
      BigInt(100000), // gas
    ]),
  })),
  BrowserProvider: jest.fn().mockImplementation(() => ({
    getSigner: jest.fn().mockResolvedValue({
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    }),
  })),
  formatEther: jest.fn((wei) => String(Number(wei) / 1e18)),
  parseEther: jest.fn((eth) => BigInt(Number(eth) * 1e18)),
}));

describe('Cross-Chain Bridge', () => {
  let bridge: CrossChainBridge;

  beforeEach(() => {
    bridge = new CrossChainBridge('testnet');
  });

  describe('Chain Configuration', () => {
    it('should have all supported chains configured', () => {
      for (const chainId of SUPPORTED_CHAINS) {
        expect(CHAIN_CONFIGS[chainId]).toBeDefined();
        expect(CHAIN_CONFIGS[chainId].name).toBeDefined();
        expect(CHAIN_CONFIGS[chainId].chainId).toBeDefined();
      }
    });

    it('should have valid Wormhole chain IDs', () => {
      expect(CHAIN_CONFIGS.ethereum.wormholeChainId).toBe(2);
      expect(CHAIN_CONFIGS.solana.wormholeChainId).toBe(1);
      expect(CHAIN_CONFIGS.polygon.wormholeChainId).toBe(5);
    });

    it('should have bridge contract addresses', () => {
      for (const chainId of SUPPORTED_CHAINS) {
        expect(CHAIN_CONFIGS[chainId].coreBridge).toBeDefined();
        expect(CHAIN_CONFIGS[chainId].coreBridge.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Fee Estimation', () => {
    it('should estimate bridge fee', async () => {
      const fee = await bridge.estimateFee(
        'ethereum',
        'polygon',
        { size: 1000 }
      );

      expect(fee.amount).toBeGreaterThan(0);
      expect(fee.token).toBe('ETH');
    });

    it('should return different fees for different routes', async () => {
      const feeToPolygon = await bridge.estimateFee('ethereum', 'polygon', { size: 1000 });
      const feeToArbitrum = await bridge.estimateFee('ethereum', 'arbitrum', { size: 1000 });

      // Fees might differ based on destination
      expect(feeToPolygon.amount).toBeDefined();
      expect(feeToArbitrum.amount).toBeDefined();
    });
  });

  describe('Message Encoding', () => {
    it('should encode attestation payload', () => {
      const payload = bridge.encodeAttestationPayload({
        claimType: 'age',
        proof: new Uint8Array(256),
        publicInputs: ['21', '1'],
        commitment: '0x1234',
        timestamp: Date.now(),
      });

      expect(payload).toBeInstanceOf(Uint8Array);
      expect(payload.length).toBeGreaterThan(0);
    });

    it('should decode attestation payload', () => {
      const original = {
        claimType: 'nationality' as const,
        proof: new Uint8Array(256).fill(1),
        publicInputs: ['USA', 'APPROVED'],
        commitment: '0xabcd',
        timestamp: Date.now(),
      };

      const encoded = bridge.encodeAttestationPayload(original);
      const decoded = bridge.decodeAttestationPayload(encoded);

      expect(decoded.claimType).toBe(original.claimType);
      expect(decoded.commitment).toBe(original.commitment);
    });

    it('should include magic bytes for identification', () => {
      const payload = bridge.encodeAttestationPayload({
        claimType: 'validity',
        proof: new Uint8Array(256),
        publicInputs: ['1'],
        commitment: '0x5678',
        timestamp: Date.now(),
      });

      // Check for ZASS magic bytes (0x5A415353)
      const magicBytes = payload.slice(0, 4);
      expect(magicBytes[0]).toBe(0x5A); // Z
      expect(magicBytes[1]).toBe(0x41); // A
      expect(magicBytes[2]).toBe(0x53); // S
      expect(magicBytes[3]).toBe(0x53); // S
    });
  });

  describe('Bridge Operations', () => {
    it('should initiate bridge transfer', async () => {
      // Mock wallet
      const mockWallet = {
        provider: { send: jest.fn() },
        address: '0x1234567890123456789012345678901234567890',
      };

      const result = await bridge.bridgeAttestation({
        sourceChain: 'ethereum',
        targetChain: 'polygon',
        attestation: {
          claimType: 'age',
          proof: new Uint8Array(256),
          publicInputs: ['21'],
          commitment: '0x1234',
        },
        wallet: mockWallet as any,
      });

      expect(result.txHash).toBeDefined();
      expect(result.sequence).toBeDefined();
    });

    it('should track bridge status', async () => {
      const status = await bridge.getBridgeStatus(
        '0x1234567890abcdef',
        'ethereum',
        12345
      );

      expect(status.stage).toBeDefined();
      expect(['pending', 'confirmed', 'signed', 'redeemed', 'failed'])
        .toContain(status.stage);
    });

    it('should calculate confirmation time estimate', () => {
      const estimate = bridge.estimateConfirmationTime('ethereum', 'polygon');

      expect(estimate.minMinutes).toBeGreaterThan(0);
      expect(estimate.maxMinutes).toBeGreaterThanOrEqual(estimate.minMinutes);
    });
  });

  describe('VAA Handling', () => {
    it('should fetch VAA after confirmation', async () => {
      // Mock the Wormhole API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          vaaBytes: 'AQAAAA...',
          emitterChain: 2,
          sequence: '12345',
        }),
      });

      const vaa = await bridge.getVAA('ethereum', '0x1234', 12345);

      expect(vaa).toBeDefined();
    });

    it('should retry VAA fetch with backoff', async () => {
      let attempts = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.resolve({ ok: false, status: 404 });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vaaBytes: 'test-vaa' }),
        });
      });

      await bridge.getVAA('ethereum', '0x1234', 12345, { maxRetries: 5 });

      expect(attempts).toBe(3);
    });
  });

  describe('Chain Validation', () => {
    it('should validate source chain', () => {
      expect(() => bridge.validateChain('ethereum')).not.toThrow();
      expect(() => bridge.validateChain('invalid' as ChainId)).toThrow();
    });

    it('should validate chain pair compatibility', () => {
      expect(bridge.isRouteSupported('ethereum', 'polygon')).toBe(true);
      expect(bridge.isRouteSupported('solana', 'ethereum')).toBe(true);
    });

    it('should reject same-chain transfers', () => {
      expect(bridge.isRouteSupported('ethereum', 'ethereum')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        bridge.getVAA('ethereum', '0x1234', 12345, { maxRetries: 1 })
      ).rejects.toThrow('Network error');
    });

    it('should handle insufficient fee', async () => {
      const mockWallet = {
        provider: { 
          send: jest.fn(),
          getBalance: jest.fn().mockResolvedValue(BigInt(0)),
        },
        address: '0x1234567890123456789012345678901234567890',
      };

      await expect(
        bridge.bridgeAttestation({
          sourceChain: 'ethereum',
          targetChain: 'polygon',
          attestation: {
            claimType: 'age',
            proof: new Uint8Array(256),
            publicInputs: ['21'],
            commitment: '0x1234',
          },
          wallet: mockWallet as any,
          validateBalance: true,
        })
      ).rejects.toThrow(/insufficient/i);
    });
  });
});

describe('Chain-Specific Tests', () => {
  describe('Solana Bridge', () => {
    it('should use correct program IDs for Solana', () => {
      const solanaConfig = CHAIN_CONFIGS.solana;
      expect(solanaConfig.coreBridge).toBeDefined();
      expect(solanaConfig.tokenBridge).toBeDefined();
    });
  });

  describe('L2 Optimizations', () => {
    it('should have faster confirmation for L2s', () => {
      const bridge = new CrossChainBridge('mainnet');

      const ethToPolygon = bridge.estimateConfirmationTime('ethereum', 'polygon');
      const arbToBase = bridge.estimateConfirmationTime('arbitrum', 'base');

      // L2 to L2 should be faster
      expect(arbToBase.minMinutes).toBeLessThanOrEqual(ethToPolygon.minMinutes);
    });
  });
});
