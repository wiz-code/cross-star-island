import { Vector3 } from 'three';
import TWEEN from '@tweenjs/tween.js';

const { sin, PI } = Math;

const easeOutSine = (x) => sin((x * PI) / 2);

const easeOutCubic = (x) => 1 - (1 - x) * (1 - x) * (1 - x);

export const Keys = {
  // event.codeで取得する
  KeyW: 0,
  ArrowUp: 0,

  KeyA: 1,
  ArrowLeft: 1,

  KeyS: 2,
  ArrowDown: 2,

  KeyD: 3,
  ArrowRight: 3,

  KeyQ: 4,
  KeyE: 5,

  KeyR: 6,
  KeyF: 7,
  KeyZ: 8,
  KeyX: 9,
  KeyC: 10,

  Space: 11,

  // event.shiftKeyなどの真偽値で取得
  shift: 20,
  alt: 21,
};

export const Pointers = {
  left: 0,
  center: 1,
  right: 2,
};

export const Actions = {
  moveForward: 0,
  moveBackward: 1,
  moveLeft: 2,
  moveRight: 3,
  rotateLeft: 4,
  rotateRight: 5,

  jump: 10,

  quickMoveForward: 20,
  quickMoveBackward: 21,
  quickTurnLeft: 22,
  quickTurnRight: 23,
  quickMoveLeft: 24,
  quickMoveRight: 25,
};

export const States = {
  idle: 0,
  sprint: 1,
  urgency: 2,
  stunning: 3,
};

export const Obstacles = [
  [
    'round-stone',
    {
      radius: 80,
      detail: 1,
      weight: 5,

      color: 0x203b33,
      wireColor: 0x4c625b,
      pointColor: 0xf4e511,
      pointSize: 10,
      rotateSpeed: 2,

      update(deltaTime) {
        this.object.rotation.z -= deltaTime * this.data.rotateSpeed;
      },
    },
  ],
];

export const Compositions = [['stage', ['firstStage']]];

export const Guns = [
  [
    'normal-gun',
    {
      speed: 2000,
      fireInterval: 300,
      accuracy: 3,
      recoil: 1,////////

      ammoTypes: ['small-bullet', 'hop-bullet'],
    },
  ],
];

export const Ammo = [
  [
    'small-bullet',
    {
      color: 0xffe870,
      wireColor: 0xfffbe6,
      pointColor: 0xf45c41,
      pointSize: 10,

      radius: 6,
      detail: 0,
      numAmmo: 20, // dev 10, prod 50

      weight: 0.03,
      lifetime: 3,

      rotateSpeed: 10,

      update(deltaTime) {
        this.object.rotation.z -= deltaTime * this.data.rotateSpeed;
      },
    },
  ],
  [
    'hop-bullet',
    {
      color: 0xffe870,
      wireColor: 0xfffbe6,
      pointColor: 0xf45c41,
      pointSize: 10,

      radius: 6,
      detail: 0,
      numAmmo: 10, // dev 10, prod 50

      weight: 0.03,
      lifetime: 3,

      rotateSpeed: 10,

      hopValue: 350,
      hopDuration: 0.5,

      update(deltaTime) {
        this.object.rotation.z -= deltaTime * this.data.rotateSpeed;
        const elapsedTime = this.getElapsedTime();

        if (!this.isBounced() && elapsedTime <= this.data.hopDuration) {
          const ratio = easeOutCubic(elapsedTime);
          this.collider.center.y += deltaTime * ratio * this.data.hopValue;
        }
      },
    },
  ],
];

export const Characters = [
  [
    'hero-1',
    {
      color: 0x007399,
      wireColor: 0x004d66,
      pointColor: 0xeb4b2f,
      pointSize: 10,

      height: 20,
      radius: 10,
      weight: 1,

      speed: 300, // 3,
      turnSpeed: PI * 2 * (1 / 6), // 1秒間に1/6周する
      sprint: 2.5,
      urgencyMove: 8,

      // 1秒間に5/4周する設定にしたいが、緊急行動解除後のスタン中に起こるスライド量が回転角度を狂わせてしまうため、スライド中の角度量を加味する必要がある
      urgencyTurn: PI * 2,
      airSpeed: 100,
      jumpPower: 350,

      ammoTypes: ['small-bullet'],
      gunTypes: ['normal-gun'],
    },
  ],
];

export const Tweeners = [
  [
    'rolling-stone-position',
    (target) => {
      const tween = new TWEEN.Tween(target.collider.center);
      tween
        .onEveryStart(() => (target.velocity = new Vector3(0, 0, 0)))
        .to({ x: -2200, y: 300, z: 0 }, 0)
        .delay(10000)
        .repeat(Infinity)
        .start(0);

      return tween;
    },
  ],
];

