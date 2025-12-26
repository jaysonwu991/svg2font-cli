import { deflateSync } from "zlib";
import { DEFAULT_UNITS_PER_EM } from "../../core/svg-font-generator";
import { GlyphMeta } from "../../types";
import { ByteBuffer } from "./binary-writer";
import { buildFontFromGlyphs, Font, Glyph } from "./ttf-builder";
import {
  simplifyContours,
  interpolateContours,
  roundPoints,
  removeClosingReturnPoints,
  toRelative,
  TtfContour,
} from "./svg-to-ttf-path";

const toInt = (value: number): number => Math.trunc(value);

/**
 * Converts a string to a 32-bit identifier
 */
const identifier = (str: string, littleEndian = false): number => {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result <<= 8;
    const index = littleEndian ? str.length - i - 1 : i;
    result += str.charCodeAt(index);
  }
  return result >>> 0;
};

const ulong = (t: number): number => {
  let res = t >>> 0;
  if (res < 0) res += 0x100000000;
  return res;
};

const calcChecksum = (buf: Buffer): number => {
  let sum = 0;
  const nlongs = Math.floor(buf.length / 4);

  for (let i = 0; i < nlongs; i++) {
    sum = ulong(sum + buf.readUInt32BE(i * 4));
  }

  const leftBytes = buf.length - nlongs * 4;
  if (leftBytes > 0) {
    let leftRes = 0;
    for (let i = 0; i < 4; i++) {
      const byte = i < leftBytes ? buf[nlongs * 4 + i] : 0;
      leftRes = (leftRes << 8) + byte;
    }
    sum = ulong(sum + leftRes);
  }

  return sum;
};

const getFlags = (glyph: Glyph): number[] => {
  const result: number[] = [];
  glyph.ttfContours.forEach((contour) => {
    contour.forEach((point) => {
      let flag = point.onCurve ? 1 : 0;

      if (point.x === 0) {
        flag += 16;
      } else {
        if (-0xff <= point.x && point.x <= 0xff) {
          flag += 2;
        }
        if (point.x > 0 && point.x <= 0xff) {
          flag += 16;
        }
      }

      if (point.y === 0) {
        flag += 32;
      } else {
        if (-0xff <= point.y && point.y <= 0xff) {
          flag += 4;
        }
        if (point.y > 0 && point.y <= 0xff) {
          flag += 32;
        }
      }
      result.push(flag);
    });
  });
  return result;
};

const compactFlags = (flags: number[]): number[] => {
  const result: number[] = [];
  let prevFlag = -1;
  let firstRepeat = false;

  flags.forEach((flag) => {
    if (prevFlag === flag) {
      if (firstRepeat) {
        result[result.length - 1] += 8;
        result.push(1);
        firstRepeat = false;
      } else {
        result[result.length - 1]++;
      }
    } else {
      firstRepeat = true;
      prevFlag = flag;
      result.push(flag);
    }
  });
  return result;
};

const getCoords = (glyph: Glyph, coordName: "x" | "y"): number[] => {
  const result: number[] = [];
  glyph.ttfContours.forEach((contour) => {
    contour.forEach((point) => result.push(point[coordName]));
  });
  return result;
};

const compactCoords = (coords: number[]): number[] => coords.filter((coord) => coord !== 0);

const glyphDataSize = (glyph: Glyph): number => {
  if (!glyph.contours.length) return 0;

  let result = 12;
  result += glyph.contours.length * 2;

  glyph.ttf_x.forEach((x) => {
    result += -0xff <= x && x <= 0xff ? 1 : 2;
  });

  glyph.ttf_y.forEach((y) => {
    result += -0xff <= y && y <= 0xff ? 1 : 2;
  });

  result += glyph.ttf_flags.length;

  if (result % 4 !== 0) {
    result += 4 - (result % 4);
  }
  return result;
};

const glyfTableSize = (font: Font): number => {
  let result = 0;
  font.glyphs.forEach((glyph) => {
    glyph.ttf_size = glyphDataSize(glyph);
    result += glyph.ttf_size;
  });
  font.ttf_glyph_size = result;
  return result;
};

const createGlyfTable = (font: Font): Buffer => {
  font.glyphs.forEach((glyph) => {
    glyph.ttf_flags = compactFlags(getFlags(glyph));
    glyph.ttf_x = compactCoords(getCoords(glyph, "x"));
    glyph.ttf_y = compactCoords(getCoords(glyph, "y"));
  });

  const buf = new ByteBuffer(glyfTableSize(font));

  font.glyphs.forEach((glyph) => {
    if (!glyph.contours.length) {
      return;
    }

    const offset = buf.tell();

    buf.writeInt16(glyph.contours.length);
    buf.writeInt16(glyph.xMin);
    buf.writeInt16(glyph.yMin);
    buf.writeInt16(glyph.xMax);
    buf.writeInt16(glyph.yMax);

    let endPtsOfContours = -1;
    glyph.ttfContours.forEach((contour) => {
      endPtsOfContours += contour.length;
      buf.writeInt16(endPtsOfContours);
    });

    buf.writeInt16(0);
    glyph.ttf_flags.forEach((flag) => buf.writeInt8(flag));

    glyph.ttf_x.forEach((x) => {
      if (-0xff <= x && x <= 0xff) {
        buf.writeUint8(Math.abs(x));
      } else {
        buf.writeInt16(x);
      }
    });

    glyph.ttf_y.forEach((y) => {
      if (-0xff <= y && y <= 0xff) {
        buf.writeUint8(Math.abs(y));
      } else {
        buf.writeInt16(y);
      }
    });

    let tail = (buf.tell() - offset) % 4;
    if (tail !== 0) {
      for (; tail < 4; tail++) {
        buf.writeUint8(0);
      }
    }
  });

  return buf.toBuffer();
};

