import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';

export class HintHand extends Container {
  private readonly sprite: Sprite;
  private timeline: gsap.core.Timeline | null = null;

  public constructor(texture: Texture) {
    super();

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.35, 0.15);
    this.sprite.scale.set(0.85);
    this.addChild(this.sprite);
  }

  public play(fromX: number, fromY: number, toX: number, toY: number): void {
    this.stop();
    this.visible = true;
    this.alpha = 1;
    this.position.set(fromX, fromY);

    this.timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.25 });
    this.timeline
      .fromTo(this, { x: fromX, y: fromY, alpha: 0.35 }, { x: fromX, y: fromY, alpha: 1, duration: 0.35, ease: 'power1.out' })
      .to(this, { x: toX, y: toY, duration: 1.05, ease: 'power1.inOut' })
      .to(this, { alpha: 0.3, duration: 0.2, ease: 'power1.out' }, '-=0.2')
      .set(this, { x: fromX, y: fromY, alpha: 0.2 });
  }

  public fadeOutAndStop(): void {
    if (!this.visible) {
      return;
    }

    this.timeline?.kill();
    this.timeline = null;
    gsap.to(this, {
      alpha: 0,
      duration: 0.35,
      ease: 'power1.out',
      onComplete: () => {
        this.visible = false;
      },
    });
  }

  public stop(): void {
    this.timeline?.kill();
    this.timeline = null;
  }
}
