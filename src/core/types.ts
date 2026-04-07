export type CarColor = 'red' | 'yellow';

export interface Point {
  x: number;
  y: number;
}

export interface PathData {
  color: CarColor;
  points: Point[];
  isLocked: boolean;
}
