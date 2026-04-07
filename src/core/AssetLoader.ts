import { Loader, Texture } from 'pixi.js';

export const ASSET_MANIFEST = {
  hand: 'assets/hand.png',
  gameLogo: 'assets/gamelogo.jpg',
  button: 'assets/button.png',
  fail: 'assets/fail.png',
  yellowCar: 'assets/01_yellow.png',
  ambulance: 'assets/02_ambulance.png',
  blueCar: 'assets/03_blue.png',
  greenCar: 'assets/04_green.png',
  redCar: 'assets/05_red.png',
} as const;

export type AssetKey = keyof typeof ASSET_MANIFEST;

export class AssetLoader {
  private static loaded = false;
  private static textures = new Map<AssetKey, Texture>();

  public static async loadAll(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const loader = Loader.shared;
    loader.reset();

    (Object.entries(ASSET_MANIFEST) as Array<[AssetKey, string]>).forEach(([key, url]) => {
      loader.add(key, url);
    });

    await new Promise<void>((resolve, reject) => {
      loader.load((_loader, resources) => {
        try {
          (Object.keys(ASSET_MANIFEST) as AssetKey[]).forEach((key) => {
            const resource = resources[key];
            if (!resource?.texture) {
              throw new Error(`Texture is not available for asset: ${key}`);
            }
            this.textures.set(key, resource.texture);
          });

          this.loaded = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      loader.onError.once((error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  public static getTexture(key: AssetKey): Texture {
    const texture = this.textures.get(key);

    if (!texture) {
      throw new Error(`Texture is not loaded: ${key}`);
    }

    return texture;
  }
}
