import { Container, Graphics, Sprite } from 'pixi.js';
import type { InteractionEvent } from 'pixi.js';
import { gsap } from 'gsap';
import { AssetLoader } from '@/core/AssetLoader';
import { Scene } from '@/core/Scene';
import { COLORS, GAME_CONFIG, SCENE_LAYERS } from '@/config/gameConfig';
import { Car } from '@/entities/Car';
import { HintHand } from '@/entities/HintHand';
import { ParkingSlot } from '@/entities/ParkingSlot';
import { GameplayController } from '@/core/GameplayController';
import { PathDrawer } from '@/ui/PathDrawer';
import { FinalOverlay } from '@/ui/FinalOverlay';
import { containScale } from '@/utils/layout';
import {
  computePathLength,
  findPathsIntersection,
  getAngleAtLength,
  getPointAtLength,
} from '@/utils/path';
import type { CarColor, Point } from '@/core/types';

// ─── Layout constants (design space 1080 × 1920) ─────────────────────────────

/** X positions of the three inner bay dividers. Four bays result: 60-300, 300-540, 540-780, 780-1020 */
const BAY_DIVIDERS = [300, 540, 780] as const;
/** Centre X of each bay */
const BAY_CX = [180, 420, 660, 900] as const;

const PARKING_X = 60;
const PARKING_Y = 80;
const PARKING_W = 960;
const PARKING_H = 620; // y → 700
const PARKING_BOT = PARKING_Y + PARKING_H; // 700

const LOWER_Y = 800;
const LOWER_H = 1020; // y → 1820

const SLOT_HIT_RADIUS = 160;
const DRIVE_DURATION = 1.4;

export class StartScene extends Scene {
  public readonly id = 'start';

  // Containers
  private readonly root: Container;
  private readonly background: Graphics;
  private readonly border: Graphics;
  private readonly parkingArea: Graphics;
  private readonly lowerArea: Graphics;

  // Parking slots (interactive targets)
  private readonly yellowSlot: ParkingSlot;
  private readonly redSlot: ParkingSlot;

  // Decorative parked cars (non-interactive)
  private readonly greenCarSprite: Sprite;
  private readonly blueCarSprite: Sprite;

  // Interactive cars
  private readonly redCar: Car;
  private readonly yellowCar: Car;
  private readonly hintHand: HintHand;

  // Path drawing
  private readonly redPathDrawer: PathDrawer;
  private readonly yellowPathDrawer: PathDrawer;
  private readonly controller: GameplayController;

  // End screens
  private readonly finalOverlay: FinalOverlay;
  private failSprite: Sprite | null = null;

  // State
  private activeColor: CarColor | null = null;
  private inactivityTimerId: number | null = null;

  public constructor(game: import('@/core/Game').Game) {
    super(game);

    // ── Containers ──────────────────────────────────────────────────────────
    this.root = new Container();
    this.root.zIndex = SCENE_LAYERS.gameplay;

    this.background = new Graphics();
    this.background.zIndex = SCENE_LAYERS.background;

    // Border sits above everything (cosmetic outline)
    this.border = new Graphics();
    this.border.zIndex = 50;

    this.parkingArea = new Graphics();
    this.lowerArea = new Graphics();

    // ── Parking slots ────────────────────────────────────────────────────────
    // Bay 2 = yellow P (left empty slot), Bay 3 = red P (right empty slot)
    this.yellowSlot = new ParkingSlot({ color: COLORS.yellow, label: 'P' });
    this.redSlot = new ParkingSlot({ color: COLORS.red, label: 'P' });

    // ── Decorative (non-interactive) parked cars ─────────────────────────────
    this.greenCarSprite = new Sprite(AssetLoader.getTexture('greenCar'));
    this.greenCarSprite.anchor.set(0.5);
    this.greenCarSprite.width = 200;
    this.greenCarSprite.height = 200;

    this.blueCarSprite = new Sprite(AssetLoader.getTexture('blueCar'));
    this.blueCarSprite.anchor.set(0.5);
    this.blueCarSprite.width = 200;
    this.blueCarSprite.height = 200;

    // ── Interactive cars ─────────────────────────────────────────────────────
    this.redCar = new Car({
      colorName: 'red',
      texture: AssetLoader.getTexture('redCar'),
      interactive: true,
      width: 220,
      height: 220,
    });
    this.yellowCar = new Car({
      colorName: 'yellow',
      texture: AssetLoader.getTexture('yellowCar'),
      interactive: true,
      width: 220,
      height: 220,
    });

    this.hintHand = new HintHand(AssetLoader.getTexture('hand'));

    // ── Path drawing ─────────────────────────────────────────────────────────
    this.controller = new GameplayController();
    this.redPathDrawer = new PathDrawer();
    this.yellowPathDrawer = new PathDrawer();

    // ── End screens ──────────────────────────────────────────────────────────
    this.finalOverlay = new FinalOverlay(
      AssetLoader.getTexture('gameLogo'),
      AssetLoader.getTexture('button'),
    );
    this.finalOverlay.zIndex = SCENE_LAYERS.overlay;

    // ── Hierarchy ────────────────────────────────────────────────────────────
    // hintHand is inside root so it lives in design space and positions correctly
    this.addChild(this.background, this.root, this.finalOverlay, this.border);

    this.root.addChild(
      this.parkingArea,
      this.lowerArea,
      // Decorative parked cars (non-interactive, behind slots visually)
      this.greenCarSprite,
      this.blueCarSprite,
      // Parking slot markers
      this.yellowSlot,
      this.redSlot,
      // Path drawers
      this.redPathDrawer,
      this.yellowPathDrawer,
      // Interactive cars (on top so pointer hits work)
      this.redCar,
      this.yellowCar,
      // Hint last — renders above everything else in root
      this.hintHand,
    );
  }

