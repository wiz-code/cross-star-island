import * as THREE from 'three';

const { PI } = Math;

export const ResizeDelayTime = 200;
export const StepsPerFrame = 3;

export const PlayerSettings = {
  height: 30,
  radius: 5,
  Position: {
    x: 0,
    y: 300,
    z: 100,
  },

  speed: 6, // 9
  rotateSpeed: 8,
  sprint: 2.5, // 2.8
  urgencyMove: 10, // 7
  urgencyTurn: 9, // 7
  airSpeed: 3,
  jumpPower: 12,
  lookSpeed: 2, // 20
};

export const Scene = {
  background: 0x000000,
  Fog: {
    color: 0x000000,
    near: 30,
    far: 1600,
  },
};
export const Camera = {
  FOV: 70,
  Aspect: window.innerWidth / window.innerHeight,
  near: PlayerSettings.radius / 2,
  far: 2000, // メートル換算470m
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
    width: 80,
    height: 80,
    depth: 80,
  },
  Segments: {
    width: 20, // dev 20, prod 40
    height: 20, // dev 20, prod 40
    depth: 20, // dev 20, prod 40
  },
};

export const Entity = {
  //
};

export const Ground = {
  Object: {
    color: 0x1955a6,
    size: 5,
    pointsColor: 0xdc3545,//0xa3d8f6,
  },
  heightCoef: 6,
  color: 0x4d4136,
  wireframeColor: 0x332000,
  pointsColor: 0xf4e511, // 0xffff00,
  wallHeightSize: 4,
};

export const Controls = {
  speed: 3,
  sprint: 2.5,
  urgencyMove: 7,
  urgencyTurn: 9,
  airSpeed: 3,
  resistance: 10,
  airResistance: 2,
  rotateSpeed: 6,
  jumpPower: 15,
  lookSpeed: 2,

  idleTime: 0.3,
  restoreSpeed: 3,//1.2,
  restoreMinAngle: PI * 2 * (0.2 / 360),

  pointerMaxMove: 80,

  urgencyDuration: 0.2,
  stunningDuration: 0.4,
};

export const World = {
  gravity: 6,
  resistance: 10,
  airResistance: 2,
};

export const Screen = {
  normalColor: 0xffffff,
  sightPovColor: 0x5aff19,
  warnColor: 0xffc107,
  sightSize: 48,
  sightPovSize: 48,
};

export const AmmoSettings = {
  color: 0xff0000,
  wireColor: 0x332000,
  pointColor: 0xa3d8f6,
  pointSize: 10,
  radius: 5,
  numAmmo: 2, // 100
  lifetime: 5000,
  speed: 1600,
  rotateSpeed: 8,
};
