import { VSMShadowMap, ACESFilmicToneMapping } from 'three';

const { PI } = Math;

export const StepsPerFrame = 5;

export const Game = {
  stepsPerFrame: 5,
  resizeDelayTime: 200,
};

export const PlayerSettings = {
  height: 40,
  radius: 5,
  weight: 100,

  speed: 3,
  turnSpeed: PI * 2 * (1 / 6), // 1秒間に1/6周する
  sprint: 2.5,
  urgencyMove: 8,

  // 1秒間に5/4周する設定にしたいが、緊急行動解除後のスタン中に起こるスライド量が回転角度を狂わせてしまうため、スライド中の角度量を加味する必要がある
  urgencyTurn: PI * 2 * (15.7 / 16), // PI * 2 * (13.8 / 16),
  airSpeed: 3,
  jumpPower: 2,
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
  near: PlayerSettings.radius / 2,
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

export const ObjectSettings = {
  color: 0x203b33, // 0x3d342b,
  wireframeColor: 0x4c625b, // 0x70624c,
  pointsColor: 0xf4e511,
  rotateSpeed: 2,
};

export const Cylinder = {
  color: 0x4d4136,
  wireColor: 0x332000,
  pointColor: 0xf4e511, // 0xffff00,
  pointSize: 10,
};

export const Ground = {
  color: 0x4d4136,
  wireColor: 0x332000,
  pointColor: 0xf4e511,
  pointSize: 10,
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
};

export const World = {
  oob: -1000,
  gravity: 800, // 6,
  resistance: 4, // 10,
  airResistance: 1,
  Resistance: {
    ground: 4,
    air: 0.4,
    spin: 12,
    ammo: 1.2,
    obstacle: 0.1,
    item: 0.1,
  },
  collisionShock: 0.8,
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

export const AmmoSettings = {
  color: 0xffe870,
  wireColor: 0xfffbe6,
  pointColor: 0xf45c41, // 0xa3d8f6,
  pointSize: 10,
  radius: 7,
  numAmmo: 5, // dev 5, prod 50
  lifetime: 5000,
  speed: 1600,
  rotateSpeed: 8,
  weight: 1,
};
