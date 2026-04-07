import { Text, TextStyle } from 'pixi.js';
import { AssetLoader } from '@/core/AssetLoader';
import { Scene } from '@/core/Scene';
import { StartScene } from '@/scenes/StartScene';

export class BootScene extends Scene {
  public readonly id = 'boot';
  private readonly label: Text;

  public constructor(game: import('@/core/Game').Game) {
    super(game);

    this.label = new Text(
      'Loading...',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 58,
        fontWeight: '700',
        fill: 0xffffff,
      }),
    );
    this.label.anchor.set(0.5);
    this.addChild(this.label);
  }

  public override async init(): Promise<void> {
    await AssetLoader.loadAll();
    await this.game.changeScene(new StartScene(this.game));
  }

  public override onResize(width: number, height: number): void {
    this.label.position.set(width * 0.5, height * 0.5);
  }
}
