// Lightweight subset of svgpath (https://github.com/fontello/svgpath, MIT licensed)
// Implements only the bits we need: parsing, iterate, abs, unshort, unarc.

type Segment = (string | number)[];
type PathState = {
  path: string;
  index: number;
  max: number;
  result: Segment[];
  data: number[];
  param: number;
  err: string;
  segmentStart: number;
};
const TAU = Math.PI * 2;

const paramCounts: Record<string, number> = {
  a: 7,
  c: 6,
  h: 1,
  l: 2,
  m: 2,
  r: 4,
  q: 4,
  s: 4,
  t: 2,
  v: 1,
  z: 0,
};
const SPECIAL_SPACES = [
  0x1680, 0x180e, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009,
  0x200a, 0x202f, 0x205f, 0x3000, 0xfeff,
];

const unitVectorAngle = (ux: number, uy: number, vx: number, vy: number): number => {
  const sign = ux * vy - uy * vx < 0 ? -1 : 1;
  let dot = ux * vx + uy * vy;
  if (dot > 1) dot = 1;
  if (dot < -1) dot = -1;
  return sign * Math.acos(dot);
};

const getArcCenter = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fa: number,
  fs: number,
  rx: number,
  ry: number,
  sinPhi: number,
  cosPhi: number,
): [number, number, number, number] => {
  const x1p = (cosPhi * (x1 - x2)) / 2 + (sinPhi * (y1 - y2)) / 2;
  const y1p = (-sinPhi * (x1 - x2)) / 2 + (cosPhi * (y1 - y2)) / 2;

  const rxSq = rx * rx;
  const rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;

  let radicant = rxSq * rySq - rxSq * y1pSq - rySq * x1pSq;
  if (radicant < 0) radicant = 0;
  radicant /= rxSq * y1pSq + rySq * x1pSq;
  radicant = Math.sqrt(radicant) * (fa === fs ? -1 : 1);

  const cxp = (radicant * rx * y1p) / ry;
  const cyp = (radicant * -ry * x1p) / rx;

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const v1x = (x1p - cxp) / rx;
  const v1y = (y1p - cyp) / ry;
  const v2x = (-x1p - cxp) / rx;
  const v2y = (-y1p - cyp) / ry;

  const theta1 = unitVectorAngle(1, 0, v1x, v1y);
  let deltaTheta = unitVectorAngle(v1x, v1y, v2x, v2y);

  if (fs === 0 && deltaTheta > 0) deltaTheta -= TAU;
  if (fs === 1 && deltaTheta < 0) deltaTheta += TAU;

  return [cx, cy, theta1, deltaTheta];
};

const approximateUnitArc = (theta1: number, deltaTheta: number): number[] => {
  const alpha = (4 / 3) * Math.tan(deltaTheta / 4);
  const x1 = Math.cos(theta1);
  const y1 = Math.sin(theta1);
  const x2 = Math.cos(theta1 + deltaTheta);
  const y2 = Math.sin(theta1 + deltaTheta);
  return [x1, y1, x1 - y1 * alpha, y1 + x1 * alpha, x2 + y2 * alpha, y2 - x2 * alpha, x2, y2];
};

const a2c = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fa: number,
  fs: number,
  rx: number,
  ry: number,
  phi: number,
): number[][] => {
  const sinPhi = Math.sin((phi * TAU) / 360);
  const cosPhi = Math.cos((phi * TAU) / 360);

  const x1p = (cosPhi * (x1 - x2)) / 2 + (sinPhi * (y1 - y2)) / 2;
  const y1p = (-sinPhi * (x1 - x2)) / 2 + (cosPhi * (y1 - y2)) / 2;
  if (x1p === 0 && y1p === 0) return [];
  if (rx === 0 || ry === 0) return [];

  rx = Math.abs(rx);
  ry = Math.abs(ry);

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }

  const [cx, cy, theta1, deltaThetaInitial] = getArcCenter(
    x1,
    y1,
    x2,
    y2,
    fa,
    fs,
    rx,
    ry,
    sinPhi,
    cosPhi,
  );
  let deltaTheta = deltaThetaInitial;

  const segments = Math.max(Math.ceil(Math.abs(deltaTheta) / (TAU / 4)), 1);
  deltaTheta /= segments;

  const result: number[][] = [];
  let theta = theta1;

  for (let i = 0; i < segments; i++) {
    result.push(approximateUnitArc(theta, deltaTheta));
    theta += deltaTheta;
  }

  return result.map((curve) => {
    const converted = [...curve];
    for (let i = 0; i < converted.length; i += 2) {
      const x = converted[i];
      const y = converted[i + 1];
      const scaledX = x * rx;
      const scaledY = y * ry;
      const xp = cosPhi * scaledX - sinPhi * scaledY;
      const yp = sinPhi * scaledX + cosPhi * scaledY;
      converted[i] = xp + cx;
      converted[i + 1] = yp + cy;
    }
    return converted;
  });
};