const createLocaTable = (font: Font): Buffer => {
  const isShortFormat = font.ttf_glyph_size < 0x20000;
  const buf = new ByteBuffer((font.glyphs.length + 1) * (isShortFormat ? 2 : 4));
  let location = 0;

  font.glyphs.forEach((glyph) => {
    if (isShortFormat) {
      buf.writeUint16(location);
      location += glyph.ttf_size / 2;
    } else {
      buf.writeUint32(location);
      location += glyph.ttf_size;
    }
  });

  if (isShortFormat) {
    buf.writeUint16(location);
  } else {
    buf.writeUint32(location);
  }

  return buf.toBuffer();
};

const dateToUInt64 = (date: Date): number => {
  const startDate = new Date("1904-01-01T00:00:00.000Z");
  return Math.floor((date.getTime() - startDate.getTime()) / 1000);
};

const createHeadTable = (font: Font): Buffer => {
  const buf = new ByteBuffer(54);
  buf.writeInt32(0x10000);
  buf.writeInt32(font.revision * 0x10000);
  buf.writeUint32(0);
  buf.writeUint32(0x5f0f3cf5);
  buf.writeUint16(0x000b);
  buf.writeUint16(font.unitsPerEm);
  buf.writeUint64(dateToUInt64(font.createdDate));
  buf.writeUint64(dateToUInt64(font.modifiedDate));
  buf.writeInt16(font.xMin);
  buf.writeInt16(font.yMin);
  buf.writeInt16(font.xMax);
  buf.writeInt16(font.yMax);
  buf.writeUint16(font.macStyle);
  buf.writeUint16(font.lowestRecPPEM);
  buf.writeInt16(2);
  buf.writeInt16(font.ttf_glyph_size < 0x20000 ? 0 : 1);
  buf.writeInt16(0);
  return buf.toBuffer();
};

const createHHeadTable = (font: Font): Buffer => {
  const buf = new ByteBuffer(36);
  buf.writeInt32(0x10000);
  buf.writeInt16(font.ascent);
  buf.writeInt16(font.descent);
  buf.writeInt16(0);
  buf.writeUint16(font.maxWidth);
  buf.writeInt16(font.minLsb);
  buf.writeInt16(font.minRsb);
  buf.writeInt16(font.maxExtent);
  buf.writeInt16(1);
  buf.writeInt16(0);
  buf.writeUint32(0);
  buf.writeUint32(0);
  buf.writeUint16(0);
  buf.writeInt16(0);
  buf.writeUint16(font.glyphs.length);
  return buf.toBuffer();
};

const createHtmxTable = (font: Font): Buffer => {
  const buf = new ByteBuffer(font.glyphs.length * 4);
  font.glyphs.forEach((glyph) => {
    buf.writeUint16(glyph.width);
    buf.writeInt16(glyph.xMin);
  });
  return buf.toBuffer();
};

const getMaxPoints = (font: Font): number =>
  Math.max(
    ...font.glyphs.map((glyph) => glyph.ttfContours.reduce((sum, ctr) => sum + ctr.length, 0)),
    0,
  );

const getMaxContours = (font: Font): number =>
  Math.max(...font.glyphs.map((glyph) => glyph.ttfContours.length), 0);

const createMaxpTable = (font: Font): Buffer => {
  const buf = new ByteBuffer(32);
  buf.writeInt32(0x10000);
  buf.writeUint16(font.glyphs.length);
  buf.writeUint16(getMaxPoints(font));
  buf.writeUint16(getMaxContours(font));
  buf.writeUint16(0);
  buf.writeUint16(0);
  buf.writeUint16(2);
  buf.writeUint16(0);
  buf.writeUint16(10);
  buf.writeUint16(10);
  buf.writeUint16(0);
  buf.writeUint16(255);
  buf.writeUint16(0);
  buf.writeUint16(0);
  buf.writeUint16(0);
  return buf.toBuffer();
};

class Str {
  constructor(private str: string) {}

  toUTF8Bytes(): number[] {
    const byteArray: number[] = [];
    for (let i = 0; i < this.str.length; i++) {
      if (this.str.charCodeAt(i) <= 0x7f) {
        byteArray.push(this.str.charCodeAt(i));
      } else {
        const h = encodeURIComponent(this.str.charAt(i)).substr(1).split("%");
        h.forEach((item) => byteArray.push(parseInt(item, 16)));
      }
    }
    return byteArray;
  }

  toUCS2Bytes(): number[] {
    const byteArray: number[] = [];
    for (let i = 0; i < this.str.length; i++) {
      const ch = this.str.charCodeAt(i);
      byteArray.push(ch >> 8);
      byteArray.push(ch & 0xff);
    }
    return byteArray;
  }
}

const TTF_NAMES = {
  COPYRIGHT: 0,
  FONT_FAMILY: 1,
  ID: 3,
  DESCRIPTION: 10,
  URL_VENDOR: 11,
};

const getStrings = (name: string, id: number) => {
  const str = new Str(name);
  return [
    { data: str.toUTF8Bytes(), id, platformID: 1, encodingID: 0, languageID: 0 },
    { data: str.toUCS2Bytes(), id, platformID: 3, encodingID: 1, languageID: 0x409 },
  ];
};

