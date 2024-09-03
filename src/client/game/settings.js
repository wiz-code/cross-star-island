import { VSMShadowMap, ACESFilmicToneMapping, Color } from 'three';

const { PI } = Math;

export const Game = {
  stepsPerFrame: 5,
  resizeDelayTime: 200,
  volume: 0.5,
  EPS: 1e-6,
};

export const Scene = {
  background: 0x000000,
  Fog: {
    color: 0x000000,
    near: 60, // 30
    far: 600, // 1800
    density: 0.004,
  },
};
export const Camera = {
  FOV: 60, // 70
  Aspect: window.innerWidth / window.innerHeight,
  near: 1, // 5
  far: 800, // 2000
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
  color: 0x4d7399, // 0x406080,
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
  color: 0x5A4C3F, //0x4d4136,
  wireColor: 0x332000,
  pointColor: 0xf4e511, // 0xffff00,
};

export const Ground = {
  color: 0x4d4136,
  wireColor: 0x332000,
  pointColor: 0xf4e511,
};

export const Tower = {
  color: 0x665747, // 0x806d59,
  stairColor: 0x806d59,

  wireColor: 0x332000,
  pointColor: 0xf4e511,
};

export const Column = {
  color: 0x665747,

  wireColor: 0x332000,
  pointColor: 0xf4e511,
};

export const Controls = {
  idleTime: 0.3,
  restoreSpeed: 8, // 4,
  restoreMinAngle: PI * 2 * (0.2 / 360),

  pointerMaxMove: 100,
  stickSpeed: 3.5,//5,

  urgencyDuration: 0.2,
  stunningDuration: 0.3,

  urgencyTurnDuration: 0.4,
  stunningTurnDuration: 0.1,

  turnLagTime: 1,
  urgencyTurn: (180 / 360) * PI * 2, // (PI * 17.5) / 6, // PI * 2,

  inputDuration: 120,

  wheelSpeed: 3,
  horizontalAngleLimit: 160,
  verticalAngleLimit: 80,

  lookSpeed: 135, //120, // 250,
  stickMomentum: 18,
  momentum: 10, //7, // 10,
};

export const World = {
  oob: -240,
  gravity: 300,
  baseResistance: -6,
  Resistance: {
    ground: 1,
    air: 0.1,
    spin: 5,
    ammo: 0.2,
    obstacle: 1 / 60,
    item: 2 / 3,
  },
  collisionShock: 0.8,
  pointSize: 2, // 10
  spacing: 16, // 80
  fallingDeathDistance: 145,
};

const Screen = {
  normalColor: 0xffffff,
  sightPovColor: 0x5aff19,
  sightLinesColor: 0x9e9e9e,
  verticalFrameColor: 0x9e9e9e,
  centerMarkColor: 0x9e9e9e,
  warnColor: 0xffc107,
  sightSize: 36, // 48,
  sightPovSize: 384, // 512,//48,
  sightLinesSize: 128 * 0.75,
  horizontalIndicatorSize: 128 * 0.75,
  centerMarkSize: 128 * 0.75,
  verticalFrameSize: 384, // 512,
  gaugeHeight: 384 * 0.75 - 14, // 384 * 0.75 * 0.5 - 6,
};

export const GameColor = {
  SightColor: {
    front: new Color(Screen.normalColor),
    pov: new Color(Screen.sightPovColor),
  },
  IndicatorColor: {
    normal: new Color(Screen.normalColor),
    beyondFov: new Color(Screen.warnColor),
  },
  SightLinesColor: {
    normal: new Color(Screen.sightLinesColor),
    wheel: new Color(Screen.sightPovColor),
  },
};

export { Screen };

const filename = '/index.html';
const { pathname } = location;
let prefix = '';

if (pathname.includes(filename)) {
  const lastIndex = pathname.lastIndexOf(filename);
  prefix = pathname.substring(0, lastIndex + 1);
}

export const Url = {
  assets: `${prefix}assets/`,
  images: `${prefix}assets/images/`,
  sounds: `${prefix}assets/sounds/`,
  /* assets: 'assets/',
  images: 'assets/images/',
  sounds: 'assets/sounds/', */
};
