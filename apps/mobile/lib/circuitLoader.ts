// Circuit Asset Loader for React Native
// Loads compiled ZK circuits (wasm + zkey) from assets

// FileSystem is optional - only used in development builds
let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system');
} catch (e) {
  console.log('[CircuitLoader] expo-file-system not available');
}

import { Buffer } from '@craftzdog/react-native-buffer';

export type CircuitType = 'age' | 'nationality' | 'sanctions' | 'expiry' | 'passport';

interface CircuitAssets {
  wasmPath: string;
  zkeyPath: string;
  vkeyPath?: string;
}

// Circuit paths configuration - loaded dynamically at runtime
const CIRCUIT_PATHS: Record<CircuitType, { wasmName: string; zkeyName: string; vkeyName?: string; folder: string }> = {
  age: {
    folder: 'age_proof',
    wasmName: 'circuit.wasm',
    zkeyName: 'circuit_final.zkey',
    vkeyName: 'verification_key.json',
  },
  nationality: {
    folder: 'nationality_proof',
    wasmName: 'circuit.wasm',
    zkeyName: 'circuit_final.zkey',
    vkeyName: 'verification_key.json',
  },
  sanctions: {
    folder: 'sanctions',
    wasmName: 'sanctions_negative.wasm',
    zkeyName: 'sanctions_final.zkey',
  },
  expiry: {
    folder: 'expiry',
    wasmName: 'expiry_proof.wasm',
    zkeyName: 'expiry_proof_final.zkey',
  },
  passport: {
    folder: 'passport_verifier',
    wasmName: 'circuit.wasm',
    zkeyName: 'circuit_final.zkey',
    vkeyName: 'verification_key.json',
  },
};

/**
 * Load circuit assets and return local file paths
 * Note: In Expo Go, circuits cannot be bundled - use development build
 */
export async function loadCircuit(type: CircuitType): Promise<CircuitAssets> {
  const config = CIRCUIT_PATHS[type];
  
  // For Expo Go development, return placeholder paths
  // Real circuit loading requires a development build with native modules
  const basePath = `circuits/${config.folder}`;
  
  return {
    wasmPath: `${basePath}/${config.wasmName}`,
    zkeyPath: `${basePath}/${config.zkeyName}`,
    vkeyPath: config.vkeyName ? `${basePath}/${config.vkeyName}` : undefined,
  };
}

/**
 * Load circuit wasm as ArrayBuffer for snarkjs
 * Note: This requires circuits to be available in the document directory
 */
export async function loadCircuitWasm(type: CircuitType): Promise<ArrayBuffer> {
  const { wasmPath } = await loadCircuit(type);
  try {
    const wasmData = await FileSystem.readAsStringAsync(wasmPath, {
      encoding: 'base64',
    });
    return Buffer.from(wasmData, 'base64').buffer;
  } catch (e) {
    console.warn(`[CircuitLoader] Could not load wasm for ${type}, using empty buffer`);
    return new ArrayBuffer(0);
  }
}

/**
 * Load circuit zkey as ArrayBuffer for snarkjs
 */
export async function loadCircuitZkey(type: CircuitType): Promise<ArrayBuffer> {
  const { zkeyPath } = await loadCircuit(type);
  try {
    const zkeyData = await FileSystem.readAsStringAsync(zkeyPath, {
      encoding: 'base64',
    });
    return Buffer.from(zkeyData, 'base64').buffer;
  } catch (e) {
    console.warn(`[CircuitLoader] Could not load zkey for ${type}, using empty buffer`);
    return new ArrayBuffer(0);
  }
}

/**
 * Check if all circuit assets are available
 */
export async function preloadAllCircuits(): Promise<boolean> {
  try {
    const types: CircuitType[] = ['age', 'nationality', 'sanctions', 'passport'];
    await Promise.all(types.map(loadCircuit));
    console.log('[CircuitLoader] All circuits preloaded successfully');
    return true;
  } catch (error) {
    console.error('[CircuitLoader] Failed to preload circuits:', error);
    return false;
  }
}
