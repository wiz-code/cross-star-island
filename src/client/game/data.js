import { Vector3 } from 'three';

const { sin, PI } = Math;

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
  alive: 0,
  sprint: 1,
  urgency: 2,
  stunning: 3,
};

export const GlobalStates = [
  ['stageIndex', 0],
  ['checkpointIndex', 0],
  ['mode', 'unstarted'], // 'unstarted', 'play', 'gameover'
];

export const GlobalMethods = [
  [
    'play-sound',
    function (key, options) {
      this.playSound(key, options);
    },
  ],
];

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

export const Ammos = [
  [
    'small-bullet',
    {
      color: 0xffffe0,
      wireColor: 0xf7ca79,
      pointColor: 0xf45c41,

      radius: 6,
      detail: 1,
      numAmmo: 30, // dev 10, prod 50

      weight: 0.08,
      lifetime: 3,

      rotateSpeed: 10,

      updaters: [
        {
          state: States.alive,
          update(target, deltaTime) {
            const rotateSpeed = !target.isBounced()
              ? target.data.rotateSpeed
              : target.data.rotateSpeed * 0.5;

            target.object.rotation.z -= deltaTime * rotateSpeed;
          },
        },
      ],
    },
  ],
  [
    'hop-bullet',
    {
      color: 0x75c6c3,
      wireColor: 0x424a76,
      pointColor: 0xf45c41,

      radius: 6,
      detail: 1,
      numAmmo: 10, // dev 10, prod 50

      weight: 0.08,
      lifetime: 3,

      rotateSpeed: 10,

      hopValue: 350,
      hopDuration: 0.5,

      updaters: [
        {
          state: States.alive,
          update(target, deltaTime) {
            target.object.rotation.z -= deltaTime * target.data.rotateSpeed;

            if (!target.isBounced()) {
              if (target.elapsedTime <= target.data.hopDuration) {
                const ratio = easeOutCubic(target.elapsedTime);
                target.collider.center.y +=
                  deltaTime * ratio * target.data.hopValue;
              } else {
                const ratio =
                  1 - easeInQuad(target.elapsedTime - target.data.hopDuration);

                if (ratio >= 0) {
                  target.collider.center.y +=
                    deltaTime * ratio * target.data.hopValue;
                }
              }
            }
          },
        },
      ],
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
      faceColor: 0xdc143c,
      faceWireColor: 0xdb6e84,

      height: 20,
      radius: 10,
      weight: 1,

      speed: 300, // 3,
      rotateSpeed: 2,
      // turnSpeed: PI * 2 * (1 / 6), // 1秒間に1/6周する
      turnSpeed: PI * 2 * (1 / 3), // 1秒間に1/3周する
      sprint: 2.5,
      urgencyMove: 8,

      // 1秒間に5/4周する設定にしたいが、緊急行動解除後のスタン中に起こるスライド量が回転角度を狂わせてしまうため、スライド中の角度量を加味する必要がある
      urgencyTurn: (PI * 17.5) / 6, // PI * 2,
      airSpeed: 100,
      jumpPower: 350,

      gunTypes: ['normal-gun'],
    },
  ],
  [
    'heroine-1',
    {
      color: 0xfff0f5,
      wireColor: 0xffd700,
      pointColor: 0xeb4b2f,
      faceColor: 0x87ceeb,
      faceWireColor: 0xffd700,

      model: 'model-2',
      motions: ['VRMA_01'],
      // pose: 'pose-1',
      modelSize: 27.5,
      offsetY: 20,
      rotateSpeed: 2,

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

export const Sounds = [
  ['shot', 'ショット.mp3'],
  ['damage', '打撃1.mp3'],
  ['jump', 'カーソル移動3.mp3'],
  ['get-item', '決定11.mp3'],
  ['dash', '回避.mp3'],
  ['girl-voice-1', '「すごいすごい」.mp3'],
  ['goal', 'きらきら輝く1.mp3'],
];

export const Items = [
  [
    'checkpoint',
    {
      method: 'createRing',

      radius: 20,
      tube: 3,
      radialSegments: 6,
      tubularSegments: 12,
      weight: 1,

      color: 0xffe870,
      wireColor: 0xfffbe6,
      pointColor: 0xffffff,

      rotateSpeed: 2,

      updaters: [
        {
          state: States.alive,
          update(deltaTime) {
            //
          },
        },
      ],
    },
  ],
  [
    'weapon-upgrade',
    {
      method: 'createRing',

      radius: 20,
      tube: 3,
      radialSegments: 6,
      tubularSegments: 12,

      color: 0xadd8e6,
      wireColor: 0xa9a9a9,
      pointColor: 0x90ee90,

      rotateSpeed: 2,

      updaters: [
        {
          state: States.alive,
          update(deltaTime) {
            //
          },
        },
      ],
    },
  ],
];

export const Stages = [
  [
    'firstStage',
    {
      checkpoints: [
        {
          position: { sx: 8, sy: 4, sz: 0.1 },
          phi: PI / 2,
        },
        {
          position: { sx: -8, sy: 4, sz: 0 },
          phi: PI / 2,
        },
        {
          position: { sx: -31, sy: 4, sz: 1.5 },
          phi: PI / 2,
        },
        // 最終チェックポイント
        {
          position: { sx: -40, sy: 4, sz: 1 },
          phi: PI / 2,
        },
      ],
      characters: [
        {
          name: 'girl-1',
          ctype: 'heroine-1',
          position: { sx: -53, sy: 4, sz: 1 },
          phi: -PI * 0.5,
          pose: 'pose-1',
          schedule: {
            spawnTime: 1,
          },
          updaters: ['satellite-points'],
        },
        {
          name: 'hero-1',
          ctype: 'hero-1',
          position: { sx: -43, sy: 2, sz: 1.2 },
          phi: -PI / 2,
          theta: -0.1,
          ammoType: 'small-bullet',
          tweeners: [{ name: 'avoidance-1', state: States.alive }],
          schedule: {
            spawnTime: 1,
          },
          params: {
            elapsedTime: 0,
            fireInterval: 0.4,
          },
          updaters: ['bullet-fire-1', 'satellite-points'],
        },
        {
          name: 'hero-1',
          ctype: 'hero-1',
          position: { sx: -45, sy: 2, sz: 1.2 },
          phi: (80 * -PI) / 180,
          theta: -0.1,
          ammoType: 'small-bullet',
          tweeners: [{ name: 'avoidance-1', state: States.alive }],
          schedule: {
            spawnTime: 2,
          },
          params: {
            elapsedTime: 0,
            fireInterval: 0.8,
          },
          updaters: ['bullet-fire-1', 'satellite-points'],
        },
        {
          name: 'hero-1',
          ctype: 'hero-1',
          position: { sx: -47, sy: 2, sz: 1.2 },
          phi: (98 * -PI) / 180,
          theta: -0.1,
          ammoType: 'small-bullet',
          tweeners: [{ name: 'avoidance-1', state: States.alive }],
          schedule: {
            spawnTime: 4,
          },
          params: {
            elapsedTime: 0,
            fireInterval: 0.8,
          },
          updaters: ['bullet-fire-1', 'satellite-points'],
        },
        {
          name: 'hero-1',
          ctype: 'hero-1',
          position: { sx: -38, sy: 4, sz: 5 },
          phi: (-27 * PI) / 180,
          theta: -0.1,
          ammoType: 'hop-bullet',
          schedule: {
            spawnTime: 5,
          },
          params: {
            elapsedTime: 0,
            fireInterval: 1,
          },
          updaters: ['bullet-fire-1', 'satellite-points'],
        },
        {
          name: 'hero-1',
          ctype: 'hero-1',
          position: { sx: -41, sy: 3, sz: -3 },
          phi: (-100 * PI * 2) / 360,
          theta: -0.25,
          ammoType: 'hop-bullet',
          schedule: {
            spawnTime: 5,
          },
          params: {
            elapsedTime: 0,
            fireInterval: 1,
          },
          updaters: ['bullet-fire-1', 'satellite-points'],
        },
      ],
      obstacles: [
        {
          name: 'round-stone',
          position: { sx: -26, sy: 4, sz: 0 },
          tweeners: [{ name: 'rolling-stone-1', state: States.alive }],
          schedule: {
            spawnTime: 1,
          },
          updaters: ['rolling-stone-1'],
        },
        {
          name: 'round-stone',
          position: { sx: -26, sy: 4, sz: 0 },
          tweeners: [
            { name: 'rolling-stone-1', state: States.alive, args: [5000] },
          ],
          schedule: {
            spawnTime: 5,
          },
          updaters: ['rolling-stone-1'],
        },
        {
          name: 'small-round-stone',
          position: { sx: -26, sy: 4, sz: 0 },
          tweeners: [
            { name: 'rolling-stone-1', state: States.alive, args: [2500] },
          ],
          schedule: {
            spawnTime: 2.5,
          },
          updaters: ['rolling-stone-1'],
        },
        {
          name: 'small-round-stone',
          position: { sx: -26, sy: 4, sz: 0 },
          tweeners: [
            { name: 'rolling-stone-1', state: States.alive, args: [7500] },
          ],
          schedule: {
            spawnTime: 7.5,
          },
          updaters: ['rolling-stone-1'],
        },
      ],
      items: [
        {
          name: 'checkpoint',
          position: { sx: -8, sy: 2, sz: 0 },
          schedule: {
            spawnTime: 5,
          },
          updaters: ['item-ring-1'],
        },
        {
          name: 'checkpoint',
          position: { sx: -31, sy: 2, sz: 1.5 },
          // tweeners: [{ name: 'rolling-stone-1', state: States.alive, args: [7500] }],
          schedule: {
            spawnTime: 5,
          },
          updaters: ['item-ring-1'],
        },
        {
          name: 'checkpoint',
          position: { sx: -40, sy: 2, sz: 1 },
          // tweeners: [{ name: 'rolling-stone-1', args: [7500] }],
          schedule: {
            spawnTime: 5,
          },
          updaters: ['item-ring-1'],
        },
        {
          name: 'weapon-upgrade',
          position: { sx: -35, sy: -2, sz: -5 },
          // tweeners: [{ name: 'rolling-stone-1', args: [7500] }],
          schedule: {
            spawnTime: 5,
          },
          updaters: ['item-ring-1'],
        },
      ],
      components: [
        {
          grid: {
            widthSegments: 28,
            heightSegments: 12,
            depthSegments: 8,
            position: { sx: 2, sy: -4.25, sz: 0.25 },
          },
          maze: {
            widthSegments: 24,
            heightSegments: 5,
            depthSegments: 4,
          },
          offset: { sx: 0, sy: 2.5, sz: 0 },
        },
        {
          /* arrow: {
            direction: new Vector3(-1, 0, 0),
            position: new Vector3(400, 200, 0),
            length: 200,
            color: 0xffffff,
          }, */
        },
        {
          offset: { sx: -19.5, sy: -1, sz: 0 },
          grid: {
            widthSegments: 20,
            heightSegments: 10,
            depthSegments: 8,
            position: { sx: -2.5, sy: 0.25, sz: 0.25 },
          },
          /* arrow: {
            direction: new Vector3(0, -1, 0),
            position: new Vector3(-960, 300, 0),
            length: 200,
            color: 0xffffff,
          }, */
          ground: [
            {
              widthSegments: 20,
              depthSegments: 5,
              bumpHeight: 2,
              position: { sx: 0, sy: 0, sz: 0 },
              rotation: { x: 0, y: 0, z: -0.2 },
            },
            {
              widthSegments: 20,
              depthSegments: 8,
              bumpHeight: 4,
              position: { sx: 0, sy: 0, sz: 2.1 },
              rotation: { x: -1.4, y: 1, z: -1 },
            },
            {
              widthSegments: 20,
              depthSegments: 8,
              bumpHeight: 4,
              position: { sx: 0, sy: 0, sz: -2.1 },
              rotation: { x: 1.4, y: -1, z: -1 },
            },
          ],
        },
        {
          offset: { sx: -31, sy: 0, sz: 2 },
          grid: {
            widthSegments: 24,
            heightSegments: 10,
            depthSegments: 12,
            position: { sx: -13, sy: 0.25, sz: -3.25 },
          },
          cylinder: [
            {
              radiusTop: 80,
              radiusBottom: 80,
              height: 10,
              radialSegments: 9,
              heightSegments: 1,
              position: { sx: 0, sy: 0.5, sz: -0.5 },
            },
            {
              radiusTop: 40,
              radiusBottom: 40,
              height: 10,
              radialSegments: 7,
              heightSegments: 1,
              position: { sx: -2, sy: 0.4, sz: -1.5 },
            },
            {
              radiusTop: 80,
              radiusBottom: 80,
              height: 10,
              radialSegments: 9,
              heightSegments: 1,
              position: { sx: -3.5, sy: 0, sz: -3.8 },
            },
            {
              radiusTop: 80,
              radiusBottom: 80,
              height: 10,
              radialSegments: 9,
              heightSegments: 1,
              position: { sx: -4, sy: -4, sz: -7 },
            },
            {
              radiusTop: 40,
              radiusBottom: 40,
              height: 10,
              radialSegments: 7,
              heightSegments: 1,
              position: { sx: -10, sy: 1.5, sz: -5 },
            },
            {
              radiusTop: 40,
              radiusBottom: 40,
              height: 10,
              radialSegments: 7,
              heightSegments: 1,
              position: { sx: -7, sy: 0.5, sz: 3 },
            },
            {
              radiusTop: 40,
              radiusBottom: 40,
              height: 10,
              radialSegments: 7,
              heightSegments: 1,
              position: { sx: -4.8, sy: 0.3, sz: -2 },
            },
            {
              radiusTop: 40,
              radiusBottom: 40,
              height: 10,
              radialSegments: 7,
              heightSegments: 1,
              position: { sx: -6.5, sy: 0.6, sz: -1 },
            },
            {
              radiusTop: 100,
              radiusBottom: 100,
              height: 10,
              radialSegments: 10,
              heightSegments: 1,
              position: { sx: -9, sy: 0.62, sz: -1 },
            },
            {
              radiusTop: 100,
              radiusBottom: 100,
              height: 10,
              radialSegments: 10,
              heightSegments: 1,
              position: { sx: -22, sy: 2, sz: -1 },
            },
          ],
          ground: {
            widthSegments: 10,
            depthSegments: 1,
            bumpHeight: 0,
            position: { sx: -15, sy: 1.5, sz: -1 },
            rotation: { x: 0, y: 0, z: -0.2 },
          },
        },
      ],
    },
  ],
];