  public override init(): void {
    this.drawZones();
    this.bindInteractions();
    this.scheduleInactivityTimeout();
  }

  public override onResize(width: number, height: number): void {
    // Background fill
    this.background.clear();
    this.background.beginFill(GAME_CONFIG.backgroundColor, 1);
    this.background.drawRect(0, 0, width, height);
    this.background.endFill();

    // Yellow border (cosmetic, top-most layer)
    this.border.clear();
    const BW = 30;
    this.border.lineStyle(BW, COLORS.yellow, 1);
    this.border.drawRoundedRect(BW / 2, BW / 2, width - BW, height - BW, 26);

    // Scale root (design → screen)
    const fit = containScale(width, height, GAME_CONFIG.designWidth, GAME_CONFIG.designHeight);
    this.root.scale.set(fit.scale);
    this.root.position.set(fit.offsetX, fit.offsetY);

    this.finalOverlay.resize(width, height);

    if (this.failSprite) {
      this.positionFailSprite(this.failSprite, width, height);
    }

    this.layoutDesignScene();
  }

  public override destroyScene(): void {
    this.clearInactivityTimeout();
    this.hintHand.stop();
    this.redCar.removeAllListeners();
    this.yellowCar.removeAllListeners();
    this.game.app.stage.off('pointermove', this.onStagePointerMove);
    this.game.app.stage.off('pointerup', this.onStagePointerUp);
    this.game.app.stage.off('pointerupoutside', this.onStagePointerUp);
    super.destroyScene();
  }

  // ─── Scene drawing ────────────────────────────────────────────────────────

  private drawZones(): void {
    // ── Parking area (top) ──────────────────────────────────────────────────
    this.parkingArea.clear();

    // Gray background
    this.parkingArea.beginFill(0x5e5e5e, 0.95);
    this.parkingArea.drawRoundedRect(PARKING_X, PARKING_Y, PARKING_W, PARKING_H, 36);
    this.parkingArea.endFill();

    // White vertical bay dividers (inner only — 3 dividers create 4 bays)
    this.parkingArea.lineStyle(18, 0xffffff, 0.9);
    for (const x of BAY_DIVIDERS) {
      this.parkingArea.moveTo(x, PARKING_Y);
      this.parkingArea.lineTo(x, PARKING_BOT);
    }

    // ── Lower / road area ───────────────────────────────────────────────────
    this.lowerArea.clear();
    this.lowerArea.beginFill(0x505050, 0.45);
    this.lowerArea.drawRoundedRect(PARKING_X, LOWER_Y, PARKING_W, LOWER_H, 36);
    this.lowerArea.endFill();

    // Subtle centre lane marker
    this.lowerArea.lineStyle(8, 0xf0f0f0, 0.12);
    this.lowerArea.moveTo(540, LOWER_Y + 40);
    this.lowerArea.lineTo(540, LOWER_Y + LOWER_H - 40);
  }

