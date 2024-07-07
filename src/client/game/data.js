import { Vector3 } from 'three';

const { sin, PI } = Math;

const easeInQuad = (x) => x * x;

const easeOutCubic = (x) => 1 - (1 - x) * (1 - x) * (1 - x);

export const Keys = {
  // event.codeで取得する
  KeyW: 0,
  ArrowUp: 0,
  KeyS: 1,
  ArrowDown: 1,

  KeyA: 2,
  ArrowLeft: 2,
  KeyD: 3,
  ArrowRight: 3,

  KeyQ: 4,
  KeyE: 5,

  KeyR: 6,
  KeyF: 7,
  KeyZ: 8,
  KeyX: 9,
  KeyC: 10,

  Space: 20,

  // event.shiftKeyなどの真偽値で取得
  Shift: 30,
  Alt: 40,
};

export const Pointers = {
  left: 0,
  center: 1,
  right: 2,
};

export const Actions = {
  moveForward: 0,
  moveBackward: 1,
  rotateLeft: 2,
  rotateRight: 3,
  moveLeft: 4,
  moveRight: 5,


  jump: 10,
  trigger: 11,

  splint: 20,

  quickMoveForward: 30,
  quickMoveBackward: 31,
  quickTurnLeft: 32,
  quickTurnRight: 33,
  quickMoveLeft: 34,
  quickMoveRight: 35,

};

export const States = {
  alive: 0,
  sprint: 1,
  urgency: 2,
  stunning: 3,
};

export const GameStates = [
  ['stageName', ''],
  ['checkpointIndex', 0],
  ['gamepad', false],
  ['mode', 'loading'], // 'loading', 'play', 'clear'
  // score state
  ['time', 0],
  ['falls', 0],
  ['hits', 0],
  ['push-away', 0],
  ['no-checkpoint', 0],
];

export const GameMethods = [
  [
    'getStageData',
    function (stageName) {
      if (this.data.stages.has(stageName)) {
        return this.data.stages.get(stageName);
      }

      return null;
    },
  ],
  [
    'play-sound',
    function (key, options) {
      this.soundManager.playSound(key, options);
    },
  ],
  [
    'clear',
    function (time, falls, hits, pushAway, noCheckpoint, punishment) {
      this.setMode('clear');
      this.stop();

      const score = this.scoreManager.calcScore(time, falls, hits, pushAway, noCheckpoint, punishment);
      this.callbacks.setScore(score);
    },
  ],
];

