import { VSMShadowMap, ACESFilmicToneMapping } from 'three';

const { PI } = Math;

export const StepsPerFrame = 5;

export const Game = {
  stepsPerFrame: 5,
  resizeDelayTime: 200,
};

export const Scene = {
  background: 0x000000,
  Fog: {
    color: 0x000000,
    near: 30,
    far: 1800,
  },
};
export const Camera = {
  FOV: 70,
  Aspect: window.innerWidth / window.innerHeight,
  near: 5,
  far: 2000,
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
    type: VSMShadowMap,
    toneMapping: ACESFilmicToneMapping,
  },
};
export const Light = {
  Ambient: {
    color: 0xfef9fb,
    intensity: 2,
  },
};

export const Grid = {
  color: 0x406080,
  Segments: {
    width: 20, // dev 20, prod 40
    height: 20, // dev 20, prod 40
    depth: 20, // dev 20, prod 40
  },
};

export const Entity = {
  //
};

export const Cylinder = {
  color: 0x4d4136,
  wireColor: 0x332000,
  pointColor: 0xf4e511, // 0xffff00,
};

export const Ground = {
  color: 0x4d4136,
  wireColor: 0x332000,
  pointColor: 0xf4e511,
};

export const Controls = {
  lookSpeed: 1,

  idleTime: 0.3,
  restoreSpeed: 6, // 3,
  restoreMinAngle: PI * 2 * (0.2 / 360),

  pointerMaxMove: 100,

  urgencyDuration: 0.2,
  stunningDuration: 0.4,

  inputDuration: 120,

  wheelSpeed: 3,
  horizontalAngleLimit: 160,
  virticalAngleLimit: 80,
};

export const World = {
  oob: -1000,
  gravity: 800, // 6,
  resistance: 4, // 10,
  airResistance: 1,
  Resistance: {
    ground: 4,
    air: 0.4,
    spin: 6, //12
    ammo: 1.2,
    obstacle: 0.1,
    item: 0.1,
  },
  collisionShock: 0.8,
  pointSize: 10,
  spacing: 80,
};

export const Screen = {
  normalColor: 0xffffff,
  sightPovColor: 0x5aff19,
  sightLinesColor: 0x9e9e9e,
  warnColor: 0xffc107,
  sightSize: 48,
  sightPovSize: 48,
  sightLinesSize: 128,
};
