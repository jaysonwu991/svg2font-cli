/**
 * ByteBuffer - Big-endian binary buffer writer
 * Used for building font file binary data
 */
export class ByteBuffer {
  private buf: Buffer;
  private offset = 0;

  constructor(size: number) {
    this.buf = Buffer.alloc(size);
  }

  writeUint8(value: number): void {
    this.buf.writeUInt8(value & 0xff, this.offset);
    this.offset += 1;
  }

  writeInt8(value: number): void {
    this.buf.writeInt8(value, this.offset);
    this.offset += 1;
  }

  writeUint16(value: number): void {
    this.buf.writeUInt16BE(value & 0xffff, this.offset);
    this.offset += 2;
  }

  writeInt16(value: number): void {
    this.buf.writeInt16BE(value, this.offset);
    this.offset += 2;
  }

  writeUint32(value: number): void {
    this.buf.writeUInt32BE(value >>> 0, this.offset);
    this.offset += 4;
  }

  writeInt32(value: number): void {
    this.buf.writeInt32BE(value, this.offset);
    this.offset += 4;
  }

  writeUint64(value: number): void {
    const hi = Math.floor(value / 4294967296);
    const lo = Math.floor(value - hi * 4294967296);
    this.writeUint32(hi);
    this.writeUint32(lo);
  }

  writeBytes(data: Uint8Array | Buffer | number[]): void {
    const src = Buffer.isBuffer(data) ? data : Buffer.from(data);
    src.copy(this.buf, this.offset);
    this.offset += src.length;
  }

  tell(): number {
    return this.offset;
  }

  seek(pos: number): void {
    this.offset = pos;
  }

  getUint32(pos: number): number {
    return this.buf.readUInt32BE(pos);
  }

  getUint8(pos: number): number {
    return this.buf.readUInt8(pos);
  }

  setUint32(pos: number, value: number): void {
    this.buf.writeUInt32BE(value >>> 0, pos);
  }

  toBuffer(): Buffer {
    return this.buf;
  }

  get length(): number {
    return this.buf.length;
  }
}
