import { brotliCompressSync } from "zlib";

type TableRecord = {
  tag: string;
  offset: number;
  length: number;
  data: Buffer;
};

const ALIGN4 = (n: number): number => (n + 3) & ~3;

const readTables = (
  ttf: Buffer,
): { flavor: number; tables: TableRecord[]; totalSfntSize: number } => {
  const flavor = ttf.readUInt32BE(0);
  const numTables = ttf.readUInt16BE(4);

  const tables: TableRecord[] = [];
  for (let i = 0; i < numTables; i += 1) {
    const entryOffset = 12 + i * 16;
    const tag = ttf.toString("ascii", entryOffset, entryOffset + 4);
    const offset = ttf.readUInt32BE(entryOffset + 8);
    const length = ttf.readUInt32BE(entryOffset + 12);
    tables.push({ tag, offset, length, data: ttf.subarray(offset, offset + length) });
  }

  const tablesSize = tables.reduce((sum, t) => sum + ALIGN4(t.length), 0);
  const totalSfntSize = 12 + numTables * 16 + tablesSize;

  return { flavor, tables, totalSfntSize };
};

const writeBase128 = (value: number): Buffer => {
  if (value < 0 || value > 0x0fffffff) {
    throw new Error(`woff2: invalid base128 value ${value}`);
  }
  const bytes: number[] = [];
  let val = value;
  do {
    bytes.push(val & 0x7f);
    val >>>= 7;
  } while (val);

  for (let i = bytes.length - 1; i > 0; i -= 1) {
    bytes[i] |= 0x80;
  }

  return Buffer.from(bytes.reverse());
};

const buildDirectory = (tables: TableRecord[]): Buffer => {
  const parts: Buffer[] = [];

  tables.forEach((table) => {
    const flags = 0x3f; // custom tag, no transform
    parts.push(Buffer.from([flags]));
    parts.push(Buffer.from(table.tag, "ascii"));
    parts.push(writeBase128(table.length));
  });

  return Buffer.concat(parts);
};

export const ttfToWoff2 = (arr: Uint8Array): Buffer => {
  const ttf = Buffer.isBuffer(arr) ? arr : Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  const { flavor, tables, totalSfntSize } = readTables(ttf);

  const directory = buildDirectory(tables);
  const fontData = Buffer.concat(tables.map((t) => t.data));
  const compressedData = brotliCompressSync(fontData);

  const header = Buffer.alloc(48);
  header.write("wOF2", 0, "ascii");
  header.writeUInt32BE(flavor, 4);
  header.writeUInt32BE(48 + directory.length + compressedData.length, 8);
  header.writeUInt16BE(tables.length, 12);
  header.writeUInt16BE(0, 14); // reserved
  header.writeUInt32BE(totalSfntSize, 16);
  header.writeUInt32BE(compressedData.length, 20);
  header.writeUInt16BE(1, 24); // major version
  header.writeUInt16BE(0, 26); // minor version
  header.writeUInt32BE(0, 28); // metaOffset
  header.writeUInt32BE(0, 32); // metaLength
  header.writeUInt32BE(0, 36); // metaOrigLength
  header.writeUInt32BE(0, 40); // privOffset
  header.writeUInt32BE(0, 44); // privLength

  return Buffer.concat([header, directory, compressedData]);
};
