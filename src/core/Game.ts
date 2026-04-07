import { Application } from 'pixi.js';
import { BootScene } from '@/scenes/BootScene';
import { Scene } from '@/core/Scene';

export class Game {
  public readonly app: Application;
  private currentScene: Scene | null = null;

  public constructor(app: Application) {
    this.app = app;
  }

  public async start(): Promise<void> {
    window.addEventListener('resize', this.handleResize);
    await this.changeScene(new BootScene(this));
    this.handleResize();
  }

  public async changeScene(scene: Scene): Promise<void> {
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene);
      this.currentScene.destroyScene();
    }

    this.currentScene = scene;
    this.app.stage.addChild(scene);
    await scene.init();
    scene.onResize(this.app.screen.width, this.app.screen.height);
  }

  public get viewportWidth(): number {
    return this.app.screen.width;
  }

  public get viewportHeight(): number {
    return this.app.screen.height;
  }

  private readonly handleResize = (): void => {
    if (!this.currentScene) {
      return;
    }

    this.currentScene.onResize(this.app.screen.width, this.app.screen.height);
  };
}