  private layoutDesignScene(): void {
    // ── Decorative parked cars (bays 1 and 4) ───────────────────────────────
    // Positioned near the bottom of their bay, facing up (into the parking lot)
    this.greenCarSprite.position.set(BAY_CX[0], 480);
    this.blueCarSprite.position.set(BAY_CX[3], 480);

    // ── Parking slot markers (bays 2 and 3) ─────────────────────────────────
    // Yellow slot = bay 2 (left empty), Red slot = bay 3 (right empty)
    // ParkingSlot draws its badge at -slotHeight*0.62 above the position,
    // so y=510 puts the badge at y≈510-198=312 (upper-middle of parking area).
    this.yellowSlot.position.set(BAY_CX[1], 510);
    this.redSlot.position.set(BAY_CX[2], 510);

    // ── Interactive cars (lower area) ────────────────────────────────────────
    // Red car (left) → needs to reach Red slot (right) — paths cross
    // Yellow car (right) → needs to reach Yellow slot (left) — paths cross
    this.redCar.position.set(BAY_CX[0] + 100, 1280); // x=280, below bay 1-2
    this.yellowCar.position.set(BAY_CX[3] - 100, 1280); // x=800, below bay 3-4

    // ── Hint hand: red car → red slot ────────────────────────────────────────
    const from = this.redCar.pathStartPoint;
    const to = this.redSlot.targetPoint;
    this.hintHand.play(from.x - 30, from.y + 20, to.x + 16, to.y + 8);
  }

  // ─── Input / path drawing ─────────────────────────────────────────────────

