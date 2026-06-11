// 'file-type' es un paquete ESM-only cuyos tipos no resuelven bajo
// moduleResolution "node" (requeriría "node16"/"nodenext"/"bundler").
// Esta declaración ambient replica la firma usada por este servicio sin
// alterar el comportamiento en runtime.
declare module 'file-type' {
  export interface FileTypeResult {
    ext: string;
    mime: string;
  }
  export function fileTypeFromBuffer(
    buffer: Uint8Array | ArrayBuffer
  ): Promise<FileTypeResult | undefined>;
}