const getNames = (font: Font) => {
  const result: Array<{
    data: number[];
    id: number;
    platformID: number;
    encodingID: number;
    languageID: number;
  }> = [];
  if (font.copyright) result.push(...getStrings(font.copyright, TTF_NAMES.COPYRIGHT));
  if (font.familyName) result.push(...getStrings(font.familyName, TTF_NAMES.FONT_FAMILY));
  if (font.id) result.push(...getStrings(font.id, TTF_NAMES.ID));
  result.push(...getStrings(font.description, TTF_NAMES.DESCRIPTION));
  result.push(...getStrings(font.url, TTF_NAMES.URL_VENDOR));
  font.sfntNames.forEach((sfntName) => result.push(...getStrings(sfntName.value, sfntName.id)));

  result.sort((a, b) => {
    const fields: Array<"platformID" | "encodingID" | "languageID" | "id"> = [
      "platformID",
      "encodingID",
      "languageID",
      "id",
    ];
    for (const field of fields) {
      if (a[field] !== b[field]) return a[field] < b[field] ? -1 : 1;
    }
    return 0;
  });

  return result;
};

const createNameTable = (font: Font): Buffer => {
  const names = getNames(font);
  const buf = new ByteBuffer(6 + names.reduce((sum, name) => sum + 12 + name.data.length, 0));

  buf.writeUint16(0);
  buf.writeUint16(names.length);
  const offsetPosition = buf.tell();
  buf.writeUint16(0);

  let nameOffset = 0;
  names.forEach((name) => {
    buf.writeUint16(name.platformID);
    buf.writeUint16(name.encodingID);
    buf.writeUint16(name.languageID);
    buf.writeUint16(name.id);
    buf.writeUint16(name.data.length);
    buf.writeUint16(nameOffset);
    nameOffset += name.data.length;
  });

  const actualStringDataOffset = buf.tell();
  names.forEach((name) => buf.writeBytes(name.data));

  buf.seek(offsetPosition);
  buf.writeUint16(actualStringDataOffset);

  return buf.toBuffer();
};

const getFirstCharIndex = (font: Font): number => {
  const codePoints = Object.keys(font.codePoints).map((c) => parseInt(c, 10));
  if (!codePoints.length) return 0;
  return Math.max(0, Math.min(0xffff, Math.abs(Math.min(...codePoints))));
};

const getLastCharIndex = (font: Font): number => {
  const codePoints = Object.keys(font.codePoints).map((c) => parseInt(c, 10));
  if (!codePoints.length) return 0;
  return Math.max(0, Math.min(0xffff, Math.abs(Math.max(...codePoints))));
};

const createOS2Table = (font: Font): Buffer => {
  const maxContext =
    font.ligatures.map((l) => l.unicode.length).reduce((a, b) => Math.max(a, b), 2) || 2;

  const buf = new ByteBuffer(96);
  buf.writeUint16(4);
  buf.writeInt16(font.avgWidth);
  buf.writeUint16(font.weightClass);
  buf.writeUint16(font.widthClass);
  buf.writeInt16(font.fsType);
  buf.writeInt16(font.ySubscriptXSize);
  buf.writeInt16(font.ySubscriptYSize);
  buf.writeInt16(font.ySubscriptXOffset);
  buf.writeInt16(font.ySubscriptYOffset);
  buf.writeInt16(font.ySuperscriptXSize);
  buf.writeInt16(font.ySuperscriptYSize);
  buf.writeInt16(font.ySuperscriptXOffset);
  buf.writeInt16(font.ySuperscriptYOffset);
  buf.writeInt16(font.yStrikeoutSize);
  buf.writeInt16(font.yStrikeoutPosition);
  buf.writeInt16(font.familyClass);
  buf.writeUint8(font.panose.familyType);
  buf.writeUint8(font.panose.serifStyle);
  buf.writeUint8(font.panose.weight);
  buf.writeUint8(font.panose.proportion);
  buf.writeUint8(font.panose.contrast);
  buf.writeUint8(font.panose.strokeVariation);
  buf.writeUint8(font.panose.armStyle);
  buf.writeUint8(font.panose.letterform);
  buf.writeUint8(font.panose.midline);
  buf.writeUint8(font.panose.xHeight);
  buf.writeUint32(0);
  buf.writeUint32(0);
  buf.writeUint32(0);
  buf.writeUint32(0);
  buf.writeUint32(identifier("PfEd"));
  buf.writeUint16(font.fsSelection);
  buf.writeUint16(getFirstCharIndex(font));
  buf.writeUint16(getLastCharIndex(font));
  buf.writeInt16(font.ascent);
  buf.writeInt16(font.descent);
  buf.writeInt16(font.lineGap);
  buf.writeInt16(Math.max(font.yMax, font.ascent + font.lineGap));
  buf.writeInt16(-Math.min(font.yMin, font.descent));
  buf.writeInt32(1);
  buf.writeInt32(0);
  buf.writeInt16(font.xHeight);
  buf.writeInt16(font.capHeight);
  buf.writeUint16(0);
  buf.writeUint16(0);
  buf.writeUint16(maxContext);
  return buf.toBuffer();
};

