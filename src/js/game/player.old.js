import { Vector3, Spherical, Euler } from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';

import { Keys, Actions, States } from './data';
import Publisher from './publisher';
import {
  Stages,
  World,
  PlayerSettings,
  Controls,
  AmmoSettings,
} from './settings';

const { exp, sqrt, cos, PI } = Math;

const RAD_30 = (30 / 360) * PI * 2;
const COS_30 = cos(RAD_30);
const dampingCoef = PI / 180;
const minRotateAngle = PI / 720;
const minMovement = 0.01;

const addDamping = (component, damping, minValue) => {
  let value = component;

  if (value >= 0) {
    value += damping;

    if (value < minValue) {
      value = 0;
    }
  } else {
    value -= damping;

    if (value >= -minValue) {
      value = 0;
    }
  }

  return value;
};

class Player extends Publisher {
  #dir = new Vector3(0, 0, -1);

  #side = new Vector3();

  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  #euler = new Euler(0, 0, 0, 'YXZ');

  #yawAxis = new Vector3(0, 1, 0);

  #pitchAxis = new Vector3(1, 0, 0);

  #onGround = false;

  #actions = new Set();

  #states = new Set();

  #urgencyRemainingTime = 0;

  #stunningRemainingTime = 0;

  constructor(camera, ammo, object, worldOctree) {
    super();

    this.camera = camera;
    this.worldOctree = worldOctree;

    this.ammo = ammo;
    this.object = object;

    this.position = new Vector3(); // 位置情報の保持はcolliderが実質兼ねているので現状不使用
    this.forwardComponent = 0;
    this.sideComponent = 0;
    this.rotateComponent = 0;
    this.povRotation = new Spherical();
    this.rotation = new Spherical(); // phi and theta
    this.velocity = new Vector3();

    // this.rotation.phi = PlayerSettings.direction;
    // this.camera.rotation.y = PlayerSettings.direction;

    this.direction = new Vector3();
    // this.camera.getWorldDirection(this.direction);

    // this.fire = this.fire.bind(this);
    this.collideWith = this.collideWith.bind(this);
    this.ammo.subscribe('collideWith', this.collideWith);
    this.object.subscribe('collideWith', this.collideWith);

    this.collider = new Capsule();
  }

  init(name) {
    const { player } = Stages[name];

    this.rotation.phi = player.direction;
    this.camera.rotation.y = player.direction;
    this.camera.rotation.x = -RAD_30;
    this.camera.getWorldDirection(this.direction);

    const start = player.position.clone();
    const end = start.clone();
    end.y += PlayerSettings.height + PlayerSettings.radius;
    this.collider.set(start, end, PlayerSettings.radius);
  }

  getRotateDiff() {
    if (
      this.#actions.has(Actions.rotateLeft) ||
      this.#actions.has(Actions.rotateRight)
    ) {
      return this.rotateComponent;
    }

    return 0;
  }

  jump() {
    this.velocity.y = PlayerSettings.jumpPower;
  }

  moveForward(deltaTime, state = States.idle) {
    this.forwardComponent = deltaTime;

    if (this.#onGround) {
      this.forwardComponent *= PlayerSettings.speed;

      if (state === States.sprint && deltaTime >= 0) {
        this.forwardComponent *= PlayerSettings.sprint;
      } else if (state === States.urgency) {
        this.forwardComponent *= PlayerSettings.urgencyMove;
      }
    } else {
      this.forwardComponent *= PlayerSettings.airSpeed;
    }
  }

  rotate(deltaTime, state = States.idle) {
    this.rotateComponent = deltaTime;

    if (state === States.urgency) {
      this.rotateComponent *= PlayerSettings.urgencyTurn;
    } else {
      this.rotateComponent *= PlayerSettings.turnSpeed;
    }
  }

  moveSide(deltaTime, state = States.idle) {
    this.sideComponent = deltaTime * 0.7;

    if (this.#onGround) {
      this.sideComponent *= PlayerSettings.speed;

      if (state === States.urgency) {
        this.sideComponent *= PlayerSettings.urgencyMove;
      }
    } else {
      this.sideComponent *= PlayerSettings.airSpeed;
    }
  }

  setPovRotation(povRotation) {
    this.povRotation = povRotation.clone();
  }

