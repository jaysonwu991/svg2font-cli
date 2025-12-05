import { deflateRawSync } from "zlib";

type Entry = {
  name: string;
  modTime: number;
  modDate: number;
  crc32: number;
  compressed: Buffer;
  uncompressedSize: number;
};

const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (data: Buffer): number => {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    c = crc32Table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const toDosDateTime = (d: Date) => {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = Math.floor(d.getSeconds() / 2); // DOS stores seconds / 2

  const modTime = (hours << 11) | (minutes << 5) | seconds;
  const modDate = ((year - 1980) << 9) | (month << 5) | day;

  return { modTime, modDate };
};

export class ZipArchive {
  private entries: Entry[] = [];

  addFile(name: string, content: Buffer | string, mod: Date = new Date()) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
    const compressed = deflateRawSync(data);
    const { modTime, modDate } = toDosDateTime(mod);

    this.entries.push({
      name,
      compressed,
      crc32: crc32(data),
      modTime,
      modDate,
      uncompressedSize: data.length,
    });
  }

  generate(): Buffer {
    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;

    for (const entry of this.entries) {
      const nameBuf = Buffer.from(entry.name, "utf8");

      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0); // local file header signature
      local.writeUInt16LE(20, 4); // version needed to extract
      local.writeUInt16LE(0, 6); // general purpose bit flag
      local.writeUInt16LE(8, 8); // compression method (deflate)
      local.writeUInt16LE(entry.modTime, 10);
      local.writeUInt16LE(entry.modDate, 12);
      local.writeUInt32LE(entry.crc32, 14);
      local.writeUInt32LE(entry.compressed.length, 18);
      local.writeUInt32LE(entry.uncompressedSize, 22);
      local.writeUInt16LE(nameBuf.length, 26);
      local.writeUInt16LE(0, 28); // extra field length

      localParts.push(local, nameBuf, entry.compressed);

      const central = Buffer.alloc(46);
      central.writeUInt32LE(0x02014b50, 0); // central file header signature
      central.writeUInt16LE(0x0314, 4); // version made by
      central.writeUInt16LE(20, 6); // version needed to extract
      central.writeUInt16LE(0, 8); // general purpose
      central.writeUInt16LE(8, 10); // compression method
      central.writeUInt16LE(entry.modTime, 12);
      central.writeUInt16LE(entry.modDate, 14);
      central.writeUInt32LE(entry.crc32, 16);
      central.writeUInt32LE(entry.compressed.length, 20);
      central.writeUInt32LE(entry.uncompressedSize, 24);
      central.writeUInt16LE(nameBuf.length, 28);
      central.writeUInt16LE(0, 30); // extra length
      central.writeUInt16LE(0, 32); // file comment length
      central.writeUInt16LE(0, 34); // disk number start
      central.writeUInt16LE(0, 36); // internal file attrs
      central.writeUInt32LE(0, 38); // external file attrs
      central.writeUInt32LE(offset, 42); // relative offset

      centralParts.push(central, nameBuf);

      offset += local.length + nameBuf.length + entry.compressed.length;
    }

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const centralOffset = offset;

    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); // end of central dir signature
    end.writeUInt16LE(0, 4); // number of this disk
    end.writeUInt16LE(0, 6); // number of the disk with the start of central directory
    end.writeUInt16LE(this.entries.length, 8);
    end.writeUInt16LE(this.entries.length, 10);
    end.writeUInt32LE(centralSize, 12);
    end.writeUInt32LE(centralOffset, 16);
    end.writeUInt16LE(0, 20); // comment length

    return Buffer.concat([...localParts, ...centralParts, end]);
  }
}