export const Obstacles = [
  [
    'round-stone',
    {
      radius: 18,
      detail: 1,
      pointsDetail: 1,
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
      radius: 10,
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

export const Compositions = [
  ['stage', ['firstStage']],
  ['player', { name: 'player-1', ctype: 'hero-1' }],
];

export const Guns = [
  [
    'normal-gun',
    {
      speed: 600, //2000
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

      radius: 1.5, //6
      detail: 1,
      numAmmo: 100,

      weight: 0.08,
      lifetime: 3,

      rotateSpeed: 10,

      updaters: [
        {
          state: States.alive,
          update(game, target, deltaTime) {
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

      radius: 1.5, //6
      detail: 1,
      numAmmo: 50,

      weight: 0.08,
      lifetime: 3,

      rotateSpeed: 10,

      hopValue: 120, //350
      hopDuration: 0.5,

      updaters: [
        {
          state: States.alive,
          update(game, target, deltaTime) {
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

      height: 4,//20
      radius: 2,//10
      weight: 1,//

      speed: 120, // 300,
      rotateSpeed: 2,

      // turnSpeed: PI * 2 * (1 / 6), // 1秒間に1/6周する
      turnSpeed: PI * 2 * (1 / 3), // 1秒間に1/3周する
      sprint: 2.5,
      urgencyMove: 8,

      airSpeed: 50, // 100
      jumpPower: 120, // 350

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
      modelSize: 4.5,//27.5
      offsetY: 3,//20
      rotateSpeed: 2,

      height: 4, //20
      radius: 2, //10
      weight: 1,

      speed: 150, // 300,
      turnSpeed: PI * 2 * (1 / 6), // 1秒間に1/6周する
      sprint: 2.5,
      urgencyMove: 8,

      airSpeed: 40, //100,
      jumpPower: 150, //350,

      gunTypes: ['normal-gun'],
    },
  ],
];

export const Sounds = [
  ['shot', 'shot.mp3'],
  ['damage', 'damage-1.mp3'],
  ['jump', 'cursor-move-3.mp3'],
  ['get-item', 'decision-11.mp3'],
  ['dash', 'evasion.mp3'],
  ['girl-voice-1', 'sugoi.mp3'],
  ['goal', 'kirakira-1.mp3'],
  ['fast-move', 'fast-move.mp3'],
];

export const Items = [
  [
    'checkpoint',
    {
      method: 'createRing',

      radius: 5,//20
      tube: 0.8,//3
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

      radius: 5,//20
      tube: 0.8, //3
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
  [
    'hyper-dash',
    {
      method: 'createTetra',

      radius: 5,

      color: 0x7fffd4,
      wireColor: 0xa9a9a9,
      pointColor: 0xffc0cb,

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
          position: { sx: 0.1, sy: 1.5, sz: -10 },
          phi: PI,
        },
        {
          position: { sx: 0.1, sy: 5, sz: -10 },
          phi: PI,
        },
        {
          position: { sx: 0.1, sy: 3, sz: 0 },
          phi: PI,
        },
        // 最終チェックポイント
        {
          //position: { sx: 12.5, sy: 3, sz: 0 },
          position: { sx: 0.1, sy: 5, sz: 0 },
          phi: PI / 2,
        },
      ],
      characters: [
        {
          name: 'girl-1',
          ctype: 'heroine-1',
          pose: 'pose-1',
          params: {
            position: { sx: -13, sy: -0.4, sz: 0 },
            phi: -PI * 0.5,
            section: 3,
          },
          schedule: {
            spawnTime: 1,
          },
          updaters: [{ name: 'satellite-points', state: States.alive }],
        },
        {
          name: 'enemy-1',
          ctype: 'hero-1',
          ammoType: 'small-bullet',
          tweeners: [{ name: 'avoidance-1', state: States.alive }],
          schedule: {
            spawnTime: 10,
          },
          params: {
            position: { sx: -22, sy: 3, sz: 4.2 },
            phi: -PI / 2,
            theta: -0.1,
            section: 2,
            elapsedTime: 0,
            fireInterval: 0.4,
          },
          updaters: [
            { name: 'bullet-fire-1', state: States.alive },
            { name: 'satellite-points', state: States.alive },
          ],
        },
        {
          name: 'enemy-2',
          ctype: 'hero-1',
          ammoType: 'small-bullet',
          tweeners: [{ name: 'avoidance-1', state: States.alive }],
          schedule: {
            spawnTime: 12.5,
          },
          params: {
            position: { sx: -24, sy: 3, sz: 4.2 },
            phi: (82 * -PI) / 180,
            theta: -0.1,
            section: 2,
            elapsedTime: 0,
            fireInterval: 0.8,
          },
          updaters: [
            { name: 'bullet-fire-1', state: States.alive },
            { name: 'satellite-points', state: States.alive },
          ],
        },
        {
          name: 'enemy-3',
          ctype: 'hero-1',
          ammoType: 'small-bullet',
          tweeners: [{ name: 'avoidance-1', state: States.alive }],
          schedule: {
            spawnTime: 15,
          },
          params: {
            position: { sx: -26, sy: 3, sz: 4.2 },
            phi: (98 * -PI) / 180,
            theta: -0.1,
            section: 2,
            elapsedTime: 0,
            fireInterval: 0.8,
          },
          updaters: [
            { name: 'bullet-fire-1', state: States.alive },
            { name: 'satellite-points', state: States.alive },
          ],
        },
        {
          name: 'enemy-4',
          ctype: 'hero-1',
          ammoType: 'hop-bullet',
          schedule: {
            spawnTime: 5,
          },
          params: {
            position: { sx: 5.9, sy: 2.5, sz: 7 },
            phi: (60 * PI * 2) / 360,
            theta: (-8 * PI * 2) / 360,
            section: 2,
            elapsedTime: 0,
            fireInterval: 1,
          },
          tweeners: [
            {
              name: 'avoidance-2',
              state: States.alive,
              args: [5000, 'z-axis', 10, 2000],
            },
          ],
          updaters: [
            { name: 'bullet-fire-1', state: States.alive },
            { name: 'satellite-points', state: States.alive },
          ],
        },
        {
          name: 'enemy-5',
          ctype: 'hero-1',
          ammoType: 'hop-bullet',
          schedule: {
            spawnTime: 5,
          },
          tweeners: [
            {
              name: 'avoidance-2',
              state: States.alive,
              args: [5000, 'x-axis', 10, 2000],
            },
          ],
          params: {
            position: { sx: -10, sy: 3, sz: 13.9 },
            phi: (-6 * PI * 2) / 360,
            theta: (-12 * PI * 2) / 360,
            section: 2,
            elapsedTime: 0,
            fireInterval: 1,
          },
          updaters: [
            { name: 'bullet-fire-1', state: States.alive },
            { name: 'satellite-points', state: States.alive },
          ],
        },
      ],
      obstacles: [
        {
          name: 'round-stone',
          tweeners: [{ name: 'rolling-stone-1', state: States.alive }],
          params: {
            position: { sx: 0, sy: 5, sz: 6 },
            section: 1,
          },
          schedule: {
            spawnTime: 0,
          },
          updaters: [{ name: 'rolling-stone-1', state: States.alive }],
        },
        {
          name: 'round-stone',
          tweeners: [
            { name: 'rolling-stone-1', state: States.alive, args: [4000] },
          ],
          params: {
            position: { sx: 0, sy: 5, sz: 6 },
            section: 1,
          },
          schedule: {
            spawnTime: 4,
          },
          updaters: [{ name: 'rolling-stone-1', state: States.alive }],
        },
        {
          name: 'small-round-stone',
          tweeners: [
            { name: 'rolling-stone-1', state: States.alive, args: [2000] },
          ],
          params: {
            position: { sx: 0, sy: 4, sz: 6 },
            section: 1,
          },
          schedule: {
            spawnTime: 2,
          },
          updaters: [{ name: 'rolling-stone-1', state: States.alive }],
        },
        {
          name: 'small-round-stone',
          tweeners: [
            { name: 'rolling-stone-1', state: States.alive, args: [6000] },
          ],
          params: {
            position: { sx: 0, sy: 4, sz: 6 },
            section: 1,
          },
          schedule: {
            spawnTime: 6,
          },
          updaters: [{ name: 'rolling-stone-1', state: States.alive }],
        },
      ],
      items: [
        {
          name: 'checkpoint',
          params: {
            position: { sx: 28, sy: 4, sz: 36 },
            section: 0,
          },
          schedule: {
            spawnTime: 5,
          },
          updaters: [{ name: 'item-ring-1', state: States.alive }],
        },
        {
          name: 'checkpoint',
          params: {
            section: 1,
            position: { sx: 1, sy: 4, sz: 11.5 },
          },
          schedule: {
            spawnTime: 10,
          },
          updaters: [{ name: 'item-ring-1', state: States.alive }],
        },
        {
          name: 'checkpoint',
          params: {
            section: 2,
            position: { sx: -16.8, sy: 3, sz: 4.2 },
          },
          schedule: {
            spawnTime: 15,
          },
          updaters: [{ name: 'item-ring-1', state: States.alive }],
        },
        {
          name: 'weapon-upgrade',
          params: {
            section: 2,
            position: { sx: -11, sy: -2, sz: 6 },
          },
          schedule: {
            spawnTime: 5,
          },
          updaters: [{ name: 'item-ring-1', state: States.alive }],
        },
        {
          name: 'hyper-dash',
          consumable: false,
          disableTime: 3,
          params: {
            section: 0,
            position: { sx: 0, sy: 5, sz: -6 },
            phi: 0,
            velocity: new Vector3(0, 1, 35),
          },
          schedule: {
            spawnTime: 1,
          },
          updaters: [{ name: 'item-ring-2', state: States.alive }],
        },
        {
          name: 'hyper-dash',
          consumable: false,
          disableTime: 3,
          params: {
            section: 0,
            position: { sx: 4, sy: 5, sz: 14 },
            phi: PI * 0.5,
            velocity: new Vector3(30, 1, 0),
          },
          schedule: {
            spawnTime: 1,
          },
          updaters: [{ name: 'item-ring-2', state: States.alive }],
        },
        {
          name: 'hyper-dash',
          consumable: false,
          disableTime: 3,
          params: {
            section: 0,
            position: { sx: 28, sy: 5, sz: 18 },
            phi: 0,
            velocity: new Vector3(0, 1, 35),
          },
          schedule: {
            spawnTime: 1,
          },
          updaters: [{ name: 'item-ring-2', state: States.alive }],
        },
      ],
      movables: [
        {
          name: 'moving-platform-1',
          params: {},
          tweeners: [
            { name: 'updown-move', state: States.alive, args: [0, 'y-axis', -60, 5000] },
          ],
        },
        {
          name: 'moving-platform-2',
          params: {},
          tweeners: [
            { name: 'updown-move', state: States.alive, args: [5000, 'z-axis', 10, 2000] },
          ],
        },
        {
          name: 'moving-platform-3',
          params: {},
          tweeners: [
            { name: 'updown-move', state: States.alive, args: [5000, 'x-axis', 10, 2000] },
          ],
        },
      ],
      sections: [
        {
          offset: { sx: 0, sy: 10, sz: 0 },
          grid: [
            {
              widthSegments: 8,
              heightSegments: 12,
              depthSegments: 28,
              rotation: { x: 0, y: 0, z: 0 },
              position: { sx: 0.25, sy: -2.25, sz: -1.75 },
            },
            {
              widthSegments: 4,
              heightSegments: 5,
              depthSegments: 32,
              rotation: { x: 0, y: PI * 0.5, z: 0 },
              position: { sx: 14.25, sy: 0.25, sz: 14.25 },
            },
            {
              widthSegments: 4,
              heightSegments: 5,
              depthSegments: 4,
              rotation: { x: 0, y: 0, z: 0 },
              position: { sx: 28.25, sy: -4.75, sz: 14.25 },
            },
            {
              widthSegments: 4,
              heightSegments: 15,
              depthSegments: 28,
              rotation: { x: 0, y: 0, z: 0 },
              position: { sx: 28.25, sy: -14.75, sz: 26.25 },
            },
          ],
          maze: [
            {
              front: false,
              back: false,
              widthSegments: 4,
              heightSegments: 5,
              depthSegments: 24,
            },
            {
              back: false,
              left: false,
              widthSegments: 4,
              heightSegments: 5,
              depthSegments: 4,
              position: { sx: 0, sy: 0, sz: 14 },
            },
            {
              left: false,
              right: false,
              widthSegments: 24,
              heightSegments: 5,
              depthSegments: 4,
              position: { sx: 14, sy: 0, sz: 14 },
            },
            {
              bottom: false,
              right: false,
              widthSegments: 4,
              heightSegments: 5,
              depthSegments: 4,
              position: { sx: 28, sy: 0, sz: 14 },
            },
            {
              top: false,
              bottom: false,
              widthSegments: 4,
              heightSegments: 5,
              depthSegments: 4,
              position: { sx: 28, sy: -5, sz: 14 },
            },
            {
              top: false,
              front: false,
              widthSegments: 4,
              heightSegments: 5,
              depthSegments: 4,
              position: { sx: 28, sy: -10, sz: 14 },
            },
            {
              front: false,
              back: false,
              widthSegments: 4,
              heightSegments: 5,
              depthSegments: 24,
              position: { sx: 28, sy: -10, sz: 28 },
            },
          ],
        },
        {
          offset: { sx: 28, sy: -4, sz: 48 },
          grid: {
            widthSegments: 8,
            heightSegments: 12,
            depthSegments: 18,
            rotation: { x: 0, y: 0, z: 0 },
            position: { sx: 0.25, sy: -0.25, sz: 1.25 },
          },
          ground: [
            {
              widthSegments: 5,
              depthSegments: 20,
              bumpHeight: 0.45,
              position: { sx: 0, sy: 0, sz: 0 },
              rotation: { x: -0.2, y: 0, z: 0 },
            },
            {
              widthSegments: 7,
              depthSegments: 20,
              bumpHeight: 0.9,
              position: { sx: -2.4, sy: 1, sz: 0 },
              rotation: { x: 0, y: 0, z: -1.4 },
            },
            {
              widthSegments: 7,
              depthSegments: 20,
              bumpHeight: 0.9,
              position: { sx: 2.4, sy: 1, sz: 0 },
              rotation: { x: 0, y: 0, z: 1.4 },
            },
          ],
        },
        {
          offset: { sx: 29, sy: -2.25, sz: 59.5 },
          grid: {
            widthSegments: 20,
            heightSegments: 10,
            depthSegments: 30,
            position: { sx: -6.25, sy: 0, sz: 13.75 },
          },
          cylinder: [
            {
              radiusTop: 22,
              radiusBottom: 18,
              height: 4,
              radialSegments: 12,
              heightSegments: 1,
              position: { sx: 0, sy: 0, sz: 0 },
            },
            {
              radiusTop: 15,
              radiusBottom: 12,
              height: 4,
              radialSegments: 9,
              heightSegments: 1,
              position: { sx: -3, sy: -0.2, sz: 2 },
            },
            {
              radiusTop: 16,
              radiusBottom: 13,
              height: 3,
              radialSegments: 10,
              heightSegments: 1,
              position: { sx: -5, sy: -0.3, sz: 4.8 },
            },
            {
              name: 'moving-platform-1',
              movable: true,

              radiusTop: 18,
              radiusBottom: 14,
              height: 4,
              radialSegments: 11,
              heightSegments: 1,
              position: { sx: -9, sy: -0.4, sz: 4.8 },
            },
            {
              name: 'moving-platform-2',
              movable: true,

              radiusTop: 12,
              radiusBottom: 9,
              height: 3,
              radialSegments: 8,
              heightSegments: 1,
              position: { sx: 6, sy: 1.2, sz: 7 },
            },
            {
              name: 'moving-platform-3',
              movable: true,

              radiusTop: 12,
              radiusBottom: 9,
              height: 3,
              radialSegments: 8,
              heightSegments: 1,
              position: { sx: -10, sy: 1.3, sz: 14 },
            },
            {
              radiusTop: 10,
              radiusBottom: 8,
              height: 3,
              radialSegments: 7,
              heightSegments: 1,
              position: { sx: -11, sy: -4, sz: 6 },
            },
            {
              radiusTop: 15,
              radiusBottom: 12,
              height: 4,
              radialSegments: 7,
              heightSegments: 1,
              position: { sx: -12.3, sy: -0.2, sz: 4.8 },
            },
          ],
        },
        {
          offset: { sx: 12.5, sy: 0, sz: 63.5 },
          grid: {
            widthSegments: 20,
            heightSegments: 10,
            depthSegments: 10,
            position: { sx: -9.75, sy: -2.25, sz: -0.25 },
          },
          ground: {
            widthSegments: 10,
            depthSegments: 1,
            bumpHeight: 0,
            position: { sx: -6.5, sy: -1, sz: 0 },
            rotation: { x: 0, y: 0, z: -0.2 },
          },
          cylinder: [
            {
              radiusTop: 30,
              radiusBottom: 27,
              height: 4,
              radialSegments: 14,
              heightSegments: 1,
              position: { sx: 0, sy: -2, sz: 0 },
            },
            {
              radiusTop: 20,
              radiusBottom: 17,
              height: 4,
              radialSegments: 15,
              heightSegments: 1,
              position: { sx: -13, sy: -0.4, sz: 0 },
            },
          ],
        },
      ],
    },
  ],
];