  fire() {
    const ammo = this.ammo.list[this.ammo.index];
    this.#euler.x = this.povRotation.theta + this.rotation.theta;
    this.#euler.y = this.povRotation.phi + this.rotation.phi;
    const dir = this.#dir.clone().applyEuler(this.#euler);
    ammo.mesh.rotation.copy(this.#euler);

    ammo.collider.center
      .copy(this.collider.end)
      .addScaledVector(dir, this.collider.radius * 1.5);

    ammo.velocity.copy(dir).multiplyScalar(AmmoSettings.speed);
    ammo.velocity.addScaledVector(this.velocity, 2);

    this.ammo.index = (this.ammo.index + 1) % this.ammo.list.length;
  }

  collideWith(object) {
    const center = this.collider.getCenter(this.#vecA);
    const objectCenter = object.collider.center;
    const weightRatio = object.weight / PlayerSettings.weight;

    const r = this.collider.radius + object.collider.radius;
    const r2 = r * r;

    const colliders = [this.collider.start, this.collider.end, center];

    for (let i = 0, l = colliders.length; i < l; i += 1) {
      const point = colliders[i];
      const d2 = point.distanceToSquared(objectCenter);

      if (d2 < r2) {
        const normal = this.#vecA.subVectors(point, objectCenter).normalize();
        const v1 = this.#vecB
          .copy(normal)
          .multiplyScalar(normal.dot(this.velocity));
        const v2 = this.#vecC
          .copy(normal)
          .multiplyScalar(normal.dot(object.velocity) * weightRatio);

        this.velocity.add(v2).sub(v1);
        object.velocity.add(v1).sub(v2);

        const d = (r - sqrt(d2)) / 2;
        objectCenter.addScaledVector(normal, -d);
      }
    }
  }

  collisions() {
    const result = this.worldOctree.capsuleIntersect(this.collider);
    this.#onGround = false;

    if (result) {
      const onGround = result.normal.y > COS_30;
      this.#onGround = onGround;

      if (!this.#onGround) {
        this.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.velocity),
        );
      }

      this.collider.translate(result.normal.multiplyScalar(result.depth));
    }
  }

  input(keys, lastKey, mashed) {
    // 入力操作の処理

    // update()で一度だけアクションを発動する
    // 緊急行動中はonGroundがfalseでもジャンプ可にする
    if (keys.has(Keys.Space) && this.#onGround) {
      this.#actions.add(Actions.jump);
    }

    // Cキー押し下げ時、追加で対応のキーを押していると緊急回避状態へ移行
    // ジャンプ中は緊急行動のコマンド受け付けは停止
    if (mashed) {
      if (!this.#onGround) {
        return;
      }

      this.#states.add(States.urgency);
    }

    // 緊急回避中は一部アクションを制限、スタン中はすべてのアクションを更新しない
    if (this.#states.has(States.urgency)) {
      if (Keys[lastKey] === Keys.KeyW) {
        this.#actions.add(Actions.quickMoveForward);
      } else if (Keys[lastKey] === Keys.KeyA) {
        this.#actions.add(Actions.quickTurnLeft);
      } else if (Keys[lastKey] === Keys.KeyS) {
        this.#actions.add(Actions.quickMoveBackward);
      } else if (Keys[lastKey] === Keys.KeyD) {
        this.#actions.add(Actions.quickTurnRight);
      } else if (Keys[lastKey] === Keys.KeyQ) {
        this.#actions.add(Actions.quickMoveLeft);
      } else if (Keys[lastKey] === Keys.KeyE) {
        this.#actions.add(Actions.quickMoveRight);
      }

      return;
    }
    if (this.#states.has(States.stunning)) {
      return;
    }

    if (keys.has(Keys.shift)) {
      this.#states.add(States.sprint);
    } else {
      this.#states.delete(States.sprint);
    }

    // 前進と後退
    if (keys.has(Keys.KeyW) && !keys.has(Keys.KeyS)) {
      this.#actions.add(Actions.moveForward);
    } else if (keys.has(Keys.KeyS) && !keys.has(Keys.KeyW)) {
      this.#actions.add(Actions.moveBackward);
    }

    if (!keys.has(Keys.KeyW)) {
      this.#actions.delete(Actions.moveForward);
    }

    if (!keys.has(Keys.KeyS)) {
      this.#actions.delete(Actions.moveBackward);
    }

    // 左右回転
    if (keys.has(Keys.KeyA) && !keys.has(Keys.KeyD)) {
      this.#actions.add(Actions.rotateLeft);
    } else if (keys.has(Keys.KeyD) && !keys.has(Keys.KeyA)) {
      this.#actions.add(Actions.rotateRight);
    }

    if (!keys.has(Keys.KeyA)) {
      this.#actions.delete(Actions.rotateLeft);
    }

    if (!keys.has(Keys.KeyD)) {
      this.#actions.delete(Actions.rotateRight);
    }

    // 左右平行移動
    if (keys.has(Keys.KeyQ) && !keys.has(Keys.KeyE)) {
      this.#actions.add(Actions.moveLeft);
    } else if (keys.has(Keys.KeyE) && !keys.has(Keys.KeyQ)) {
      this.#actions.add(Actions.moveRight);
    }

    if (!keys.has(Keys.KeyQ)) {
      this.#actions.delete(Actions.moveLeft);
    }

    if (!keys.has(Keys.KeyE)) {
      this.#actions.delete(Actions.moveRight);
    }
  }