const isSpace = (ch: number): boolean =>
  ch === 0x0a ||
  ch === 0x0d ||
  ch === 0x2028 ||
  ch === 0x2029 ||
  ch === 0x20 ||
  ch === 0x09 ||
  ch === 0x0b ||
  ch === 0x0c ||
  ch === 0xa0 ||
  (ch >= 0x1680 && SPECIAL_SPACES.indexOf(ch) >= 0);

const isCommand = (code: number): boolean => {
  switch (code | 0x20) {
    case 0x6d:
    case 0x7a:
    case 0x6c:
    case 0x68:
    case 0x76:
    case 0x63:
    case 0x73:
    case 0x71:
    case 0x74:
    case 0x61:
    case 0x72:
      return true;
    default:
      return false;
  }
};

const isArc = (code: number): boolean => (code | 0x20) === 0x61;
const isDigit = (code: number): boolean => code >= 48 && code <= 57;
const isDigitStart = (code: number): boolean =>
  isDigit(code) || code === 0x2b || code === 0x2d || code === 0x2e;
const createState = (path: string): PathState => ({
  path,
  index: 0,
  max: path.length,
  result: [],
  data: [],
  param: 0,
  err: "",
  segmentStart: 0,
});

const skipSpaces = (state: PathState): void => {
  while (state.index < state.max && isSpace(state.path.charCodeAt(state.index))) state.index++;
};

const readFlag = (state: PathState): boolean => {
  const ch = state.path.charCodeAt(state.index);
  if (ch === 0x30 || ch === 0x31) {
    state.param = ch - 0x30;
    state.index++;
    return true;
  }
  state.err = `SvgPath: arc flag can be 0 or 1 only (at pos ${state.index})`;
  return false;
};

const readNumber = (state: PathState): boolean => {
  const start = state.index;
  let index = start;
  const { max, path } = state;
  let zeroFirst = false;
  let hasCeiling = false;
  let hasDecimal = false;
  let hasDot = false;

  if (index >= max) {
    state.err = `SvgPath: missed param (at pos ${index})`;
    return false;
  }

  let ch = path.charCodeAt(index);

  if (ch === 0x2b || ch === 0x2d) {
    index++;
    ch = index < max ? path.charCodeAt(index) : 0;
  }

  if (!isDigit(ch) && ch !== 0x2e) {
    state.err = `SvgPath: param should start with 0..9 or \`.\` (at pos ${index})`;
    return false;
  }

  if (ch !== 0x2e) {
    zeroFirst = ch === 0x30;
    index++;
    ch = index < max ? path.charCodeAt(index) : 0;

    if (zeroFirst && index < max && ch && isDigit(ch)) {
      state.err = `SvgPath: numbers started with \`0\` such as \`09\` are illegal (at pos ${start})`;
      return false;
    }

    while (index < max && isDigit(path.charCodeAt(index))) {
      index++;
      hasCeiling = true;
    }
    ch = index < max ? path.charCodeAt(index) : 0;
  }

  if (ch === 0x2e) {
    hasDot = true;
    index++;
    while (index < max && isDigit(path.charCodeAt(index))) {
      index++;
      hasDecimal = true;
    }
    ch = index < max ? path.charCodeAt(index) : 0;
  }

  if (ch === 0x65 || ch === 0x45) {
    if (hasDot && !hasCeiling && !hasDecimal) {
      state.err = `SvgPath: invalid float exponent (at pos ${index})`;
      return false;
    }
    index++;
    ch = index < max ? path.charCodeAt(index) : 0;
    if (ch === 0x2b || ch === 0x2d) {
      index++;
    }
    if (index < max && isDigit(path.charCodeAt(index))) {
      while (index < max && isDigit(path.charCodeAt(index))) index++;
    } else {
      state.err = `SvgPath: invalid float exponent (at pos ${index})`;
      return false;
    }
  }

  state.index = index;
  state.param = parseFloat(path.slice(start, index));
  return true;
};

