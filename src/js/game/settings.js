import { Vector3, Euler, VSMShadowMap, ACESFilmicToneMapping } from 'three';

const { PI } = Math;

export const ResizeDelayTime = 200;
export const StepsPerFrame = 5;

export const PlayerSettings = {
  height: 40,
  radius: 5,
  weight: 100,

  speed: 3,
  turnSpeed: PI * 2 * (1 / 6), // 1秒間に1/6周する
  sprint: 2.5,
  urgencyMove: 8,

  // 1秒間に5/4周する設定にしたいが、緊急行動解除後のスタン中に起こるスライド量が回転角度を狂わせてしまうため、スライド中の角度量を加味する必要がある
  urgencyTurn: PI * 2 * (15 / 16), //PI * 2 * (13.8 / 16),
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

export const Ground = {
  Object: {
    color: 0x1955a6,
    size: 5,
    pointsColor: 0xdc3545, // 0xa3d8f6,
  },
  heightCoef: 6,
  color: 0x4d4136,
  wireframeColor: 0x332000,
  pointsColor: 0xf4e511, // 0xffff00,
  wallHeightSize: 4,
  wallColor: 0x203b33,
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
  numAmmo: 5, // dev 5, prod 50
  lifetime: 5000,
  speed: 1600,
  rotateSpeed: 8,
  weight: 1,
};

export const Stages = {
  firstStage: {
    player: {
      //position: new Vector3(650, 200, 0),
      position: new Vector3(1520, 0, 0),
      direction: PI / 2,
    },
    components: [
      {
        grid: [44, 6, 8, 80, 80, 80, { grid: { x: 0, y: -0.2, z: 0 } }],
        ground: [40, 6, 80, 80, 0, { grid: { x: 0, y: 0, z: 0, spacing: 80 } }, { x: 0, y: 0, z: 0 }],
        arrow: { direction: new Vector3(-1, 0, 0), position: new Vector3(1350, 80, -160), length: 80, color: 0xffffff },
      },
      {
        ground: [40, 6, 80, 80, 0, { grid: { x: 0, y: 1.9, z: 2.1, spacing: 80 } }, { x: -PI / 2, y: 0, z: 0 }],
      },
      {
        ground: [40, 8, 80, 80, 0, { grid: { x: 0, y: 5.5, z: 0, spacing: 80 } }, { x: -PI, y: 0, z: 0 }],
      },
      {
        ground: [40, 6, 80, 80, 0, { grid: { x: 0, y: 1.9, z: -2.1, spacing: 80 } }, { x: PI / 2, y: 0, z: 0 }],
      },
      /*{
        grid: [24, 12, 10, 80, 80, 80, { x: 320, y: 0, z: 0 }],
        ground: [20, 3, 80, 80, 2, { x: 0, y: 0, z: 0 }, { x: -0.05, y: 0, z: 0 }],
      },
      {
        grid: [20, 12, 10, 80, 80, 80, { x: -600, y: -700, z: -900 }],
        ground: [20, 3, 80, 80, 5, { x: -700, y: -800, z: -500 }, { x: 0.02, y: PI / 2, z: -0.5 }],
      },*/
    ],
  },
};