  update(deltaTime) {
    // 自機の動き制御
    if (this.#stunningRemainingTime > 0) {
      this.#stunningRemainingTime -= deltaTime;

      if (this.#stunningRemainingTime <= 0) {
        this.#states.delete(States.stunning);
        this.#stunningRemainingTime = 0;
      }
    } else if (
      this.#states.has(States.urgency) &&
      this.#urgencyRemainingTime === 0 &&
      this.#onGround
    ) {
      this.#urgencyRemainingTime = Controls.urgencyDuration;
    }

    if (this.#actions.has(Actions.jump)) {
      this.#actions.delete(Actions.jump);
      this.jump();
    }

    if (this.#urgencyRemainingTime > 0) {
      this.#urgencyRemainingTime -= deltaTime;

      if (this.#urgencyRemainingTime <= 0) {
        this.#actions.clear();
        this.#states.delete(States.urgency);
        this.#states.add(States.stunning);
        this.#urgencyRemainingTime = 0;
        this.#stunningRemainingTime = Controls.stunningDuration;
      }

      if (this.#actions.has(Actions.quickMoveForward)) {
        this.moveForward(deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveBackward)) {
        this.moveForward(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickTurnLeft)) {
        this.rotate(deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickTurnRight)) {
        this.rotate(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveLeft)) {
        this.moveSide(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveRight)) {
        this.moveSide(deltaTime, States.urgency);
      }
    } else {
      if (this.#actions.has(Actions.rotateLeft)) {
        this.rotate(deltaTime);
      } else if (this.#actions.has(Actions.rotateRight)) {
        this.rotate(-deltaTime);
      }

      if (this.#actions.has(Actions.moveForward)) {
        if (this.#states.has(States.sprint)) {
          this.moveForward(deltaTime, States.sprint);
        } else {
          this.moveForward(deltaTime);
        }
      } else if (this.#actions.has(Actions.moveBackward)) {
        this.moveForward(-deltaTime);
      }

      if (this.#actions.has(Actions.moveLeft)) {
        this.moveSide(-deltaTime);
      } else if (this.#actions.has(Actions.moveRight)) {
        this.moveSide(deltaTime);
      }
    }

    // 移動の減衰処理
    const resistance = this.#onGround ? World.resistance : World.airResistance;
    const damping = exp(-resistance * deltaTime) - 1;

    if (!this.#onGround) {
      this.velocity.y -= World.gravity * deltaTime;
    }

    if (this.rotateComponent !== 0) {
      this.direction.applyAxisAngle(this.#yawAxis, this.rotateComponent);
      this.direction.normalize();

      this.rotation.phi += this.rotateComponent;
      this.publish('onChangeRotateComponent', this.rotateComponent);

      this.rotateComponent = addDamping(
        this.rotateComponent,
        dampingCoef * damping,
        minRotateAngle,
      );
    }

    if (this.forwardComponent !== 0) {
      const direction = this.direction
        .clone()
        .multiplyScalar(this.forwardComponent);
      this.velocity.add(direction);

      this.forwardComponent = addDamping(
        this.forwardComponent,
        damping,
        minMovement,
      );
    }

    if (this.sideComponent !== 0) {
      const direction = this.#side.crossVectors(this.direction, this.#yawAxis);
      direction.normalize();
      this.velocity.add(direction.multiplyScalar(this.sideComponent));

      this.sideComponent = addDamping(this.sideComponent, damping, minMovement);
    }

    this.velocity.addScaledVector(this.velocity, damping);

    this.camera.rotation.x = this.povRotation.theta;
    this.camera.rotation.y = this.povRotation.phi + this.rotation.phi;

    this.collider.translate(this.velocity);
    this.camera.position.copy(this.collider.end);
    this.collisions();
  }
}

export default Player;