  private toDesignSpace(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.root.x) / this.root.scale.x,
      y: (screenY - this.root.y) / this.root.scale.y,
    };
  }

  private bindInteractions(): void {
    const stage = this.game.app.stage;
    stage.interactive = true;

    this.redCar.on('pointerdown', (e: InteractionEvent) => {
      if (!this.redCar.enabled) return;
      this.hintHand.fadeOutAndStop();
      this.resetInactivity();
      this.activeColor = 'red';
      const pt = this.toDesignSpace(e.data.global.x, e.data.global.y);
      this.controller.beginPath('red', pt);
      gsap.fromTo(
        this.redCar.scale,
        { x: 1, y: 1 },
        { x: 1.06, y: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out' },
      );
    });

    this.yellowCar.on('pointerdown', (e: InteractionEvent) => {
      if (!this.yellowCar.enabled) return;
      this.hintHand.fadeOutAndStop();
      this.resetInactivity();
      this.activeColor = 'yellow';
      const pt = this.toDesignSpace(e.data.global.x, e.data.global.y);
      this.controller.beginPath('yellow', pt);
      gsap.fromTo(
        this.yellowCar.scale,
        { x: 1, y: 1 },
        { x: 1.06, y: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out' },
      );
    });

    stage.on('pointermove', this.onStagePointerMove);
    stage.on('pointerup', this.onStagePointerUp);
    stage.on('pointerupoutside', this.onStagePointerUp);
  }

  private readonly onStagePointerMove = (e: InteractionEvent): void => {
    if (!this.activeColor) return;
    this.resetInactivity();
    const pt = this.toDesignSpace(e.data.global.x, e.data.global.y);
    this.controller.pushPoint(this.activeColor, pt);
    this.redrawPath(this.activeColor);
  };

  private readonly onStagePointerUp = (): void => {
    this.finalizeActivePath();
  };

  private redrawPath(color: CarColor): void {
    const path = this.controller.getPath(color);
    if (!path) return;
    const drawer = color === 'red' ? this.redPathDrawer : this.yellowPathDrawer;
    drawer.draw(path.points, color === 'red' ? COLORS.red : COLORS.yellow);
  }

  private finalizeActivePath(): void {
    if (!this.activeColor) return;
    const color = this.activeColor;
    this.activeColor = null;

    const path = this.controller.getPath(color);
    if (!path || path.points.length < 2) {
      this.controller.resetPath(color);
      return;
    }

    const lastPoint = path.points[path.points.length - 1];
    // Red car → red slot (bay 3), yellow car → yellow slot (bay 2)
    const targetSlot = color === 'red' ? this.redSlot : this.yellowSlot;
    const target = targetSlot.targetPoint;
    const dist = Math.hypot(lastPoint.x - target.x, lastPoint.y - target.y);

    if (dist <= SLOT_HIT_RADIUS) {
      this.controller.lockPath(color);
      const car = color === 'red' ? this.redCar : this.yellowCar;
      car.setInteractiveState(false);
      if (this.controller.areBothPathsReady) {
        void this.startCarAnimation();
      }
    } else {
      this.controller.resetPath(color);
      const drawer = color === 'red' ? this.redPathDrawer : this.yellowPathDrawer;
      drawer.reset();
    }
  }

  // ─── Car animation + collision ────────────────────────────────────────────

  private async startCarAnimation(): Promise<void> {
    this.clearInactivityTimeout();
    this.hintHand.fadeOutAndStop();
    this.game.app.stage.off('pointermove', this.onStagePointerMove);
    this.game.app.stage.off('pointerup', this.onStagePointerUp);
    this.game.app.stage.off('pointerupoutside', this.onStagePointerUp);

    const redPoints = this.controller.getPath('red')!.points;
    const yellowPoints = this.controller.getPath('yellow')!.points;

    const intersection = findPathsIntersection(redPoints, yellowPoints);
    const redEndLen = intersection
      ? intersection.lengthA
      : computePathLength(redPoints) * 0.6;
    const yellowEndLen = intersection
      ? intersection.lengthB
      : computePathLength(yellowPoints) * 0.6;

    await Promise.all([
      this.driveCarAlongPath(this.redCar, redPoints, redEndLen),
      this.driveCarAlongPath(this.yellowCar, yellowPoints, yellowEndLen),
    ]);

    await this.playCollisionShake();
    this.showFailScreen();
  }

  private driveCarAlongPath(car: Car, points: Point[], endLength: number): Promise<void> {
    return new Promise((resolve) => {
      const obj = { len: 0 };
      gsap.to(obj, {
        len: endLength,
        duration: DRIVE_DURATION,
        ease: 'power1.in',
        onUpdate: () => {
          const pos = getPointAtLength(points, obj.len);
          const angle = getAngleAtLength(points, obj.len);
          car.position.set(pos.x, pos.y);
          car.rotation = angle;
        },
        onComplete: resolve,
      });
    });
  }

  private playCollisionShake(): Promise<void> {
    const sx = this.root.x;
    const sy = this.root.y;
    return new Promise((resolve) => {
      gsap
        .timeline({
          onComplete: () => {
            this.root.x = sx;
            this.root.y = sy;
            resolve();
          },
        })
        .to(this.root, { x: sx + 14, y: sy - 6, duration: 0.055, ease: 'none' })
        .to(this.root, { x: sx - 14, y: sy + 6, duration: 0.055, ease: 'none' })
        .to(this.root, { x: sx + 10, y: sy - 4, duration: 0.055, ease: 'none' })
        .to(this.root, { x: sx - 8, y: sy + 4, duration: 0.055, ease: 'none' })
        .to(this.root, { x: sx + 5, y: sy - 2, duration: 0.055, ease: 'none' })
        .to(this.root, { x: sx, y: sy, duration: 0.055, ease: 'none' });
    });
  }

  // ─── Fail screen ─────────────────────────────────────────────────────────

  private showFailScreen(): void {
    const sprite = new Sprite(AssetLoader.getTexture('fail'));
    sprite.anchor.set(0.5);
    sprite.alpha = 0;
    // Must sit above root (zIndex=10) and hint, but below finalOverlay (zIndex=30)
    sprite.zIndex = 25;
    this.failSprite = sprite;
    this.positionFailSprite(sprite, this.game.viewportWidth, this.game.viewportHeight);
    this.addChild(sprite);

    // Start at 55 % scale
    const targetScaleX = sprite.scale.x;
    const targetScaleY = sprite.scale.y;
    sprite.scale.set(targetScaleX * 0.55, targetScaleY * 0.55);

    gsap.to(sprite, { alpha: 1, duration: 0.35, ease: 'power2.out' });
    gsap.to(sprite.scale, {
      x: targetScaleX,
      y: targetScaleY,
      duration: 0.45,
      ease: 'back.out(1.6)',
      onComplete: () => {
        window.setTimeout(() => this.showCTA(), 900);
      },
    });
  }

  private positionFailSprite(sprite: Sprite, width: number, height: number): void {
    sprite.position.set(width * 0.5, height * 0.42);
    const targetW = width * 0.74;
    const ratio = sprite.texture.height / sprite.texture.width;
    sprite.width = targetW;
    sprite.height = targetW * ratio;
  }

  private showCTA(): void {
    this.finalOverlay.visible = true;
    gsap.to(this.finalOverlay, { alpha: 1, duration: 0.45, ease: 'power1.out' });
    this.finalOverlay.button.once('pointerdown', () => {
      window.open(GAME_CONFIG.ctaUrl, '_blank');
    });
  }

  // ─── Inactivity fallback ──────────────────────────────────────────────────

  private resetInactivity(): void {
    this.scheduleInactivityTimeout();
  }

  private scheduleInactivityTimeout(): void {
    this.clearInactivityTimeout();
    this.inactivityTimerId = window.setTimeout(() => {
      this.showFinalSceneStub();
    }, GAME_CONFIG.inactivityTimeoutMs);
  }

  private clearInactivityTimeout(): void {
    if (this.inactivityTimerId !== null) {
      window.clearTimeout(this.inactivityTimerId);
      this.inactivityTimerId = null;
    }
  }

  private showFinalSceneStub(): void {
    this.clearInactivityTimeout();
    this.hintHand.fadeOutAndStop();
    this.finalOverlay.visible = true;
    gsap.to(this.finalOverlay, { alpha: 1, duration: 0.5, ease: 'power1.out' });
    this.finalOverlay.button.once('pointerdown', () => {
      window.open(GAME_CONFIG.ctaUrl, '_blank');
    });
  }
}