export const Stages = [
  [
    'firstStage',
    {
      checkPoints: [
        {
          //position: new Vector3(-650, 0, 0),
          position: new Vector3(-1600, 100, 0),
          //position: new Vector3(-38 * 80, 1000, -6.5 * 80),
          direction: PI / 2,
        },
      ],
      characters: [
        {
          name: 'hero-1',
          position: new Vector3(-38 * 80, 1000, 3 * 80),
          direction: -25 * PI / 180,
          update(deltaTime) {
            const time = this.getElapsedTime();

            if (time > 2) {
              this.resetTime();
              this.fire();
            }
          },
        },
      ],
      obstacles: [
        {
          name: 'round-stone',
          position: new Vector3(-2000, 300, 0),
          tweeners: ['rolling-stone-position'],
        },
      ],
      components: [
        {
          grid: {
            widthSegments: 24,
            depthSegments: 6,
            depthSegments: 8,
            widthSpacing: 80,
            heightSpacing: 80,
            depthSpacing: 80,
            position: { sx: 0, sy: -0.2, sz: 0 },
          },
          ground: {
            widthSegments: 20,
            depthSegments: 6,
            widthSpacing: 80,
            depthSpacing: 80,
            bumpHeight: 0,
            position: { sx: 0, sy: 0, sz: 0, heightSpacing: 80 },
            rotation: { x: 0, y: 0, z: 0 },
          },
          arrow: {
            direction: new Vector3(-1, 0, 0),
            position: new Vector3(400, 200, 0),
            length: 200,
            color: 0xffffff,
          },
        },
        {
          ground: {
            widthSegments: 20,
            depthSegments: 6,
            widthSpacing: 80,
            depthSpacing: 80,
            bumpHeight: 0,
            position: { sx: 0, sy: 1.9, sz: 2.1, heightSpacing: 80 },
            rotation: { x: -PI / 2, y: 0, z: 0 },
          },
        },
        {
          ground: {
            widthSegments: 20,
            depthSegments: 8,
            widthSpacing: 80,
            depthSpacing: 80,
            bumpHeight: 0,
            position: { sx: 0, sy: 4.8, sz: 0, heightSpacing: 80 },
            rotation: { x: -PI, y: 0, z: 0 },
          },
        },
        {
          ground: {
            widthSegments: 20,
            depthSegments: 6,
            widthSpacing: 80,
            depthSpacing: 80,
            bumpHeight: 0,
            position: { sx: 0, sy: 1.9, sz: -2.1, heightSpacing: 80 },
            rotation: { x: PI / 2, y: 0, z: 0 },
          },
        },
        {
          grid: {
            widthSegments: 20,
            depthSegments: 6,
            depthSegments: 8,
            widthSpacing: 80,
            heightSpacing: 80,
            depthSpacing: 80,
            position: { sx: -22, sy: -0.2, sz: 0 },
          },
          arrow: {
            direction: new Vector3(0, -1, 0),
            position: new Vector3(-960, 300, 0),
            length: 200,
            color: 0xffffff,
          },
          ground: {
            widthSegments: 20,
            depthSegments: 5,
            widthSpacing: 80,
            depthSpacing: 80,
            bumpHeight: 2,
            position: { sx: -19.5, sy: -1, sz: 0, heightSpacing: 80 },
            rotation: { x: 0, y: 0, z: -0.2 },
          }
        },
        {
          ground: {
            widthSegments: 20,
            depthSegments: 8,
            widthSpacing: 80,
            depthSpacing: 80,
            bumpHeight: 4,
            position: { sx: -19.5, sy: -1, sz: 2.1, heightSpacing: 80 },
            rotation: { x: -1.4, y: 1, z: -1 },
          },
        },
        {
          ground: {
            widthSegments: 20,
            depthSegments: 8,
            widthSpacing: 80,
            depthSpacing: 80,
            bumpHeight: 4,
            position: { sx: -19.5, sy: -1, sz: -2.1, heightSpacing: 80 },
            rotation: { x: 1.4, y: -1, z: -1 },
          },
        },
        {
          grid: {
            widthSegments: 20,
            depthSegments: 6,
            depthSegments: 8,
            widthSpacing: 80,
            heightSpacing: 80,
            depthSpacing: 80,
            position: { sx: -42, sy: -2.2, sz: 0 },
          },
          cylinder: {
            radiusTop: 80,
            radiusBottom: 80,
            height: 20,
            radialSegments: 9,
            heightSegments: 1,
            position: { sx: -31, sy: 0.5, sz: -0.5, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 40,
            radiusBottom: 40,
            height: 20,
            radialSegments: 7,
            heightSegments: 1,
            position: { sx: -33, sy: 0.9, sz: -1.5, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 80,
            radiusBottom: 80,
            height: 20,
            radialSegments: 9,
            heightSegments: 1,
            position: { sx: -35, sy: 0, sz: -3.5, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 40,
            radiusBottom: 40,
            height: 20,
            radialSegments: 7,
            heightSegments: 1,
            position: { sx: -38, sy: 0.5, sz: 3, spacing: 80 },
          },
        },
      ],
    },
  ],
];
