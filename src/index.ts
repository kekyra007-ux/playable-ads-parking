import { Application } from 'pixi.js';
import { Game } from '@/core/Game';

const mountNode = document.getElementById('app');

if (!mountNode) {
  throw new Error('Application root #app was not found');
}

const app = new Application({
  resizeTo: mountNode,
  backgroundAlpha: 0,
  antialias: true,
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
});

mountNode.appendChild(app.view as HTMLCanvasElement);

const game = new Game(app);
game.start();
