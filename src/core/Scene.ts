import { Container } from 'pixi.js';
import type { Game } from '@/core/Game';

export interface IScene {
  readonly id: string;
  init(): Promise<void> | void;
  onResize(width: number, height: number): void;
  destroyScene(): void;
}

export abstract class Scene extends Container implements IScene {
  public abstract readonly id: string;
  protected readonly game: Game;

  protected constructor(game: Game) {
    super();
    this.game = game;
    this.sortableChildren = true;
  }

  public init(): Promise<void> | void {
    return undefined;
  }

  public onResize(_width: number, _height: number): void {
    return undefined;
  }

  public destroyScene(): void {
    this.removeChildren();
    this.destroy({ children: true });
  }
}
