import SvgPath from "./svg-path-parser";

/**
 * Path conversion utilities for converting SVG paths to TTF contours
 * Handles cubic-to-quadratic conversion and contour processing
 */

export type Vec = { x: number; y: number };
export type QuadSeg = { cp: Vec; end: Vec };
export type TtfPoint = { x: number; y: number; onCurve: boolean };
export type TtfContour = TtfPoint[];

const lerp = (a: Vec, b: Vec): Vec => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const cubicPointAt = (p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number): Vec => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
  };
};

const distToLine = (p: Vec, a: Vec, b: Vec): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (!lenSq) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(p.x - proj.x, p.y - proj.y);
};

const subdivideCubic = (
  p0: Vec,
  p1: Vec,
  p2: Vec,
  p3: Vec,
): [Vec, Vec, Vec, Vec, Vec, Vec, Vec, Vec] => {
  const p01 = lerp(p0, p1);
  const p12 = lerp(p1, p2);
  const p23 = lerp(p2, p3);
  const p012 = lerp(p01, p12);
  const p123 = lerp(p12, p23);
  const p0123 = lerp(p012, p123);
  return [p0, p01, p012, p0123, p0123, p123, p23, p3];
};

const cubicToQuadratics = (
  p0: Vec,
  p1: Vec,
  p2: Vec,
  p3: Vec,
  tolerance: number,
  out: QuadSeg[],
  depth = 0,
): void => {
  const maxDepth = 16;
  const error = Math.max(distToLine(p1, p0, p3), distToLine(p2, p0, p3));

  if (error <= tolerance || depth >= maxDepth) {
    const mid = cubicPointAt(p0, p1, p2, p3, 0.5);
    const cp = {
      x: 2 * (mid.x - 0.25 * (p0.x + p3.x)),
      y: 2 * (mid.y - 0.25 * (p0.y + p3.y)),
    };
    out.push({ cp, end: p3 });
    return;
  }

  const [l0, l1, l2, l3, r0, r1, r2, r3] = subdivideCubic(p0, p1, p2, p3);
  cubicToQuadratics(l0, l1, l2, l3, tolerance, out, depth + 1);
  cubicToQuadratics(r0, r1, r2, r3, tolerance, out, depth + 1);
};

export const cubicToQuad = (
  segment: any[],
  _index: number,
  x: number,
  y: number,
  accuracy: number,
): any[] | void => {
  if (segment[0] === "C") {
    const p0: Vec = { x, y };
    const p1: Vec = { x: segment[1], y: segment[2] };
    const p2: Vec = { x: segment[3], y: segment[4] };
    const p3: Vec = { x: segment[5], y: segment[6] };
    const quads: QuadSeg[] = [];
    cubicToQuadratics(p0, p1, p2, p3, accuracy, quads);
    const res: any[] = [];
    quads.forEach((q) => res.push(["Q", q.cp.x, q.cp.y, q.end.x, q.end.y]));
    return res;
  }
};

export const toSfntContours = (path: any): TtfContour[] => {
  const resContours: TtfContour[] = [];
  let resContour: TtfContour = [];

  path.iterate((segment: any[], index: number, x: number, y: number) => {
    if (index === 0 || segment[0] === "M") {
      resContour = [];
      resContours.push(resContour);
    }

    const name = segment[0];
    if (name === "Q") {
      resContour.push({ x: segment[1], y: segment[2], onCurve: false });
    }

    if (name === "H") {
      resContour.push({ x: segment[1], y, onCurve: true });
    } else if (name === "V") {
      resContour.push({ x, y: segment[1], onCurve: true });
    } else if (name !== "Z") {
      resContour.push({
        x: segment[segment.length - 2],
        y: segment[segment.length - 1],
        onCurve: true,
      });
    }
  });

  return resContours;
};

class Vec2 {
  constructor(
    public x: number,
    public y: number,
  ) {}

  add(point: Vec2): Vec2 {
    return new Vec2(this.x + point.x, this.y + point.y);
  }

  sub(point: Vec2): Vec2 {
    return new Vec2(this.x - point.x, this.y - point.y);
  }

  mul(value: number): Vec2 {
    return new Vec2(this.x * value, this.y * value);
  }

  div(value: number): Vec2 {
    return new Vec2(this.x / value, this.y / value);
  }