const createPostTable = (font: Font): Buffer => {
  const names: number[][] = [];
  font.glyphs.forEach((glyph) => {
    if (glyph.unicode !== 0) {
      const str = glyph.name || "";
      const len = str.length < 256 ? str.length : 255;
      const bytes: number[] = [len];
      for (let i = 0; i < len; i++) {
        const char = str.charCodeAt(i);
        bytes.push(char < 128 ? char : 95);
      }
      names.push(bytes);
    }
  });

  const buf = new ByteBuffer(
    36 + font.glyphs.length * 2 + names.reduce((sum, name) => sum + name.length, 0),
  );

  buf.writeInt32(0x20000);
  buf.writeInt32(font.italicAngle);
  buf.writeInt16(font.underlinePosition);
  buf.writeInt16(font.underlineThickness);
  buf.writeUint32(font.isFixedPitch);
  buf.writeUint32(0);
  buf.writeUint32(0);
  buf.writeUint32(0);
  buf.writeUint32(0);
  buf.writeUint16(font.glyphs.length);

  let index = 258;
  font.glyphs.forEach((glyph) => {
    if (glyph.unicode === 0) {
      buf.writeUint16(0);
    } else {
      buf.writeUint16(index++);
    }
  });

  names.forEach((name) => buf.writeBytes(name));
  return buf.toBuffer();
};

const getCodePointEntries = (font: Font, bounds = Number.MAX_VALUE) => {
  const entries = Object.entries(font.codePoints).map(([unicode, glyph]) => ({
    unicode: parseInt(unicode, 10),
    glyph,
  }));
  return entries.filter((entry) => entry.unicode <= bounds).sort((a, b) => a.unicode - b.unicode);
};

const getSegments = (font: Font, bounds?: number) => {
  const result: Array<{ start: number; end: number; length?: number }> = [];
  let segment: { start: number; end: number } | null = null;
  const entries = getCodePointEntries(font, bounds ?? Number.MAX_VALUE);

  entries.forEach((entry) => {
    const unicode = entry.unicode;
    if (!segment || unicode !== segment.end + 1) {
      if (segment) {
        result.push(segment);
      }
      segment = { start: unicode, end: unicode };
    } else {
      segment.end = unicode;
    }
  });

  if (segment) {
    result.push(segment);
  }

  result.forEach((seg) => {
    seg.length = seg.end - seg.start + 1;
  });
  return result;
};

const bufferForTable = (
  format: number,
  length: number,
): { buffer: ByteBuffer; writer: (val: number) => void } => {
  const fieldWidth = format === 8 || format === 10 || format === 12 || format === 13 ? 4 : 2;
  const totalLength = length + fieldWidth * 3;
  const buffer = new ByteBuffer(totalLength);
  const writer =
    fieldWidth === 4 ? buffer.writeUint32.bind(buffer) : buffer.writeUint16.bind(buffer);

  buffer.writeUint16(format);
  if (fieldWidth === 4) {
    buffer.writeUint16(0);
  }
  writer(totalLength);
  writer(0);

  return { buffer, writer };
};

const getIDByUnicode = (font: Font, unicode: number): number =>
  font.codePoints[unicode] ? font.codePoints[unicode].id : 0;

const createFormat0Table = (font: Font): Buffer => {
  const length = 0xff + 1;
  const { buffer } = bufferForTable(0, length);
  for (let i = 0; i < length; i++) {
    buffer.writeUint8(getIDByUnicode(font, i));
  }
  return buffer.toBuffer();
};

const createFormat4Table = (font: Font): Buffer => {
  const segments = getSegments(font, 0xffff);
  const glyphIndexArrays: number[][] = [];

  segments.forEach((segment) => {
    const glyphIndexArray: number[] = [];
    for (let unicode = segment.start; unicode <= segment.end; unicode++) {
      glyphIndexArray.push(getIDByUnicode(font, unicode));
    }
    glyphIndexArrays.push(glyphIndexArray);
  });

  const segCount = segments.length + 1;
  const glyphIndexArrayLength = glyphIndexArrays.reduce((sum, arr) => sum + arr.length, 0);
  const length =
    2 +
    2 +
    2 +
    2 +
    2 * segCount +
    2 +
    2 * segCount +
    2 * segCount +
    2 * segCount +
    2 * glyphIndexArrayLength;

  const { buffer } = bufferForTable(4, length);

  buffer.writeUint16(segCount * 2);
  const maxExponent = Math.floor(Math.log(segCount) / Math.LN2);
  const searchRange = 2 * Math.pow(2, maxExponent);
  buffer.writeUint16(searchRange);
  buffer.writeUint16(maxExponent);
  buffer.writeUint16(2 * segCount - searchRange);

  segments.forEach((segment) => buffer.writeUint16(segment.end));
  buffer.writeUint16(0xffff);
  buffer.writeUint16(0);

  segments.forEach((segment) => buffer.writeUint16(segment.start));
  buffer.writeUint16(0xffff);

  for (let i = 0; i < segments.length; i++) {
    buffer.writeUint16(0);
  }
  buffer.writeUint16(1);

  let offset = 0;
  for (let i = 0; i < segments.length; i++) {
    buffer.writeUint16(2 * (segments.length - i + 1 + offset));
    offset += glyphIndexArrays[i].length;
  }
  buffer.writeUint16(0);

  glyphIndexArrays.forEach((glyphIndexArray) => {
    glyphIndexArray.forEach((glyphId) => buffer.writeUint16(glyphId));
  });

  return buffer.toBuffer();
};

const createFormat12Table = (font: Font): Buffer => {
  const codePoints = getCodePointEntries(font);
  const length = 4 + 12 * codePoints.length;
  const { buffer } = bufferForTable(12, length);

  buffer.writeUint32(codePoints.length);
  codePoints.forEach((codePoint) => {
    buffer.writeUint32(codePoint.unicode);
    buffer.writeUint32(codePoint.unicode);
    buffer.writeUint32(codePoint.glyph.id);
  });

  return buffer.toBuffer();
};

