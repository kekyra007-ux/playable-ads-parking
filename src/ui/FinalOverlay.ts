import { Container, Graphics, Sprite, Texture } from 'pixi.js';

export class FinalOverlay extends Container {
  private readonly dimmer: Graphics;
  private readonly logo: Sprite;
  private readonly ctaButton: Sprite;

  public constructor(logoTexture: Texture, buttonTexture: Texture) {
    super();
    this.visible = false;
    this.alpha = 0;

    this.dimmer = new Graphics();
    this.logo = new Sprite(logoTexture);
    this.ctaButton = new Sprite(buttonTexture);

    this.logo.anchor.set(0.5);
    this.ctaButton.anchor.set(0.5);
    this.ctaButton.interactive = true;
    this.ctaButton.buttonMode = true;

    this.addChild(this.dimmer, this.logo, this.ctaButton);
  }

  public resize(width: number, height: number): void {
    this.dimmer.clear();
    this.dimmer.beginFill(0x000000, 0.62);
    this.dimmer.drawRect(0, 0, width, height);
    this.dimmer.endFill();

    this.logo.position.set(width * 0.5, height * 0.36);
    this.logo.width = width * 0.62;
    this.logo.height = this.logo.width * 0.58;

    this.ctaButton.position.set(width * 0.5, height * 0.74);
    this.ctaButton.width = Math.min(width * 0.34, 280);
    this.ctaButton.height = this.ctaButton.width;
  }

  public get button(): Sprite {
    return this.ctaButton;
  }
}
