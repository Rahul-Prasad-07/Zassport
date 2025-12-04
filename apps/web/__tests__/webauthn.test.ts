/**
 * Tests for WebAuthn Biometric Authentication
 */

import {
  WebAuthnService,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
} from '../src/lib/webauthn';

// Mock WebAuthn API
const mockCredentialsCreate = jest.fn();
const mockCredentialsGet = jest.fn();

const mockNavigator = {
  credentials: {
    create: mockCredentialsCreate,
    get: mockCredentialsGet,
  },
};

describe('WebAuthn Service', () => {
  let service: WebAuthnService;

  beforeEach(() => {
    // Setup WebAuthn mocks
    Object.defineProperty(globalThis, 'navigator', {
      value: mockNavigator,
      writable: true,
    });

    Object.defineProperty(globalThis, 'window', {
      value: {
        PublicKeyCredential: {
          isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true),
        },
      },
      writable: true,
    });

    service = new WebAuthnService({
      rpId: 'test.zassport.io',
      rpName: 'Zassport Test',
    });

    // Clear mocks
    mockCredentialsCreate.mockClear();
    mockCredentialsGet.mockClear();
  });

  describe('Support Detection', () => {
    it('should detect WebAuthn support', () => {
      expect(isWebAuthnSupported()).toBe(true);
    });

    it('should detect platform authenticator', async () => {
      const available = await isPlatformAuthenticatorAvailable();
      expect(available).toBe(true);
    });
  });

  describe('Registration', () => {
    const mockCredential = {
      id: 'test-credential-id',
      rawId: new ArrayBuffer(32),
      type: 'public-key',
      response: {
        clientDataJSON: new ArrayBuffer(100),
        attestationObject: new ArrayBuffer(200),
        getTransports: () => ['internal'],
        getPublicKey: () => new ArrayBuffer(65),
        getPublicKeyAlgorithm: () => -7, // ES256
        getAuthenticatorData: () => new ArrayBuffer(37),
      },
      authenticatorAttachment: 'platform',
    };

    it('should create registration options', () => {
      const options = service.createRegistrationOptions({
        userId: 'user123',
        userName: 'john@example.com',
        userDisplayName: 'John Smith',
      });

      expect(options.publicKey.rp.id).toBe('test.zassport.io');
      expect(options.publicKey.rp.name).toBe('Zassport Test');
      expect(options.publicKey.user.name).toBe('john@example.com');
      expect(options.publicKey.user.displayName).toBe('John Smith');
    });

    it('should include correct algorithms', () => {
      const options = service.createRegistrationOptions({
        userId: 'user123',
        userName: 'john@example.com',
        userDisplayName: 'John Smith',
      });

      const algorithms = options.publicKey.pubKeyCredParams.map(p => p.alg);
      expect(algorithms).toContain(-7); // ES256
      expect(algorithms).toContain(-257); // RS256
    });

    it('should register new credential', async () => {
      mockCredentialsCreate.mockResolvedValue(mockCredential);

      const result = await service.register({
        userId: 'user123',
        userName: 'john@example.com',
        userDisplayName: 'John Smith',
      });

      expect(result.credentialId).toBe('test-credential-id');
      expect(result.publicKey).toBeDefined();
      expect(mockCredentialsCreate).toHaveBeenCalled();
    });

    it('should exclude existing credentials', () => {
      const options = service.createRegistrationOptions({
        userId: 'user123',
        userName: 'john@example.com',
        userDisplayName: 'John Smith',
        excludeCredentials: [
          { id: new ArrayBuffer(32), type: 'public-key' },
        ],
      });

      expect(options.publicKey.excludeCredentials).toHaveLength(1);
    });
  });

  describe('Authentication', () => {
    const mockAssertion = {
      id: 'test-credential-id',
      rawId: new ArrayBuffer(32),
      type: 'public-key',
      response: {
        clientDataJSON: new ArrayBuffer(100),
        authenticatorData: new ArrayBuffer(37),
        signature: new ArrayBuffer(64),
        userHandle: new ArrayBuffer(16),
      },
    };

    it('should create authentication options', () => {
      const options = service.createAuthenticationOptions({
        allowCredentials: [
          { id: new ArrayBuffer(32), type: 'public-key' },
        ],
      });

      expect(options.publicKey.rpId).toBe('test.zassport.io');
      expect(options.publicKey.allowCredentials).toHaveLength(1);
    });

    it('should authenticate user', async () => {
      mockCredentialsGet.mockResolvedValue(mockAssertion);

      const result = await service.authenticate({
        allowCredentials: [
          { id: new ArrayBuffer(32), type: 'public-key' },
        ],
      });

      expect(result.credentialId).toBe('test-credential-id');
      expect(result.signature).toBeDefined();
      expect(mockCredentialsGet).toHaveBeenCalled();
    });

    it('should set user verification preference', () => {
      const options = service.createAuthenticationOptions({
        userVerification: 'required',
      });

      expect(options.publicKey.userVerification).toBe('required');
    });
  });

  describe('Credential Management', () => {
    it('should store credential', async () => {
      mockCredentialsCreate.mockResolvedValue({
        id: 'new-cred',
        rawId: new ArrayBuffer(32),
        type: 'public-key',
        response: {
          clientDataJSON: new ArrayBuffer(100),
          attestationObject: new ArrayBuffer(200),
          getTransports: () => ['internal'],
          getPublicKey: () => new ArrayBuffer(65),
          getPublicKeyAlgorithm: () => -7,
          getAuthenticatorData: () => new ArrayBuffer(37),
        },
        authenticatorAttachment: 'platform',
      });

      await service.register({
        userId: 'user123',
        userName: 'john@example.com',
        userDisplayName: 'John Smith',
      });

      const credentials = service.getStoredCredentials('user123');
      expect(credentials).toHaveLength(1);
      expect(credentials[0].credentialId).toBe('new-cred');
    });

    it('should delete credential', async () => {
      mockCredentialsCreate.mockResolvedValue({
        id: 'to-delete',
        rawId: new ArrayBuffer(32),
        type: 'public-key',
        response: {
          clientDataJSON: new ArrayBuffer(100),
          attestationObject: new ArrayBuffer(200),
          getTransports: () => ['internal'],
          getPublicKey: () => new ArrayBuffer(65),
          getPublicKeyAlgorithm: () => -7,
          getAuthenticatorData: () => new ArrayBuffer(37),
        },
        authenticatorAttachment: 'platform',
      });

      await service.register({
        userId: 'user123',
        userName: 'john@example.com',
        userDisplayName: 'John Smith',
      });

      service.deleteCredential('user123', 'to-delete');
      const credentials = service.getStoredCredentials('user123');
      expect(credentials).toHaveLength(0);
    });
  });

  describe('Challenge Generation', () => {
    it('should generate unique challenges', () => {
      const options1 = service.createRegistrationOptions({
        userId: 'user1',
        userName: 'user1@example.com',
        userDisplayName: 'User 1',
      });

      const options2 = service.createRegistrationOptions({
        userId: 'user2',
        userName: 'user2@example.com',
        userDisplayName: 'User 2',
      });

      const challenge1 = new Uint8Array(options1.publicKey.challenge as ArrayBuffer);
      const challenge2 = new Uint8Array(options2.publicKey.challenge as ArrayBuffer);

      expect(challenge1).not.toEqual(challenge2);
    });

    it('should generate 32-byte challenges', () => {
      const options = service.createRegistrationOptions({
        userId: 'user',
        userName: 'user@example.com',
        userDisplayName: 'User',
      });

      const challenge = options.publicKey.challenge as ArrayBuffer;
      expect(challenge.byteLength).toBe(32);
    });
  });

  describe('Error Handling', () => {
    it('should handle user cancellation', async () => {
      mockCredentialsCreate.mockRejectedValue(
        new DOMException('User cancelled', 'NotAllowedError')
      );

      await expect(service.register({
        userId: 'user',
        userName: 'user@example.com',
        userDisplayName: 'User',
      })).rejects.toThrow('NotAllowedError');
    });

    it('should handle no authenticator', async () => {
      mockCredentialsCreate.mockRejectedValue(
        new DOMException('No authenticator', 'InvalidStateError')
      );

      await expect(service.register({
        userId: 'user',
        userName: 'user@example.com',
        userDisplayName: 'User',
      })).rejects.toThrow('InvalidStateError');
    });
  });
});