const createCMapTable = (font: Font): Buffer => {
  const TABLE_HEAD = 2 + 2 + 4;

  const singleByteTable = createFormat0Table(font);
  const twoByteTable = createFormat4Table(font);
  const fourByteTable = createFormat12Table(font);

  const tableHeaders = [
    { platformID: 0, encodingID: 3, table: twoByteTable },
    { platformID: 0, encodingID: 4, table: fourByteTable },
    { platformID: 1, encodingID: 0, table: singleByteTable },
    { platformID: 3, encodingID: 1, table: twoByteTable },
    { platformID: 3, encodingID: 10, table: fourByteTable },
  ];

  const tables = [twoByteTable, singleByteTable, fourByteTable];

  let tableOffset = 2 + 2 + tableHeaders.length * TABLE_HEAD;
  tables.forEach((table: any) => {
    table._tableOffset = tableOffset;
    tableOffset += table.length;
  });

  const buf = new ByteBuffer(tableOffset);
  buf.writeUint16(0);
  buf.writeUint16(tableHeaders.length);

  tableHeaders.forEach((header) => {
    buf.writeUint16(header.platformID);
    buf.writeUint16(header.encodingID);
    buf.writeUint32((header.table as any)._tableOffset);
  });

  tables.forEach((table: any) => {
    buf.writeBytes(table);
  });
  return buf.toBuffer();
};

const TABLES = [
  { innerName: "OS/2", order: 4, create: createOS2Table },
  { innerName: "cmap", order: 6, create: createCMapTable },
  { innerName: "glyf", order: 8, create: createGlyfTable },
  { innerName: "head", order: 2, create: createHeadTable },
  { innerName: "hhea", order: 1, create: createHHeadTable },
  { innerName: "hmtx", order: 5, create: createHtmxTable },
  { innerName: "loca", order: 7, create: createLocaTable },
  { innerName: "maxp", order: 3, create: createMaxpTable },
  { innerName: "name", order: 9, create: createNameTable },
  { innerName: "post", order: 10, create: createPostTable },
];

const CONST = {
  VERSION: 0x10000,
  CHECKSUM_ADJUSTMENT: 0xb1b0afba,
};

const generateTtf = (font: Font): Buffer => {
  font.glyphs.forEach((glyph) => {
    glyph.ttfContours = glyph.contours.map((contour) => contour.points);
  });

  font.glyphs.forEach((glyph) => {
    glyph.ttfContours = simplifyContours(glyph.ttfContours, 0.3);
    glyph.ttfContours = simplifyContours(glyph.ttfContours, 0.3);
    glyph.ttfContours = interpolateContours(glyph.ttfContours, 1.1);
    glyph.ttfContours = roundPoints(glyph.ttfContours);
    glyph.ttfContours = removeClosingReturnPoints(glyph.ttfContours);
    glyph.ttfContours = toRelative(glyph.ttfContours);
  });

  const tables = TABLES.map((table) => {
    const buffer = table.create(font);
    const length = buffer.length;
    const corLength = length + ((4 - (length % 4)) % 4);
    const checkSum = calcChecksum(buffer);
    return { ...table, buffer, length, corLength, checkSum };
  });

  const headerSize = 12 + 16 * tables.length;
  let bufSize = headerSize;
  tables.forEach((table) => {
    bufSize += table.corLength;
  });

  let offset = headerSize;
  tables
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((table) => {
      (table as any).offset = offset;
      offset += table.corLength;
    });

  const buf = new ByteBuffer(bufSize);
  const entrySelector = Math.floor(Math.log(tables.length) / Math.LN2);
  const searchRange = Math.pow(2, entrySelector) * 16;
  const rangeShift = tables.length * 16 - searchRange;

  buf.writeUint32(CONST.VERSION);
  buf.writeUint16(tables.length);
  buf.writeUint16(searchRange);
  buf.writeUint16(entrySelector);
  buf.writeUint16(rangeShift);

  tables.forEach((table) => {
    buf.writeUint32(identifier(table.innerName));
    buf.writeUint32(table.checkSum);
    buf.writeUint32((table as any).offset);
    buf.writeUint32(table.length);
  });

  let headOffset = 0;
  tables
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((table) => {
      if (table.innerName === "head") {
        headOffset = buf.tell();
      }
      buf.writeBytes(table.buffer);
      for (let i = table.length; i < table.corLength; i++) {
        buf.writeUint8(0);
      }
    });

  buf.setUint32(headOffset + 8, ulong(CONST.CHECKSUM_ADJUSTMENT - calcChecksum(buf.toBuffer())));
  return buf.toBuffer();
};

const longAlign = (n: number): number => (n + 3) & ~3;

const calcWoffChecksum = (buf: Buffer): number => {
  let sum = 0;
  const nlongs = buf.length / 4;
  for (let i = 0; i < nlongs; i++) {
    const t = buf.readUInt32BE(i * 4);
    sum = ulong(sum + t);
  }
  return sum;
};

