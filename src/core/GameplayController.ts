import type { CarColor, PathData, Point } from '@/core/types';

export class GameplayController {
  private readonly paths = new Map<CarColor, PathData>();

  public beginPath(color: CarColor, start: Point): void {
    this.paths.set(color, {
      color,
      points: [start],
      isLocked: false,
    });
  }

  public pushPoint(color: CarColor, point: Point): void {
    const path = this.paths.get(color);
    if (!path || path.isLocked) {
      return;
    }

    path.points.push(point);
  }

  public lockPath(color: CarColor): void {
    const path = this.paths.get(color);
    if (!path) {
      return;
    }

    path.isLocked = true;
  }

  public resetPath(color: CarColor): void {
    this.paths.delete(color);
  }

  public getPath(color: CarColor): PathData | null {
    return this.paths.get(color) ?? null;
  }

  public get areBothPathsReady(): boolean {
    const red = this.paths.get('red');
    const yellow = this.paths.get('yellow');
    return Boolean(red?.isLocked && yellow?.isLocked);
  }
}
