import { Container, Graphics } from 'pixi.js';
import type { Point } from '@/core/types';

export class PathDrawer extends Container {
  private readonly graphics: Graphics;

  public constructor() {
    super();
    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }

  public draw(points: Point[], color: number): void {
    this.graphics.clear();

    if (points.length < 2) {
      return;
    }

    this.graphics.lineStyle(18, color, 0.95, 0.5, true);
    this.graphics.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length; index += 1) {
      this.graphics.lineTo(points[index].x, points[index].y);
    }
  }

  public reset(): void {
    this.graphics.clear();
  }
}