export const ttfToWoff = (arr: Uint8Array, options: { metadata?: Buffer } = {}): Buffer => {
  const input = Buffer.from(arr.buffer, arr.byteOffset, arr.length);
  const version = { maj: 0, min: 1 };
  const numTables = input.readUInt16BE(4);
  let flavor = 0x10000;

  const SIZEOF = {
    WOFF_HEADER: 44,
    WOFF_ENTRY: 20,
    SFNT_HEADER: 12,
    SFNT_TABLE_ENTRY: 16,
  };

  const WOFF_OFFSET = {
    MAGIC: 0,
    FLAVOR: 4,
    SIZE: 8,
    NUM_TABLES: 12,
    RESERVED: 14,
    SFNT_SIZE: 16,
    VERSION_MAJ: 20,
    VERSION_MIN: 22,
    META_OFFSET: 24,
    META_LENGTH: 28,
    META_ORIG_LENGTH: 32,
    PRIV_OFFSET: 36,
    PRIV_LENGTH: 40,
  };

  const WOFF_ENTRY_OFFSET = {
    TAG: 0,
    OFFSET: 4,
    COMPR_LENGTH: 8,
    LENGTH: 12,
    CHECKSUM: 16,
  };

  const SFNT_OFFSET = {
    TAG: 0,
    CHECKSUM: 4,
    OFFSET: 8,
    LENGTH: 12,
  };

  const SFNT_ENTRY_OFFSET = {
    FLAVOR: 0,
    VERSION_MAJ: 4,
    VERSION_MIN: 6,
    CHECKSUM_ADJUSTMENT: 8,
  };

  const MAGIC = { WOFF: 0x774f4646, CHECKSUM_ADJUSTMENT: 0xb1b0afba };

  let woffHeader = Buffer.alloc(SIZEOF.WOFF_HEADER);
  woffHeader.writeUInt32BE(MAGIC.WOFF, WOFF_OFFSET.MAGIC);
  woffHeader.writeUInt16BE(numTables, WOFF_OFFSET.NUM_TABLES);
  woffHeader.writeUInt16BE(0, WOFF_OFFSET.RESERVED);
  woffHeader.writeUInt32BE(0, WOFF_OFFSET.SFNT_SIZE);
  woffHeader.writeUInt32BE(0, WOFF_OFFSET.META_OFFSET);
  woffHeader.writeUInt32BE(0, WOFF_OFFSET.META_LENGTH);
  woffHeader.writeUInt32BE(0, WOFF_OFFSET.META_ORIG_LENGTH);
  woffHeader.writeUInt32BE(0, WOFF_OFFSET.PRIV_OFFSET);
  woffHeader.writeUInt32BE(0, WOFF_OFFSET.PRIV_LENGTH);

  const entries: Array<{ Tag: Buffer; checkSum: number; Offset: number; Length: number }> = [];
  for (let i = 0; i < numTables; i++) {
    const data = input.subarray(SIZEOF.SFNT_HEADER + i * SIZEOF.SFNT_TABLE_ENTRY);
    entries.push({
      Tag: data.subarray(SFNT_OFFSET.TAG, SFNT_OFFSET.TAG + 4),
      checkSum: data.readUInt32BE(SFNT_OFFSET.CHECKSUM),
      Offset: data.readUInt32BE(SFNT_OFFSET.OFFSET),
      Length: data.readUInt32BE(SFNT_OFFSET.LENGTH),
    });
  }

  entries.sort((a, b) => {
    const aStr = String.fromCharCode.apply(null, a.Tag as any);
    const bStr = String.fromCharCode.apply(null, b.Tag as any);
    if (aStr === bStr) return 0;
    return aStr < bStr ? -1 : 1;
  });

  let offset = SIZEOF.WOFF_HEADER + numTables * SIZEOF.WOFF_ENTRY;
  let woffSize = offset;
  let sfntSize = SIZEOF.SFNT_HEADER + numTables * SIZEOF.SFNT_TABLE_ENTRY;
  const tableBuf = Buffer.alloc(numTables * SIZEOF.WOFF_ENTRY);

  for (let i = 0; i < numTables; i++) {
    const entry = entries[i];
    if (String.fromCharCode.apply(null, entry.Tag as any) !== "head") {
      const algnTable = input.subarray(entry.Offset, entry.Offset + longAlign(entry.Length));
      if (calcWoffChecksum(algnTable) !== entry.checkSum) {
        throw new Error(`Checksum error in ${String.fromCharCode.apply(null, entry.Tag as any)}`);
      }
    }

    tableBuf.writeUInt32BE(
      entry.Tag.readUInt32BE(0),
      i * SIZEOF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.TAG,
    );
    tableBuf.writeUInt32BE(entry.Length, i * SIZEOF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.LENGTH);
    tableBuf.writeUInt32BE(entry.checkSum, i * SIZEOF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.CHECKSUM);
    sfntSize += longAlign(entry.Length);
  }

  let sfntOffset = SIZEOF.SFNT_HEADER + entries.length * SIZEOF.SFNT_TABLE_ENTRY;
  let csum = calcWoffChecksum(input.subarray(0, SIZEOF.SFNT_HEADER));
  entries.forEach((entry) => {
    const b = Buffer.alloc(SIZEOF.SFNT_TABLE_ENTRY);
    b.writeUInt32BE(entry.Tag.readUInt32BE(0), SFNT_OFFSET.TAG);
    b.writeUInt32BE(entry.checkSum, SFNT_OFFSET.CHECKSUM);
    b.writeUInt32BE(sfntOffset, SFNT_OFFSET.OFFSET);
    b.writeUInt32BE(entry.Length, SFNT_OFFSET.LENGTH);
    sfntOffset += longAlign(entry.Length);
    csum += calcWoffChecksum(b);
    csum += entry.checkSum;
  });

  const checksumAdjustment = ulong(MAGIC.CHECKSUM_ADJUSTMENT - csum);
  const woffDataChains: Buffer[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const sfntData = input.subarray(entry.Offset, entry.Offset + entry.Length);

    if (String.fromCharCode.apply(null, entry.Tag as any) === "head") {
      version.maj = sfntData.readUInt16BE(SFNT_ENTRY_OFFSET.VERSION_MAJ);
      version.min = sfntData.readUInt16BE(SFNT_ENTRY_OFFSET.VERSION_MIN);
      flavor = sfntData.readUInt32BE(SFNT_ENTRY_OFFSET.FLAVOR);
      sfntData.writeUInt32BE(checksumAdjustment, SFNT_ENTRY_OFFSET.CHECKSUM_ADJUSTMENT);
    }

    const compressed = deflateSync(sfntData);
    const compLength = Math.min(compressed.length, sfntData.length);
    const len = longAlign(compLength);
    const woffData = Buffer.alloc(len, 0);
    if (compressed.length >= sfntData.length) {
      sfntData.copy(woffData, 0, 0, sfntData.length);
    } else {
      compressed.copy(woffData, 0, 0, compressed.length);
    }

    tableBuf.writeUInt32BE(offset, i * SIZEOF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.OFFSET);
    offset += woffData.length;
    woffSize += woffData.length;
    tableBuf.writeUInt32BE(compLength, i * SIZEOF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.COMPR_LENGTH);
    woffDataChains.push(woffData);
  }

  woffHeader.writeUInt32BE(woffSize, WOFF_OFFSET.SIZE);
  woffHeader.writeUInt32BE(sfntSize, WOFF_OFFSET.SFNT_SIZE);
  woffHeader.writeUInt16BE(version.maj, WOFF_OFFSET.VERSION_MAJ);
  woffHeader.writeUInt16BE(version.min, WOFF_OFFSET.VERSION_MIN);
  woffHeader.writeUInt32BE(flavor, WOFF_OFFSET.FLAVOR);

  let out = Buffer.alloc(woffSize);
  let pos = 0;
  woffHeader.copy(out, pos);
  pos += woffHeader.length;
  tableBuf.copy(out, pos);
  pos += tableBuf.length;
  woffDataChains.forEach((chain) => {
    chain.copy(out, pos);
    pos += chain.length;
  });

  if (options.metadata) {
    const zdata = deflateSync(options.metadata);
    const metaOffset = out.length;
    out = Buffer.concat([out, zdata]);
    out.writeUInt32BE(out.length, WOFF_OFFSET.SIZE);
    out.writeUInt32BE(metaOffset, WOFF_OFFSET.META_OFFSET);
    out.writeUInt32BE(zdata.length, WOFF_OFFSET.META_LENGTH);
    out.writeUInt32BE(options.metadata.length, WOFF_OFFSET.META_ORIG_LENGTH);
  }

  return out;
};

