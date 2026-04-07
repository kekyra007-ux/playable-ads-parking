export interface FitResult {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const coverScale = (
  viewportWidth: number,
  viewportHeight: number,
  designWidth: number,
  designHeight: number,
): FitResult => {
  const scale = Math.max(viewportWidth / designWidth, viewportHeight / designHeight);
  const scaledWidth = designWidth * scale;
  const scaledHeight = designHeight * scale;

  return {
    scale,
    offsetX: (viewportWidth - scaledWidth) * 0.5,
    offsetY: (viewportHeight - scaledHeight) * 0.5,
  };
};

export const containScale = (
  viewportWidth: number,
  viewportHeight: number,
  designWidth: number,
  designHeight: number,
): FitResult => {
  const scale = Math.min(viewportWidth / designWidth, viewportHeight / designHeight);
  const scaledWidth = designWidth * scale;
  const scaledHeight = designHeight * scale;

  return {
    scale,
    offsetX: (viewportWidth - scaledWidth) * 0.5,
    offsetY: (viewportHeight - scaledHeight) * 0.5,
  };
};
