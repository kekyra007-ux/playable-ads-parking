import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '@/config/gameConfig';

export interface ParkingSlotOptions {
  color: number;
  label: string;
  width?: number;
  height?: number;
}

export class ParkingSlot extends Container {
  private readonly frame: Graphics;
  private readonly badge: Graphics;
  private readonly text: Text;
  private readonly slotWidth: number;
  private readonly slotHeight: number;

  public constructor(options: ParkingSlotOptions) {
    super();

    this.slotWidth = options.width ?? 220;
    this.slotHeight = options.height ?? 320;

    this.frame = new Graphics();
    this.badge = new Graphics();
    this.text = new Text(options.label, new TextStyle({
      fontFamily: 'Arial',
      fontSize: 92,
      fontWeight: '700',
      fill: COLORS.white,
    }));

    this.addChild(this.frame, this.badge, this.text);
    this.draw(options.color);
  }

  public get targetPoint(): { x: number; y: number } {
    return { x: this.x, y: this.y + this.slotHeight * 0.12 };
  }

  private draw(color: number): void {
    this.frame.clear();
    this.frame.lineStyle(12, COLORS.parkingStroke, 1);
    this.frame.beginFill(COLORS.parkingFill, 0.18);
    this.frame.drawRoundedRect(-this.slotWidth / 2, -this.slotHeight / 2, this.slotWidth, this.slotHeight, 32);
    this.frame.endFill();

    this.badge.clear();
    this.badge.beginFill(color, 1);
    this.badge.drawCircle(0, -this.slotHeight * 0.62, 58);
    this.badge.endFill();

    this.text.anchor.set(0.5);
    this.text.position.set(0, -this.slotHeight * 0.62);
  }
}
