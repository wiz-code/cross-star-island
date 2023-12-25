import * as THREE from 'three';

export const ResizeDelayTime = 200;

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
  ASPECT: window.innerWidth / window.innerHeight,
  near: 30,
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
  Size: 10,
  Spacing: {
    width: 70,
    height: 70,
    depth: 70,
  },
  Segments: {
    width: 10,
    height: 10,
    depth: 10,
  },
};

export const Ground = {
  color: 0x664000,
  wireframeColor: 0x332000,
  pointsColor: 0xffff00,
};
