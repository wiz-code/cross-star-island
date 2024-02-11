import { Vector3 } from 'three';

const { PI } = Math;

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
      size: 80,
      detail: 1,
      weight: 10,

      color: 0x203b33,
      wireframeColor: 0x4c625b,
      pointsColor: 0xf4e511,
      rotateSpeed: 2,

      update(deltaTime) {
        //
      },
    },
  ],
];

export const Compositions = [
  [
    'stage',
    ['firstStage'],
  ]
];

export const Ammo = [
  [
    'small-rounded',
    {
      color: 0xffe870,
      wireColor: 0xfffbe6,
      pointColor: 0xf45c41,
      pointSize: 10,

      radius: 7,
      detail: 0,
      numAmmo: 5, // dev 5, prod 50
      speed: 1600,
      rotateSpeed: 8,
      weight: 1,
      fireInterval: 500,
      accuracy: 1, //////

      update(deltaTime) {
        this.object.rotation.z -= deltaTime * this.rotateSpeed;
        this.object.position.copy(this.collider.center);
      },
    },
  ],
];

export const Characters = [
  [
    'hero1',
    {
      height: 40,
      radius: 5,
      weight: 100,

      speed: 3,
      turnSpeed: PI * 2 * (1 / 6), // 1秒間に1/6周する
      sprint: 2.5,
      urgencyMove: 8,

      // 1秒間に5/4周する設定にしたいが、緊急行動解除後のスタン中に起こるスライド量が回転角度を狂わせてしまうため、スライド中の角度量を加味する必要がある
      urgencyTurn: PI * 2 * (15.5 / 16), // PI * 2 * (13.8 / 16),
      airSpeed: 3,
      jumpPower: 2,

      defaultAmmo: 'small-rounded',
      ammoTypes: ['small-rounded'],
    },
  ],
];

export const Stages = [
  [
    'firstStage',
    {
      checkPoints: [
        {
          position: new Vector3(650, 5000, 0),
          direction: PI / 2,
        },
      ],
      components: [
        {
          grid: [24, 6, 8, 80, 80, 80, { grid: { x: 0, y: -0.2, z: 0 } }],
          ground: [
            20,
            6,
            80,
            80,
            0,
            { grid: { x: 0, y: 0, z: 0, spacing: 80 } },
            { x: 0, y: 0, z: 0 },
          ],
          arrow: {
            direction: new Vector3(-1, 0, 0),
            position: new Vector3(400, 200, 0),
            length: 200,
            color: 0xffffff,
          },
        },
        {
          ground: [
            20,
            6,
            80,
            80,
            0,
            { grid: { x: 0, y: 1.9, z: 2.1, spacing: 80 } },
            { x: -PI / 2, y: 0, z: 0 },
          ],
        },
        {
          ground: [
            20,
            8,
            80,
            80,
            0,
            { grid: { x: 0, y: 5.5, z: 0, spacing: 80 } },
            { x: -PI, y: 0, z: 0 },
          ],
        },
        {
          ground: [
            20,
            6,
            80,
            80,
            0,
            { grid: { x: 0, y: 1.9, z: -2.1, spacing: 80 } },
            { x: PI / 2, y: 0, z: 0 },
          ],
        },
        {
          arrow: {
            direction: new Vector3(0, -1, 0),
            position: new Vector3(-960, 300, 0),
            length: 200,
            color: 0xffffff,
          },
          ground: [
            20,
            5,
            80,
            80,
            2,
            { grid: { x: -19.5, y: -1, z: 0, spacing: 80 } },
            { x: 0, y: 0, z: -0.2 },
          ],
        },
        {
          ground: [
            20,
            8,
            80,
            80,
            4,
            { grid: { x: -19.5, y: -2, z: 2.1, spacing: 80 } },
            { x: -1.4, y: 0, z: 0 },
          ],
        },
        {
          ground: [
            20,
            8,
            80,
            80,
            4,
            { grid: { x: -19.5, y: -2, z: -2.1, spacing: 80 } },
            { x: 1.4, y: 0, z: 0 },
          ],
        },
      ],
    },
  ],
];
