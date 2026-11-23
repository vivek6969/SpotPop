declare module 'heic-decode' {
  export interface HeicDecodeOptions {
    buffer: Buffer | ArrayBuffer | Uint8Array;
  }

  export interface HeicDecodeResult {
    width: number;
    height: number;
    data: Uint8Array | ArrayBuffer;
  }

  export default function decode(options: HeicDecodeOptions): Promise<HeicDecodeResult>;
}