const strbuf = (str: Buffer): Buffer => {
  const arr = Buffer.alloc(str.length + 4);
  arr.writeUInt16LE(str.length, 0);
  for (let i = 0; i < str.length; i += 2) {
    arr.writeUInt16LE(str.readUInt16BE(i), i + 2);
  }
  arr.writeUInt16LE(0, arr.length - 2);
  return arr;
};

export const ttfToEot = (arr: Uint8Array): Buffer => {
  const input = Buffer.from(arr.buffer, arr.byteOffset, arr.length);
  const SIZEOF = {
    SFNT_TABLE_ENTRY: 16,
    SFNT_HEADER: 12,
    SFNT_NAMETABLE: 6,
    SFNT_NAMETABLE_ENTRY: 12,
    EOT_PREFIX: 82,
  };
  const EOT_OFFSET = {
    LENGTH: 0,
    FONT_LENGTH: 4,
    VERSION: 8,
    CHARSET: 26,
    MAGIC: 34,
    FONT_PANOSE: 16,
    ITALIC: 27,
    WEIGHT: 28,
    UNICODE_RANGE: 36,
    CODEPAGE_RANGE: 52,
    CHECKSUM_ADJUSTMENT: 60,
  };
  const SFNT_OFFSET = {
    NUMTABLES: 4,
    TABLE_TAG: 0,
    TABLE_OFFSET: 8,
    TABLE_LENGTH: 12,
    OS2_WEIGHT: 4,
    OS2_FONT_PANOSE: 32,
    OS2_UNICODE_RANGE: 42,
    OS2_FS_SELECTION: 62,
    OS2_CODEPAGE_RANGE: 78,
    HEAD_CHECKSUM_ADJUSTMENT: 8,
    NAMETABLE_FORMAT: 0,
    NAMETABLE_COUNT: 2,
    NAMETABLE_STRING_OFFSET: 4,
    NAME_PLATFORM_ID: 0,
    NAME_ENCODING_ID: 2,
    NAME_LANGUAGE_ID: 4,
    NAME_NAME_ID: 6,
    NAME_LENGTH: 8,
    NAME_OFFSET: 10,
  };
  const MAGIC = {
    EOT_VERSION: 0x00020001,
    EOT_MAGIC: 0x504c,
    EOT_CHARSET: 1,
    LANGUAGE_ENGLISH: 0x0409,
  };

  const out = Buffer.alloc(SIZEOF.EOT_PREFIX, 0);
  out.writeUInt32LE(input.length, EOT_OFFSET.FONT_LENGTH);
  out.writeUInt32LE(MAGIC.EOT_VERSION, EOT_OFFSET.VERSION);
  out.writeUInt8(MAGIC.EOT_CHARSET, EOT_OFFSET.CHARSET);
  out.writeUInt16LE(MAGIC.EOT_MAGIC, EOT_OFFSET.MAGIC);

  let familyName: Buffer = Buffer.alloc(0);
  let subfamilyName: Buffer = Buffer.alloc(0);
  let fullName: Buffer = Buffer.alloc(0);
  let versionString: Buffer = Buffer.alloc(0);

  let haveOS2 = false;
  let haveName = false;
  let haveHead = false;

  const numTables = input.readUInt16BE(SFNT_OFFSET.NUMTABLES);
  for (let i = 0; i < numTables; i++) {
    const data = input.subarray(SIZEOF.SFNT_HEADER + i * SIZEOF.SFNT_TABLE_ENTRY);
    const tag = String.fromCharCode.apply(
      null,
      data.subarray(SFNT_OFFSET.TABLE_TAG, SFNT_OFFSET.TABLE_TAG + 4) as any,
    );
    const offset = data.readUInt32BE(SFNT_OFFSET.TABLE_OFFSET);
    const length = data.readUInt32BE(SFNT_OFFSET.TABLE_LENGTH);
    const table = input.subarray(offset, offset + length);

    if (tag === "OS/2") {
      haveOS2 = true;
      const OS2Version = table.readUInt16BE();
      for (let j = 0; j < 10; j++) {
        out.writeUInt8(
          table.readUInt8(SFNT_OFFSET.OS2_FONT_PANOSE + j),
          EOT_OFFSET.FONT_PANOSE + j,
        );
      }
      out.writeUInt8(table.readUInt16BE(SFNT_OFFSET.OS2_FS_SELECTION) & 0x01, EOT_OFFSET.ITALIC);
      out.writeUInt32LE(table.readUInt16BE(SFNT_OFFSET.OS2_WEIGHT), EOT_OFFSET.WEIGHT);
      for (let j = 0; j < 4; j++) {
        out.writeUInt32LE(
          table.readUInt32BE(SFNT_OFFSET.OS2_UNICODE_RANGE + j * 4),
          EOT_OFFSET.UNICODE_RANGE + j * 4,
        );
      }
      if (OS2Version >= 1) {
        for (let j = 0; j < 2; j++) {
          out.writeUInt32LE(
            table.readUInt32BE(SFNT_OFFSET.OS2_CODEPAGE_RANGE + j * 4),
            EOT_OFFSET.CODEPAGE_RANGE + j * 4,
          );
        }
      }
    } else if (tag === "head") {
      haveHead = true;
      out.writeUInt32LE(
        table.readUInt32BE(SFNT_OFFSET.HEAD_CHECKSUM_ADJUSTMENT),
        EOT_OFFSET.CHECKSUM_ADJUSTMENT,
      );
    } else if (tag === "name") {
      haveName = true;
      const nameTable = {
        format: table.readUInt16BE(SFNT_OFFSET.NAMETABLE_FORMAT),
        count: table.readUInt16BE(SFNT_OFFSET.NAMETABLE_COUNT),
        stringOffset: table.readUInt16BE(SFNT_OFFSET.NAMETABLE_STRING_OFFSET),
      };

      for (let j = 0; j < nameTable.count; j++) {
        const nameRecord = table.subarray(SIZEOF.SFNT_NAMETABLE + j * SIZEOF.SFNT_NAMETABLE_ENTRY);
        const name = {
          platformID: nameRecord.readUInt16BE(SFNT_OFFSET.NAME_PLATFORM_ID),
          encodingID: nameRecord.readUInt16BE(SFNT_OFFSET.NAME_ENCODING_ID),
          languageID: nameRecord.readUInt16BE(SFNT_OFFSET.NAME_LANGUAGE_ID),
          nameID: nameRecord.readUInt16BE(SFNT_OFFSET.NAME_NAME_ID),
          length: nameRecord.readUInt16BE(SFNT_OFFSET.NAME_LENGTH),
          offset: nameRecord.readUInt16BE(SFNT_OFFSET.NAME_OFFSET),
        };

        if (
          name.platformID === 3 &&
          name.encodingID === 1 &&
          name.languageID === MAGIC.LANGUAGE_ENGLISH
        ) {
          const s = strbuf(
            table.subarray(
              nameTable.stringOffset + name.offset,
              nameTable.stringOffset + name.offset + name.length,
            ),
          );
          switch (name.nameID) {
            case 1:
              familyName = s;
              break;
            case 2:
              subfamilyName = s;
              break;
            case 4:
              fullName = s;
              break;
            case 5:
              versionString = s;
              break;
            default:
              break;
          }
        }
      }
    }
    if (haveOS2 && haveName && haveHead) break;
  }

  if (!(haveOS2 && haveName && haveHead)) {
    throw new Error("Required font table sections not found (missing one or more: OS/2, name, head)");
  }

  const eot = Buffer.concat([
    out,
    familyName,
    subfamilyName,
    versionString,
    fullName,
    Buffer.from([0, 0]),
    input,
  ]);
  eot.writeUInt32LE(eot.length, EOT_OFFSET.LENGTH);
  return eot;
};

export const svgToTtf = (
  glyphs: GlyphMeta[],
  fontName: string,
  unitsPerEm: number = DEFAULT_UNITS_PER_EM,
): Buffer => {
  const font = buildFontFromGlyphs(glyphs, fontName, unitsPerEm);
  return generateTtf(font);
};
