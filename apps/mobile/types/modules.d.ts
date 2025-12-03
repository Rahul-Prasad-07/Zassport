// Module declarations for packages without TypeScript types

declare module 'snarkjs' {
  export const groth16: {
    prove: (
      wasmBuffer: Uint8Array,
      zkeyBuffer: Uint8Array,
      witness: Record<string, bigint | bigint[] | string | string[]>
    ) => Promise<{
      proof: {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
        protocol: string;
        curve: string;
      };
      publicSignals: string[];
    }>;
    verify: (
      verificationKey: any,
      publicSignals: string[],
      proof: any
    ) => Promise<boolean>;
    fullProve: (
      input: Record<string, any>,
      wasmPath: string,
      zkeyPath: string
    ) => Promise<{
      proof: any;
      publicSignals: string[];
    }>;
  };
  export const plonk: {
    prove: (wasmPath: string, zkeyPath: string, witness: any) => Promise<any>;
    verify: (verificationKey: any, publicSignals: string[], proof: any) => Promise<boolean>;
  };
  export const zKey: {
    exportVerificationKey: (zkeyPath: string) => Promise<any>;
  };
}

declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<{
    (inputs: bigint[]): Uint8Array;
    F: {
      toString(v: Uint8Array): string;
      toObject(v: Uint8Array): bigint;
    };
  }>;
  export function buildBabyjub(): Promise<any>;
  export function buildEddsa(): Promise<any>;
  export function buildMimc7(): Promise<any>;
  export function buildPedersenHash(): Promise<any>;
}

declare module 'react-native-quick-crypto' {
  const crypto: {
    createHash(algorithm: string): {
      update(data: any): {
        digest(encoding?: 'hex' | 'base64'): string;
        digest(): any;
      };
    };
    createHmac(algorithm: string, key: any): {
      update(data: any): {
        digest(encoding?: 'hex' | 'base64'): string;
        digest(): any;
      };
    };
    randomBytes(size: number): any;
    createCipheriv(algorithm: string, key: any, iv: any): {
      update(data: any): any;
      final(): any;
    };
    createDecipheriv(algorithm: string, key: any, iv: any): {
      update(data: any): any;
      final(): any;
    };
    pbkdf2Sync(password: any, salt: any, iterations: number, keylen: number, digest: string): any;
  };
  export = crypto;
}

declare module '@craftzdog/react-native-buffer' {
  export class Buffer {
    static from(data: string | ArrayBuffer | Uint8Array | number[], encoding?: string): Buffer;
    static alloc(size: number, fill?: number): Buffer;
    static concat(buffers: Buffer[]): Buffer;
    static isBuffer(obj: any): obj is Buffer;
    
    length: number;
    
    toString(encoding?: string): string;
    slice(start?: number, end?: number): Buffer;
    subarray(start?: number, end?: number): Buffer;
    copy(target: Buffer, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
    readUInt8(offset: number): number;
    readUInt16BE(offset: number): number;
    readUInt32BE(offset: number): number;
    writeUInt8(value: number, offset: number): number;
    writeUInt16BE(value: number, offset: number): number;
    writeUInt32BE(value: number, offset: number): number;
    buffer: ArrayBuffer;
    [index: number]: number;
  }
}

// Extend NodeJS global for polyfills
declare global {
  var Buffer: typeof import('@craftzdog/react-native-buffer').Buffer;
  var process: {
    env: Record<string, string | undefined>;
    browser?: boolean;
    version?: string;
  };
}

export {};
