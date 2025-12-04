import React, { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

/**
 * Biometric Authentication Hook for Mobile
 * Gates proof generation behind FaceID/TouchID/Fingerprint
 */

export interface BiometricConfig {
  enabled: boolean;
  promptMessage?: string;
  fallbackToPasscode?: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: 'fingerprint' | 'face' | 'iris';
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Get available biometric types
 */
export async function getBiometricTypes(): Promise<string[]> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return types.map(type => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'fingerprint';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'face';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'iris';
      default:
        return 'unknown';
    }
  });
}

/**
 * Authenticate user with biometrics
 */
export async function authenticateWithBiometrics(
  config: BiometricConfig = { enabled: true }
): Promise<BiometricAuthResult> {
  try {
    // Check if biometrics are available
    const available = await isBiometricAvailable();
    
    if (!available) {
      return {
        success: false,
        error: 'Biometric authentication not available on this device',
      };
    }

    // Perform authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: config.promptMessage || 'Authenticate to generate proof',
      fallbackLabel: config.fallbackToPasscode ? 'Use Passcode' : undefined,
      disableDeviceFallback: !config.fallbackToPasscode,
    });

    if (result.success) {
      const types = await getBiometricTypes();
      return {
        success: true,
        biometricType: types[0] as any,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Biometric authentication error',
    };
  }
}

/**
 * React hook for biometric authentication
 */
export function useBiometricAuth(config: BiometricConfig = { enabled: true }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const available = await isBiometricAvailable();
    setIsAvailable(available);

    if (available) {
      const types = await getBiometricTypes();
      setBiometricTypes(types);
    }
  };

  const authenticate = async (): Promise<BiometricAuthResult> => {
    if (!config.enabled) {
      return { success: true };
    }

    setIsAuthenticating(true);
    try {
      const result = await authenticateWithBiometrics(config);
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    isAvailable,
    biometricTypes,
    isAuthenticating,
    authenticate,
  };
}

/**
 * Biometric-gated proof generation wrapper
 */
export async function generateProofWithBiometric<T>(
  proofGenerator: () => Promise<T>,
  config: BiometricConfig = { enabled: true }
): Promise<{ success: boolean; proof?: T; error?: string }> {
  try {
    // Authenticate first
    const authResult = await authenticateWithBiometrics(config);

    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error || 'Biometric authentication failed',
      };
    }

    // Generate proof
    const proof = await proofGenerator();

    return {
      success: true,
      proof,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Proof generation failed',
    };
  }
}

/**
 * Secure component that requires biometric auth
 */
export function BiometricGate({
  children,
  onAuthSuccess,
  onAuthFailure,
  config = { enabled: true },
}: {
  children: React.ReactNode;
  onAuthSuccess?: () => void;
  onAuthFailure?: (error: string) => void;
  config?: BiometricConfig;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAvailable, authenticate } = useBiometricAuth(config);

  useEffect(() => {
    if (config.enabled && isAvailable) {
      performAuth();
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  const performAuth = async () => {
    const result = await authenticate();
    
    if (result.success) {
      setIsAuthenticated(true);
      onAuthSuccess?.();
    } else {
      Alert.alert(
        'Authentication Failed',
        result.error || 'Please try again',
        [
          {
            text: 'Retry',
            onPress: performAuth,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => onAuthFailure?.(result.error || 'Authentication cancelled'),
          },
        ]
      );
    }
  };

  if (!isAuthenticated) {
    return null; // Or show loading/auth screen
  }

  return <>{children}</>;
}

/**
 * Example usage in proof generation screen
 */
export function ExampleUsage() {
  const { authenticate } = useBiometricAuth({
    enabled: true,
    promptMessage: 'Verify your identity to generate proof',
    fallbackToPasscode: true,
  });

  const handleGenerateProof = async () => {
    const result = await generateProofWithBiometric(
      async () => {
        // Your proof generation logic here
        return { proof: 'mock_proof', publicSignals: [] };
      },
      {
        enabled: true,
        promptMessage: 'Authenticate to generate age proof',
      }
    );

    if (result.success) {
      console.log('Proof generated:', result.proof);
    } else {
      console.error('Failed:', result.error);
    }
  };

  return null; // Your UI here
}
