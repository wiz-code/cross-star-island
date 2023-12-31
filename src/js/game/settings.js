import * as THREE from 'three';

export const ResizeDelayTime = 200;
export const StepsPerFrame = 3;

export const PlayerSettings = {
  height: 24,
  radius: 8,
  Position: {
    x: 0,
    y: 300,
    z: 100,
  },
};

export const Scene = {
  background: 0x000000,
  Fog: {
    color: 0x000000,
    near: 30,
    far: 1000,
  },
};
export const Camera = {
  FOV: 70,
  Aspect: window.innerWidth / window.innerHeight,
  near: PlayerSettings.radius,
  far: 1000,
  order: 'YXZ',
};

export const Renderer = {
  pixelRatio: window.devicePixelRatio,
  Size: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  ShadowMap: {
    enabled: true,
    type: THREE.VSMShadowMap,
    toneMapping: THREE.ACESFilmicToneMapping,
  },
};
export const Light = {
  Hemisphere: {
    groundColor: 0x8dc1de,
    color: 0x00668d,
    intensity: 1.5,
  },
  Directional: {
    Position: {
      x: 100,
      y: 1000,
      z: 0,
    },
    color: 0xffffff,
    intensity: 2.5,
    castShadow: true,
    Shadow: {
      Near: 0.1,
      Far: 500,
      left: -30,
      top: 30,
      right: 30,
      bottom: -30,
      MapSize: {
        width: 1024,
        height: 1024,
      },
      radius: 4,
      bias: -0.00006,
    },
  },
};

export const Grid = {
  color: 0x406080,
  size: 10,
  Spacing: {
    width: 70,
    height: 70,
    depth: 70,
  },
  Segments: {
    width: 20,
    height: 20,
    depth: 20,
  },
};

export const Ground = {
  heightCoef: 8,
  color: 0x4d4136,
  wireframeColor: 0x332000,
  pointsColor: 0xffff00,
};

export const Controls = {
  speed: 18,
  sprint: 2,
  airSpeed: 6,
  resistance: 10,
  airResistance: 2,
  rotateSpeed: 3,
  jumpPower: 10,
  lookSpeed: 10,
};

export const World = {
  gravity: 8,
};
