import { Vector3 } from 'three';
import TWEEN from '@tweenjs/tween.js';

const { floor, random, sin, PI } = Math;

const getRandomInclusive = (min, max) => random() * (max - min) + min;

const easeOutSine = (x) => sin((x * PI) / 2);

const easeInQuad = (x) => x * x;

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
      weight: 6,

      color: 0x203b33,
      wireColor: 0x4c625b,
      pointColor: 0xf4e511,
      pointSize: 10,
      rotateSpeed: 2,
    },
  ],
  [
    'small-round-stone',
    {
      radius: 40,
      detail: 1,
      pointsDetail: 0,
      weight: 3,

      color: 0x203b33,
      wireColor: 0x4c625b,
      pointColor: 0xf4e511,
      pointSize: 10,
      rotateSpeed: 3,
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
      recoil: 1, /// /////

      ammoTypes: ['small-bullet', 'hop-bullet'],
    },
  ],
];

export const Ammo = [
  [
    'small-bullet',
    {
      color: 0xFFFFE0,
      wireColor: 0xA9A9A9,
      pointColor: 0xf45c41,
      pointSize: 10,

      radius: 6,
      detail: 0,
      numAmmo: 30, // dev 10, prod 50

      weight: 0.08,
      lifetime: 3,

      rotateSpeed: 10,

      update(deltaTime) {
        let rotateSpeed = !this.isBounced() ? this.data.rotateSpeed : this.data.rotateSpeed * 0.5;

        this.object.rotation.z -= deltaTime * rotateSpeed;
      },
    },
  ],
  [
    'hop-bullet',
    {
      color: 0xFFFFE0,
      wireColor: 0xA9A9A9,
      pointColor: 0xf45c41,
      pointSize: 10,

      radius: 6,
      detail: 0,
      numAmmo: 10, // dev 10, prod 50

      weight: 0.08,
      lifetime: 3,

      rotateSpeed: 10,

      hopValue: 350,
      hopDuration: 0.5,


      update(deltaTime, elapsedTime) {
        this.object.rotation.z -= deltaTime * this.data.rotateSpeed;

        if (!this.isBounced()) {
          if (this.elapsedTime <= this.data.hopDuration) {
            const ratio = easeOutCubic(this.elapsedTime);
            this.collider.center.y += deltaTime * ratio * this.data.hopValue;
          } else {
            const ratio = 1 - easeInQuad(this.elapsedTime - this.data.hopDuration);

            if (ratio >= 0) {
              this.collider.center.y += deltaTime * ratio * this.data.hopValue;
            }
          }
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

      gunTypes: ['normal-gun'],
    },
  ],
];

export const Items = [
  [
    'checkpoint',
    {
      method: 'createRing',

      radius : 20,
      tube : 3,
      radialSegments: 6,
      tubularSegments: 12,
      weight: 1,

      color: 0xffe870,
      wireColor: 0xfffbe6,
      pointColor: 0xffffff,
      pointSize: 10,

      rotateSpeed: 2,

      dispatchers: ['nextCheckpoint'],

      update(deltaTime) {
        //
      }
    },
  ],
  [
    'weapon-upgrade',
    {
      method: 'createRing',

      radius : 20,
      tube : 3,
      radialSegments: 6,
      tubularSegments: 12,

      color: 0xADD8E6,
      wireColor: 0xA9A9A9,
      pointColor: 0x90EE90,
      pointSize: 10,

      rotateSpeed: 2,

      dispatchers: ['weaponUpgrade'],

      update(deltaTime) {
        //
      }
    },
  ],
];

export const Tweeners = [
  [
    'rolling-stone-1',
    (target, arg) => {
      const time = arg ?? 0;

      const group = new TWEEN.Group();
      const tween = new TWEEN.Tween(target.collider.center, group);
      tween
        .onEveryStart(() => {
          const posZ = getRandomInclusive(-80, 80);
          target.collider.center.set(-2100, 300, posZ);
          target.velocity.copy(new Vector3(0, 0, 0));
        })
        .delay(10000)
        .repeat(Infinity)
        .start(time);

      return group;
    },
  ],
  [
    'avoidance-1',
    (target, arg) => {
      const time = arg ?? 0;
      let prevValue = 0;
      const offset = { z: 0 };
      const update = ({ z }) => {
        target.collider.start.z += z - prevValue;
        target.collider.end.copy(target.collider.start);
        target.collider.end.y += target.data.height + target.data.radius;
        prevValue = z;
      };

      const group = new TWEEN.Group();
      const tween1 = new TWEEN.Tween(offset, group)
        .to({ z: -40 }, 1000)
        .onUpdate(update);
      const tween2 = new TWEEN.Tween(offset, group)
        .to({ z: 0 }, 1000)
        .onUpdate(update);

      tween1.chain(tween2).start(time);
      tween2.chain(tween1);

      return group;
    },
  ],
];

export const Stages = [
  [
    'firstStage',
    {
      checkpoints: [
        {
          position: new Vector3(8 * 80, 0, 0),
          //position: new Vector3(-35 * 80, 0, -3.5 * 80),
          //position: new Vector3(-2200, 100, 0),
          //position: new Vector3(-40 * 80, 200, -1 * 80),
          //position: new Vector3(-34.5 * 80, 100, -3.8 * 80),
          phi: PI / 2,
        },
        {
          position: new Vector3(-8 * 80, 200, 0),
          phi: PI / 2,
        },
        {
          position: new Vector3(-31 * 80, 200, -0.5 * 80),
          phi: PI / 2,
        },
        // 最終チェックポイント
        {
          position: new Vector3(-40 * 80, 200, -1 * 80),
          phi: PI / 2,
        },
      ],
      characters: [
        {
          name: 'hero-1',
          position: new Vector3(-43 * 80, 300, -0.8 * 80),
          phi: -PI / 2,
          theta: -0.1,
          tweeners: [{ name: 'avoidance-1' }],
          schedule: {
            spawnedAt: 0,
          },
          update(deltaTime, elapsedTime) {
            this.elapsedTime += deltaTime;

            if (this.elapsedTime > 0.5) {
              this.elapsedTime = 0;
              this.fire();
            }
          },
        },
        {
          name: 'hero-1',
          position: new Vector3(-45 * 80, 300, -0.8 * 80),
          phi: (80 * -PI) / 180,
          theta: -0.1,
          tweeners: [{ name: 'avoidance-1' }],
          schedule: {
            spawnedAt: 2,
          },
          update(deltaTime, elapsedTime) {
            this.elapsedTime += deltaTime;

            if (this.elapsedTime > 0.8) {
              this.elapsedTime = 0;
              this.fire();
            }
          },
        },
        {
          name: 'hero-1',
          position: new Vector3(-47 * 80, 300, -0.8 * 80),
          phi: (98 * -PI) / 180,
          theta: -0.1,
          tweeners: [{ name: 'avoidance-1' }],
          schedule: {
            spawnedAt: 4,
          },
          update(deltaTime, elapsedTime) {
            this.elapsedTime += deltaTime;

            if (this.elapsedTime > 0.8) {
              this.elapsedTime = 0;
              this.fire();
            }
          },
        },
        {
          name: 'hero-1',
          position: new Vector3(-38 * 80, 1000, 3 * 80),
          phi: (-25 * PI) / 180,
          schedule: {
            spawnedAt: 5,
          },
          update(deltaTime, elapsedTime) {
            this.elapsedTime += deltaTime;

            if (this.elapsedTime > 1) {
              this.elapsedTime = 0;
              this.fire();
            }
          },
        },
      ],
      obstacles: [
        {
          name: 'round-stone',
          position: new Vector3(-2100, 300, 0),
          tweeners: [{ name: 'rolling-stone-1' }],
          spawnedAt: 0,
          update(deltaTime) {
            this.object.rotation.z -= deltaTime * this.data.rotateSpeed;
          },
        },
        {
          name: 'round-stone',
          position: new Vector3(-2100, 300, 0),
          tweeners: [{ name: 'rolling-stone-1', arg: 5000 }],
          spawnedAt: 5,
          update(deltaTime) {
            this.object.rotation.z -= deltaTime * this.data.rotateSpeed;
          },
        },
        {
          name: 'small-round-stone',
          position: new Vector3(-2100, 300, 0),
          tweeners: [{ name: 'rolling-stone-1', arg: 2500 }],
          spawnedAt: 2.5,
          update(deltaTime) {
            this.object.rotation.z -= deltaTime * this.data.rotateSpeed;
          },
        },
        {
          name: 'small-round-stone',
          position: new Vector3(-2100, 300, 0),
          tweeners: [{ name: 'rolling-stone-1', arg: 7500 }],
          spawnedAt: 7.5,
          update(deltaTime) {
            this.object.rotation.z -= deltaTime * this.data.rotateSpeed;
          },
        },
      ],
      items: [
        {
          name: 'checkpoint',
          position: new Vector3(-8 * 80, 200, 0),
          spawnedAt: 5,
          update(deltaTime) {
            const rotateSpeed = deltaTime * this.data.rotateSpeed;
            this.object.rotation.y -= rotateSpeed;
            this.object.rotation.z -= rotateSpeed * 2;
          },
        },
        {
          name: 'checkpoint',
          position: new Vector3(-31 * 80, 200, -0.5 * 80),
          //tweeners: [{ name: 'rolling-stone-1', arg: 7500 }],
          spawnedAt: 5,
          update(deltaTime) {
            const rotateSpeed = deltaTime * this.data.rotateSpeed;
            this.object.rotation.y -= rotateSpeed;
            this.object.rotation.z -= rotateSpeed * 2;
          },
        },
        {
          name: 'checkpoint',
          position: new Vector3(-40 * 80, 200, -1 * 80),
          //tweeners: [{ name: 'rolling-stone-1', arg: 7500 }],
          spawnedAt: 5,
          update(deltaTime) {
            const rotateSpeed = deltaTime * this.data.rotateSpeed;
            this.object.rotation.y -= rotateSpeed;
            this.object.rotation.z -= rotateSpeed * 2;
          },
        },
        {
          name: 'weapon-upgrade',
          position: new Vector3(-35 * 80, -4 * 80, -7 * 80),
          //tweeners: [{ name: 'rolling-stone-1', arg: 7500 }],
          spawnedAt: 0,
          update(deltaTime) {
            const rotateSpeed = deltaTime * this.data.rotateSpeed;
            this.object.rotation.y -= rotateSpeed;
            this.object.rotation.z -= rotateSpeed * 2;
          },
        },
      ],
      components: [
        {
          grid: {
            widthSegments: 24,
            heightSegments: 6,
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
            heightSegments: 6,
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
          },
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
            widthSegments: 24,
            heightSegments: 6,
            depthSegments: 12,
            widthSpacing: 80,
            heightSpacing: 80,
            depthSpacing: 80,
            position: { sx: -44, sy: 2.2, sz: 0 },
          },
          cylinder: {
            radiusTop: 80,
            radiusBottom: 80,
            height: 10,
            radialSegments: 9,
            heightSegments: 1,
            position: { sx: -31, sy: 0.5, sz: -0.5, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 40,
            radiusBottom: 40,
            height: 10,
            radialSegments: 7,
            heightSegments: 1,
            position: { sx: -33, sy: 0.4, sz: -1.5, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 80,
            radiusBottom: 80,
            height: 10,
            radialSegments: 9,
            heightSegments: 1,
            position: { sx: -34.5, sy: 0, sz: -3.8, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 80,
            radiusBottom: 80,
            height: 10,
            radialSegments: 9,
            heightSegments: 1,
            position: { sx: -35, sy: -4, sz: -7, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 40,
            radiusBottom: 40,
            height: 10,
            radialSegments: 7,
            heightSegments: 1,
            position: { sx: -38, sy: 0.5, sz: 3, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 40,
            radiusBottom: 40,
            height: 10,
            radialSegments: 7,
            heightSegments: 1,
            position: { sx: -35.8, sy: 0.3, sz: -2, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 40,
            radiusBottom: 40,
            height: 10,
            radialSegments: 7,
            heightSegments: 1,
            position: { sx: -37.5, sy: 0.6, sz: -1, spacing: 80 },
          },
        },
        {
          cylinder: {
            radiusTop: 100,
            radiusBottom: 100,
            height: 10,
            radialSegments: 10,
            heightSegments: 1,
            position: { sx: -40, sy: 0.62, sz: -1, spacing: 80 },
          },
        },
        {
          ground: {
            widthSegments: 10,
            depthSegments: 1,
            widthSpacing: 80,
            depthSpacing: 80,
            bumpHeight: 0,
            position: { sx: -46, sy: 1.5, sz: -1, heightSpacing: 80 },
            rotation: { x: 0, y: 0, z: -0.2 },
          },
        },
        {
          cylinder: {
            radiusTop: 100,
            radiusBottom: 100,
            height: 10,
            radialSegments: 10,
            heightSegments: 1,
            position: { sx: -53, sy: 2, sz: -1, spacing: 80 },
          },
        },
      ],
    },
  ],
];
