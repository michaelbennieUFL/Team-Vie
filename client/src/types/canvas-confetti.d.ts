declare module 'canvas-confetti' {
  type ConfettiOrigin = {
    x?: number;
    y?: number;
  };

  export type Options = {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    flat?: boolean;
    ticks?: number;
    origin?: ConfettiOrigin;
    colors?: string[];
    shapes?: string[];
    zIndex?: number;
    scalar?: number;
    disableForReducedMotion?: boolean;
  };

  type ConfettiFunction = (options?: Options) => Promise<null> | null;

  const confetti: ConfettiFunction;

  export default confetti;
}
