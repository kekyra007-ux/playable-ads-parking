import type { Point } from '@/core/types';

export function computePathLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return length;
}

export function getPointAtLength(points: Point[], targetLength: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { ...points[0] };

  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segLen = Math.hypot(dx, dy);

    if (accumulated + segLen >= targetLength || i === points.length - 1) {
      const t = segLen > 0 ? Math.min((targetLength - accumulated) / segLen, 1) : 0;
      return {
        x: points[i - 1].x + t * dx,
        y: points[i - 1].y + t * dy,
      };
    }

    accumulated += segLen;
  }

  return { ...points[points.length - 1] };
}

export function getAngleAtLength(points: Point[], targetLength: number): number {
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segLen = Math.hypot(dx, dy);

    if (accumulated + segLen >= targetLength || i === points.length - 1) {
      return Math.atan2(dx, -dy); // north = 0, clockwise positive
    }

    accumulated += segLen;
  }

  const last = points[points.length - 1];
  const prev = points[points.length - 2] ?? last;
  return Math.atan2(last.x - prev.x, -(last.y - prev.y));
}

export interface PathIntersection {
  point: Point;
  lengthA: number;
  lengthB: number;
}

function segmentIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): [number, number] | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const cross = d1x * d2y - d1y * d2x;

  if (Math.abs(cross) < 1e-10) return null;

  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return [t, u];
  return null;
}

export function findPathsIntersection(pathA: Point[], pathB: Point[]): PathIntersection | null {
  let lenA = 0;

  for (let i = 1; i < pathA.length; i++) {
    const segLenA = Math.hypot(pathA[i].x - pathA[i - 1].x, pathA[i].y - pathA[i - 1].y);
    let lenB = 0;

    for (let j = 1; j < pathB.length; j++) {
      const segLenB = Math.hypot(pathB[j].x - pathB[j - 1].x, pathB[j].y - pathB[j - 1].y);
      const tu = segmentIntersect(pathA[i - 1], pathA[i], pathB[j - 1], pathB[j]);

      if (tu) {
        const [t, u] = tu;
        return {
          point: {
            x: pathA[i - 1].x + t * (pathA[i].x - pathA[i - 1].x),
            y: pathA[i - 1].y + t * (pathA[i].y - pathA[i - 1].y),
          },
          lengthA: lenA + t * segLenA,
          lengthB: lenB + u * segLenB,
        };
      }

      lenB += segLenB;
    }

    lenA += segLenA;
  }

  return null;
}