  dist(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  sqr(): number {
    return this.x * this.x + this.y * this.y;
  }
}

const isInLine = (p1: Vec2, m: Vec2, p2: Vec2, accuracy: number): boolean => {
  const a = p1.sub(m).sqr();
  const b = p2.sub(m).sqr();
  const c = p1.sub(p2).sqr();

  if (a > b + c || b > a + c) {
    return false;
  }

  const distance = Math.sqrt(
    Math.pow((p1.x - m.x) * (p2.y - m.y) - (p2.x - m.x) * (p1.y - m.y), 2) / c,
  );
  return distance < accuracy;
};

export const simplifyContours = (contours: TtfContour[], accuracy: number): TtfContour[] =>
  contours.map((contour) => {
    const updated = [...contour];
    for (let i = updated.length - 2; i > 1; i--) {
      const prev = updated[i - 1];
      const next = updated[i + 1];
      const curr = updated[i];

      if (prev.onCurve && next.onCurve) {
        const p = new Vec2(curr.x, curr.y);
        const pPrev = new Vec2(prev.x, prev.y);
        const pNext = new Vec2(next.x, next.y);
        if (isInLine(pPrev, p, pNext, accuracy)) {
          updated.splice(i, 1);
        }
      }
    }
    return updated;
  });

export const interpolateContours = (contours: TtfContour[], accuracy: number): TtfContour[] =>
  contours.map((contour) => {
    const res: TtfContour = [];

    contour.forEach((point, idx) => {
      if (idx === 0 || idx === contour.length - 1) {
        res.push(point);
        return;
      }

      const prev = contour[idx - 1];
      const next = contour[idx + 1];

      if (!prev.onCurve && point.onCurve && !next.onCurve) {
        const p = new Vec2(point.x, point.y);
        const pPrev = new Vec2(prev.x, prev.y);
        const pNext = new Vec2(next.x, next.y);
        if (pPrev.add(pNext).div(2).sub(p).dist() < accuracy) {
          return;
        }
      }
      res.push(point);
    });
    return res;
  });

export const roundPoints = (contours: TtfContour[]): TtfContour[] =>
  contours.map((contour) =>
    contour.map((point) => ({
      x: Math.round(point.x),
      y: Math.round(point.y),
      onCurve: point.onCurve,
    })),
  );

export const removeClosingReturnPoints = (contours: TtfContour[]): TtfContour[] =>
  contours.map((contour) => {
    const length = contour.length;
    if (
      length > 1 &&
      contour[0].x === contour[length - 1].x &&
      contour[0].y === contour[length - 1].y
    ) {
      contour.splice(length - 1);
    }
    return contour;
  });

export const toRelative = (contours: TtfContour[]): TtfContour[] => {
  let prevPoint: TtfPoint = { x: 0, y: 0, onCurve: true };
  const resContours: TtfContour[] = [];

  contours.forEach((contour) => {
    const resContour: TtfContour = [];
    resContours.push(resContour);

    contour.forEach((point) => {
      resContour.push({
        x: point.x - prevPoint.x,
        y: point.y - prevPoint.y,
        onCurve: point.onCurve,
      });
      prevPoint = point;
    });
  });

  return resContours;
};

const pointInPolygon = (point: { x: number; y: number }, contour: TtfContour): boolean => {
  const polygon = contour.filter((p) => p.onCurve);
  const points = polygon.length >= 3 ? polygon : contour;
  if (points.length < 3) return false;

  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i++) {
    const pi = points[i];
    const pj = points[j];
    const intersects =
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y + Number.EPSILON) + pi.x;
    if (intersects) inside = !inside;
  }
  return inside;
};

const signedArea = (contour: TtfContour): number => {
  let area = 0;
  const pts = contour.filter((p) => p.onCurve);
  const points = pts.length >= 3 ? pts : contour;
  if (points.length < 3) return 0;

  for (let i = 0, j = points.length - 1; i < points.length; j = i, i++) {
    area += points[j].x * points[i].y - points[i].x * points[j].y;
  }
  return area / 2;
};

const ensureOrientation = (contour: TtfContour, clockwise: boolean): TtfContour => {
  const area = signedArea(contour);
  const isClockwise = area < 0;
  if (clockwise === isClockwise) return contour;
  return [...contour].reverse();
};

type ContourMeta = { contour: TtfContour; forceHole: boolean };

export const orientContoursEvenOdd = (contours: ContourMeta[]): TtfContour[] => {
  const depths = contours.map((entry, idx) => {
    const sample = entry.contour.find((p) => p.onCurve) ?? entry.contour[0];
    if (!sample) return { parity: 0, filled: 0 };
    let parity = 0;
    let filled = 0;
    contours.forEach((other, otherIdx) => {
      if (otherIdx === idx) return;
      if (pointInPolygon(sample, other.contour)) {
        parity++;
        if (!other.forceHole) filled++;
      }
    });
    return { parity, filled };
  });

  const expanded: TtfContour[] = [];

  contours.forEach((entry, idx) => {
    const { parity, filled } = depths[idx];
    const baseIsHole = entry.forceHole || parity % 2 === 1;
    const copies = entry.forceHole ? Math.max(filled, 1) : 1;
    for (let i = 0; i < copies; i++) {
      const wantClockwise = !baseIsHole; // outer = CW, hole = CCW
      expanded.push(ensureOrientation(entry.contour, wantClockwise));
    }
  });

  return expanded;
};

export const isWhiteFill = (fill?: string): boolean => {
  if (!fill) return false;
  const lower = fill.trim().toLowerCase();
  return (
    lower === "#fff" || lower === "#ffffff" || lower === "white" || lower === "rgb(255,255,255)"
  );
};

export const pathToContours = (pathData: string, glyphSize: number): TtfContour[] => {
  if (!pathData) return [];

  const accuracy = glyphSize > 500 ? 0.3 : glyphSize * 0.0006;
  const svgPath = new (SvgPath as any)(pathData)
    .abs()
    .unshort()
    .unarc()
    .iterate((segment: any[], index: number, x: number, y: number) =>
      cubicToQuad(segment, index, x, y, accuracy),
    );

  return toSfntContours(svgPath);
};