const finalizeSegment = (state: PathState): void => {
  const cmd = state.path[state.segmentStart];
  let cmdLC = cmd.toLowerCase();
  const params = state.data;

  if (cmdLC === "m" && params.length > 2) {
    state.result.push([cmd, params[0], params[1]]);
    params.splice(0, 2);
    cmdLC = "l";
    const newCmd = cmd === "m" ? "l" : "L";
    while (params.length >= paramCounts[cmdLC]) {
      state.result.push([newCmd, ...params.splice(0, paramCounts[cmdLC])] as Segment);
    }
    return;
  }

  if (cmdLC === "r") {
    state.result.push([cmd, ...params] as Segment);
  } else {
    while (params.length >= paramCounts[cmdLC]) {
      state.result.push([cmd, ...params.splice(0, paramCounts[cmdLC])] as Segment);
      if (!paramCounts[cmdLC]) {
        break;
      }
    }
  }
};

const scanSegment = (state: PathState): void => {
  const max = state.max;
  state.segmentStart = state.index;
  const cmdCode = state.path.charCodeAt(state.index);

  if (!isCommand(cmdCode)) {
    state.err = `SvgPath: bad command ${state.path[state.index]} (at pos ${state.index})`;
    return;
  }

  const needParams = paramCounts[state.path[state.index].toLowerCase()];
  state.index++;
  skipSpaces(state);
  state.data = [];

  if (!needParams) {
    finalizeSegment(state);
    return;
  }

  while (state.index < max) {
    for (let i = 0; i < needParams; i++) {
      const ok = isArc(cmdCode) && (i === 3 || i === 4) ? readFlag(state) : readNumber(state);
      if (!ok) {
        finalizeSegment(state);
        return;
      }
      state.data.push(state.param);
      skipSpaces(state);
      if (state.index < max && state.path.charCodeAt(state.index) === 0x2c) {
        state.index++;
        skipSpaces(state);
      }
    }
    const nextChar = state.index < max ? state.path.charCodeAt(state.index) : 0;
    if (!isDigitStart(nextChar)) break;
  }

  finalizeSegment(state);
};

const pathParse = (svgPath: string): { err: string; segments: Segment[] } => {
  const state = createState(svgPath);
  skipSpaces(state);
  while (state.index < state.max && !state.err) scanSegment(state);

  if (state.result.length) {
    if ("mM".indexOf(state.result[0][0] as string) < 0) {
      state.err = "SvgPath: string should start with `M` or `m`";
      state.result = [];
    } else {
      state.result[0][0] = "M";
    }
  }
  return { err: state.err, segments: state.result };
};

class SvgPath {
  segments: Segment[];
  err: string;

  constructor(path: string) {
    const pstate = pathParse(path);
    this.segments = pstate.segments;
    this.err = pstate.err;
  }

  iterate(
    iterator: (s: Segment, index: number, x: number, y: number) => Segment[] | void,
    _keepLazyStack?: boolean,
  ): this {
    const segments = this.segments;
    const nextSegments: Segment[] = [];
    let replaced = false;
    let lastX = 0;
    let lastY = 0;
    let contourStartX = 0;
    let contourStartY = 0;

    segments.forEach((s, index) => {
      const res = iterator(s, index, lastX, lastY);
      if (Array.isArray(res)) {
        nextSegments.push(...res);
        replaced = true;
      } else {
        nextSegments.push(s);
      }

      const isRelative = s[0] === (s[0] as string).toLowerCase();
      switch (s[0]) {
        case "m":
        case "M":
          lastX = (s[1] as number) + (isRelative ? lastX : 0);
          lastY = (s[2] as number) + (isRelative ? lastY : 0);
          contourStartX = lastX;
          contourStartY = lastY;
          return;
        case "h":
        case "H":
          lastX = (s[1] as number) + (isRelative ? lastX : 0);
          return;
        case "v":
        case "V":
          lastY = (s[1] as number) + (isRelative ? lastY : 0);
          return;
        case "z":
        case "Z":
          lastX = contourStartX;
          lastY = contourStartY;
          return;
        default:
          lastX = (s[s.length - 2] as number) + (isRelative ? lastX : 0);
          lastY = (s[s.length - 1] as number) + (isRelative ? lastY : 0);
      }
    });

    if (replaced) {
      this.segments = nextSegments;
    }
    return this;
  }

