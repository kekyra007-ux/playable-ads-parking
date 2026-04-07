import { Container, Graphics, Sprite, Texture } from 'pixi.js';

export interface CarOptions {
  colorName: 'red' | 'yellow';
  texture: Texture;
  width?: number;
  height?: number;
  interactive?: boolean;
}

export class Car extends Container {
  public readonly colorName: 'red' | 'yellow';
  private readonly shadow: Graphics;
  private readonly body: Sprite;
  private readonly hitAreaShape: Graphics;
  private isEnabled = true;

  public constructor(options: CarOptions) {
    super();

    this.colorName = options.colorName;
    const width = options.width ?? 270;
    const height = options.height ?? 270;

    this.shadow = new Graphics();
    this.shadow.beginFill(0x000000, 0.22);
    this.shadow.drawEllipse(0, 0, width * 0.34, height * 0.16);
    this.shadow.endFill();
    this.shadow.position.set(0, height * 0.28);

    this.body = new Sprite(options.texture);
    this.body.anchor.set(0.5);
    this.body.width = width;
    this.body.height = height;
    // No tint — individual car textures are used directly

    this.hitAreaShape = new Graphics();
    this.hitAreaShape.beginFill(0xffffff, 0.001);
    this.hitAreaShape.drawRoundedRect(-width / 2, -height / 2, width, height, 32);
    this.hitAreaShape.endFill();

    this.interactive = Boolean(options.interactive);
    this.buttonMode = Boolean(options.interactive);
    this.cursor = options.interactive ? 'pointer' : 'default';

    this.addChild(this.shadow, this.body, this.hitAreaShape);
  }

  public setInteractiveState(enabled: boolean): void {
    this.isEnabled = enabled;
    this.interactive = enabled;
    this.buttonMode = enabled;
    this.cursor = enabled ? 'pointer' : 'default';
    this.alpha = enabled ? 1 : 0.8;
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public get pathStartPoint(): { x: number; y: number } {
    return { x: this.x, y: this.y - this.body.height * 0.12 };
  }
}