  abs(): this {
    this.iterate((s, _index, x, y) => {
      const name = s[0] as string;
      const nameUC = name.toUpperCase();
      if (name === nameUC) return;
      s[0] = nameUC;
      switch (name) {
        case "v":
          s[1] = (s[1] as number) + y;
          return;
        case "a":
          s[6] = (s[6] as number) + x;
          s[7] = (s[7] as number) + y;
          return;
        default:
          for (let i = 1; i < s.length; i++) {
            s[i] = (s[i] as number) + (i % 2 ? x : y);
          }
      }
    }, true);
    return this;
  }

  unarc(): this {
    this.iterate((s, _index, x, y) => {
      const name = s[0] as string;
      if (name !== "A" && name !== "a") return null as any;

      const isRel = name === "a";
      const nextX = isRel ? x + (s[6] as number) : (s[6] as number);
      const nextY = isRel ? y + (s[7] as number) : (s[7] as number);

      const newSegments = a2c(
        x,
        y,
        nextX,
        nextY,
        s[4] as number,
        s[5] as number,
        s[1] as number,
        s[2] as number,
        s[3] as number,
      );
      if (newSegments.length === 0) {
        return [[isRel ? "l" : "L", s[6], s[7]]];
      }
      const result: Segment[] = [];
      newSegments.forEach((seg) => {
        result.push(["C", seg[2], seg[3], seg[4], seg[5], seg[6], seg[7]]);
      });
      return result;
    });
    return this;
  }

  unshort(): this {
    const segments = this.segments;
    let prevControlX = 0;
    let prevControlY = 0;
    let prevSegment: Segment | undefined;
    let curControlX = 0;
    let curControlY = 0;

    this.iterate((s, idx, x, y) => {
      const name = s[0] as string;
      const nameUC = name.toUpperCase();
      if (!idx) return;

      if (nameUC === "T") {
        const isRelative = name === "t";
        prevSegment = segments[idx - 1];

        if (prevSegment[0] === "Q") {
          prevControlX = (prevSegment[1] as number) - x;
          prevControlY = (prevSegment[2] as number) - y;
        } else if (prevSegment[0] === "q") {
          prevControlX = (prevSegment[1] as number) - (prevSegment[3] as number);
          prevControlY = (prevSegment[2] as number) - (prevSegment[4] as number);
        } else {
          prevControlX = 0;
          prevControlY = 0;
        }

        curControlX = -prevControlX;
        curControlY = -prevControlY;
        if (!isRelative) {
          curControlX += x;
          curControlY += y;
        }

        segments[idx] = [isRelative ? "q" : "Q", curControlX, curControlY, s[1], s[2]];
      } else if (nameUC === "S") {
        const isRelative = name === "s";
        prevSegment = segments[idx - 1];

        if (prevSegment[0] === "C") {
          prevControlX = (prevSegment[3] as number) - x;
          prevControlY = (prevSegment[4] as number) - y;
        } else if (prevSegment[0] === "c") {
          prevControlX = (prevSegment[3] as number) - (prevSegment[5] as number);
          prevControlY = (prevSegment[4] as number) - (prevSegment[6] as number);
        } else {
          prevControlX = 0;
          prevControlY = 0;
        }

        curControlX = -prevControlX;
        curControlY = -prevControlY;
        if (!isRelative) {
          curControlX += x;
          curControlY += y;
        }

        segments[idx] = [isRelative ? "c" : "C", curControlX, curControlY, s[1], s[2], s[3], s[4]];
      }
    });

    return this;
  }
}

export default SvgPath;
