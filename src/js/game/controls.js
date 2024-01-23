import { MathUtils, Spherical, Vector3, Euler, Quaternion, Color } from 'three';

import { Camera, World, Controls, Screen } from './settings';
import { Keys, Pointers, Actions, States } from './data';
import Publisher from './publisher';
import { createSight, createPovIndicator } from './screen';

const { radToDeg, degToRad, clamp, mapLinear } = MathUtils;
const { abs, sign, floor, max, min, exp, PI } = Math;
const halfPI = PI / 2;
const quarterPI = PI / 4;
const degToRadCoef = PI / 180;

const InputDuration = 100; // 200

const lerp = (x, y, p) => x + (y - x) * p;

const sightColor = {
  front: new Color(Screen.normalColor),
  pov: new Color(Screen.sightPovColor),
};
const indicatorColor = {
  normal: new Color(Screen.normalColor),
  beyondFov: new Color(Screen.warnColor),
};

const ActionKeys = new Set([
  'KeyW',
  'ArrowUp',

  'KeyA',
  'ArrowLeft',

  'KeyS',
  'ArrowDown',

  'KeyD',
  'ArrowRigh',

  'KeyQ',
  'KeyE',

  'KeyR',
  'KeyF',
  'KeyZ',
  'KeyX',
  'KeyC',
]);

class FirstPersonControls extends Publisher {
  #vectorA = new Vector3(); /// //

  #vectorB = new Vector3(); /// /////

  #virticalVector = new Vector3(0, 1, 0); /// ///////

  #contextmenu(event) {
    event.preventDefault();
  }

  #keys = new Set();

  #pointers = new Set();

  #actions = new Set();

  #states = new Set();

  #count = 0;

  #lastKey = '';

  #keyDownTime = 0;

  #keyUpTime = 0;

  #mashed = false;

  constructor(screen, camera, player, domElement) {
    super();

    this.screen = screen;
    this.camera = camera;
    this.player = player;
    this.domElement = domElement;

    this.povSight = createSight();
    this.screen.add(this.povSight);

    this.povIndicator = createPovIndicator();
    this.screen.add(this.povIndicator);

    // API
    this.enabled = true;

    this.activeLook = true;
    this.povLock = false;

    this.minPolarAngle = {
      virtical: 0,
      horizontal: 0,
    };
    this.maxPolarAngle = {
      virtical: PI,
      horizontal: PI * 2,
    };

    // internals
    this.velocity = new Vector3(); /// ///////
    this.direction = new Vector3(); /// //////
    this.rotation = new Euler(0, 0, 0, 'YXZ'); /// /////
    this.rotY = 0;
    this.onGround = false; /// ////////

    this.povCoords = new Spherical();

    this.timeout = false;
    this.moved = false;
    this.st = 0;
    this.dx = 0;
    this.dy = 0;

    this.urgencyRemainingTime = 0;
    this.stunningRemainingTime = 0;

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    this.domElement.addEventListener('contextmenu', this.#contextmenu);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerup', this.onPointerUp);

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    this.handleResize();
    this.setOrientation();
  }

  setOrientation() {
    const { rotation } = this.camera;
    // this.rotation.copy(rotation);
    this.povCoords.phi = rotation.y;
    this.povCoords.theta = rotation.x;
    this.camera.getWorldDirection(this.direction);
  }

  handleResize() {
    this.viewHalfX = this.domElement.offsetWidth / 2;
    this.viewHalfY = this.domElement.offsetHeight / 2;

    this.povIndicator.position.setY(-this.viewHalfY + Screen.sightPovSize / 2);
  }

  lookAt(x, y, z) {
    if (x.isVector3) {
      this.#vectorA.copy(x);
    } else {
      this.#vectorA.set(x, y, z);
    }

    this.camera.lookAt(this.#vectorA);
    this.setOrientation();

    return this;
  }

  async lock() {
    if (this.domElement.ownerDocument.pointerLockElement == null) {
      await this.domElement.requestPointerLock();
    }
  }

  unlock() {
    this.domElement.ownerDocument.exitPointerLock();
  }

  dispatchAction(button) {
    if (button === 0) {
      this.player.fire();
    }

    if (button === 2) {
      this.povLock = true;
    }
  }

  onPointerMove(event) {
    if (this.#pointers.has(Pointers.right)) {
      if (event.button === Pointers.left) {
        if (this.#count % 2 === 0) {
          this.dispatchAction(event.button);
        }

        this.#count += 1;
      }
    }

    this.moved = true;
    this.dx = max(
      -Controls.pointerMaxMove,
      min(event.movementX, Controls.pointerMaxMove),
    );
    this.dy = max(
      -Controls.pointerMaxMove,
      min(event.movementY, Controls.pointerMaxMove),
    );
  }

  onPointerDown(event) {
    this.#pointers.add(event.button);
    this.lock(); // remove when dev mode

    if (this.activeLook) {
      this.dispatchAction(event.button);
    }
  }

  onPointerUp(event) {
    this.#pointers.delete(event.button);

    if (this.activeLook) {
      if (event.button === 0) {
        //
      }

      if (event.button === 2) {
        this.povLock = false;
      }
    }
  }

  onKeyDown(event) {
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.#keys.add(Keys.KeyW);
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.#keys.add(Keys.KeyA);
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.#keys.add(Keys.KeyS);
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.#keys.add(Keys.KeyD);
        break;

      case 'Space': {
        this.#keys.add(Keys.Space);
        break;
      }

      case 'KeyQ': {
        this.#keys.add(Keys.KeyQ);
        break;
      }

      case 'KeyE': {
        this.#keys.add(Keys.KeyE);
        break;
      }

      case 'KeyC': {
        this.#keys.add(Keys.c);
        break;
      }

      default: {
        if (event.shiftKey) {
          this.#keys.add(Keys.shift);
        }

        if (event.altKey) {
          this.#keys.add(Keys.alt);
        }
      }
    }

    if (ActionKeys.has(event.code) && !event.repeat) {
      const now = performance.now();

      if (this.player.onGround && !this.#mashed) {
        if (this.#keyUpTime === 0 || now - this.#keyUpTime > InputDuration) {
          this.#keyDownTime = now;
          this.#lastKey = event.code;
        } else {
          if (now - this.#keyUpTime <= InputDuration) {
            this.#mashed = true;
          }

          this.#keyUpTime = 0;
        }
      }

      /* console.log(this.#keyDownTime, this.#keyUpTime)
      if (
        this.#keyDownTime === 0 &&
        this.#keyUpTime === 0
      ) {
        console.log(1)
        this.#keyDownTime = now;
        this.#lastKey = event.code;
      } else if (this.#lastKey === event.code) {
        console.log(5)
        if (this.#keyUpTime > 0) {
          console.log(6)
          if (now - this.#keyUpTime <= InputDuration) {
            console.log('7, mashed')
            this.#mashed = true;
          }

          this.#keyUpTime = 0;
        }
      } else {
        this.#keyUpTime = 0;

      } */
    }
  }

  onKeyUp(event) {
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.#keys.delete(Keys.KeyW);
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.#keys.delete(Keys.KeyA);
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        this.#keys.delete(Keys.KeyS);
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.#keys.delete(Keys.KeyD);
        break;

      case 'Space': {
        this.#keys.delete(Keys.Space);
        break;
      }

      case 'KeyQ': {
        this.#keys.delete(Keys.KeyQ);
        break;
      }

      case 'KeyE': {
        this.#keys.delete(Keys.KeyE);
        break;
      }

      case 'KeyC': {
        this.#keys.delete(Keys.c);
        break;
      }

      default: {
        if (!event.shiftkey) {
          this.#keys.delete(Keys.shift);
        }

        if (!event.altKey) {
          this.#keys.delete(Keys.alt);
        }
      }
    }

    if (ActionKeys.has(event.code)) {
      const now = performance.now();

      if (this.player.onGround && !this.#mashed) {
        if (this.#keyDownTime === 0) {
          this.#keyUpTime = 0;
          this.#lastKey = '';
        } else {
          if (now - this.#keyDownTime <= InputDuration) {
            this.#keyUpTime = performance.now();
          }

          this.#keyDownTime = 0;
        }
      }
    }

    /* if (this.#lastKey === event.code) {
      console.log(2)
      if (this.#keyDownTime > 0) {
        console.log(3)
        const now = performance.now();

        if (
          now - this.#keyDownTime <= InputDuration
        ) {
          console.log(4)
          this.#keyUpTime = performance.now();
        }

        this.#keyDownTime = 0;
      }
    } */
  }

  dispose() {
    this.domElement.removeEventListener('contextmenu', this.#contextmenu);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);

    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
  }

  moveForward(delta) {
    const direction = this.direction.clone().multiplyScalar(delta);
    this.velocity.add(direction);
  }

  rotate(delta) {
    const rotation = delta * Controls.turnSpeed * 0.02;
    this.rotY += rotation;
    this.rotation.y += rotation;

    this.direction.applyAxisAngle(this.#virticalVector, rotation);
    this.direction.normalize();
  }

  moveSide(delta) {
    const direction = this.#vectorB.crossVectors(
      this.direction,
      this.#virticalVector,
    );
    direction.normalize();
    this.velocity.add(direction.multiplyScalar(delta));
  }

  input() {
    // 入力操作の処理

    // update()で一度だけアクションを発動する
    if (this.#keys.has(Keys.Space)) {
      this.#actions.add(Actions.jump);
    }

    // 緊急回避中とスタン中はアクションを更新しない
    if (this.#states.has(States.urgency) || this.#states.has(States.stunning)) {
      return;
    }

    // Cキー押し下げ時、追加で対応のキーを押していると緊急回避状態へ移行
    // ジャンプ中は緊急行動のコマンド受け付けは停止
    // if (this.player.onGround && this.#keys.has(Keys.c)) {
    if (this.#mashed) {
      this.#states.add(States.urgency);

      if (Keys[this.#lastKey] === Keys.KeyW) {
        this.#actions.add(Actions.quickMoveForward);
      } else if (Keys[this.#lastKey] === Keys.KeyA) {
        this.#actions.add(Actions.quickTurnLeft);
      } else if (Keys[this.#lastKey] === Keys.KeyS) {
        this.#actions.add(Actions.quickMoveBackward);
      } else if (Keys[this.#lastKey] === Keys.KeyD) {
        this.#actions.add(Actions.quickTurnRight);
      } else if (Keys[this.#lastKey] === Keys.KeyQ) {
        this.#actions.add(Actions.quickMoveLeft);
      } else if (Keys[this.#lastKey] === Keys.KeyE) {
        this.#actions.add(Actions.quickMoveRight);
      } /* else {
        // 方向キーが押されてない場合はモードを解除
        this.#states.delete(States.urgency);
      } */

      return;
    }

    /*
    if (
      !this.#states.has(States.urgency) &&
      !this.#states.has(States.stunning)
    ) {
      this.#actions.clear();

      if (this.#keys.has(Keys.c)) {
        this.#states.add(States.urgency);

        if (this.#keys.has(Keys.KeyW)) {
          this.#actions.add(Actions.quickMoveForward);
        } else if (this.#keys.has(Keys.KeyA)) {
          this.#actions.add(Actions.quickTurnLeft);
        } else if (this.#keys.has(Keys.KeyS)) {
          this.#actions.add(Actions.quickMoveBackward);
        } else if (this.#keys.has(Keys.KeyD)) {
          this.#actions.add(Actions.quickTurnRight);
        } else if (this.#keys.has(Keys.KeyQ)) {
          this.#actions.add(Actions.quickMoveLeft);
        } else if (this.#keys.has(Keys.KeyE)) {
          this.#actions.add(Actions.quickMoveRight);
        } else {
          // 方向キーが押されてない場合はモードを解除
          this.#states.delete(States.urgency);
        }

        return;
      }
    } else {
      return;
    } */

    if (this.#keys.has(Keys.shift)) {
      this.#states.add(States.sprint);
    } else {
      this.#states.delete(States.sprint);
    }

    // 前進と後退
    if (this.#keys.has(Keys.KeyW) && !this.#keys.has(Keys.KeyS)) {
      this.#actions.add(Actions.moveForward);
    } else if (this.#keys.has(Keys.KeyS) && !this.#keys.has(Keys.KeyW)) {
      this.#actions.add(Actions.moveBackward);
    }

    if (!this.#keys.has(Keys.KeyW)) {
      this.#actions.delete(Actions.moveForward);
    }

    if (!this.#keys.has(Keys.KeyS)) {
      this.#actions.delete(Actions.moveBackward);
    }

    // 左右回転
    if (this.#keys.has(Keys.KeyA) && !this.#keys.has(Keys.KeyD)) {
      this.#actions.add(Actions.rotateLeft);
    } else if (this.#keys.has(Keys.KeyD) && !this.#keys.has(Keys.KeyA)) {
      this.#actions.add(Actions.rotateRight);
    }

    if (!this.#keys.has(Keys.KeyA)) {
      this.#actions.delete(Actions.rotateLeft);
    }

    if (!this.#keys.has(Keys.KeyD)) {
      this.#actions.delete(Actions.rotateRight);
    }

    // 左右平行移動
    if (this.#keys.has(Keys.KeyQ) && !this.#keys.has(Keys.KeyE)) {
      this.#actions.add(Actions.moveLeft);
    } else if (this.#keys.has(Keys.KeyE) && !this.#keys.has(Keys.KeyQ)) {
      this.#actions.add(Actions.moveRight);
    }

    if (!this.#keys.has(Keys.KeyQ)) {
      this.#actions.delete(Actions.moveLeft);
    }

    if (!this.#keys.has(Keys.KeyE)) {
      this.#actions.delete(Actions.moveRight);
    }

    /// ///////////////
    /* this.#actions.clear();

    // update()で一度だけアクションを発動する
    if (this.#keys.has(Keys.Space)) {
      this.#actions.add(Actions.jump);
    }

    if (this.#keys.has(Keys.shift)) {
      this.#states.add(States.sprint);
    } else {
      this.#states.delete(States.sprint);
    }

    if (this.#keys.has(Keys.KeyW) && !this.#keys.has(Keys.KeyS)) {
      this.#actions.add(Actions.moveForward);
    } else if (this.#keys.has(Keys.KeyS) && !this.#keys.has(Keys.KeyW)) {
      this.#actions.add(Actions.moveBackward);
    }

    if (this.#keys.has(Keys.KeyA) && !this.#keys.has(Keys.KeyD)) {
      this.#actions.add(Actions.rotateLeft);
    }

    if (this.#keys.has(Keys.KeyD) && !this.#keys.has(Keys.KeyA)) {
      this.#actions.add(Actions.rotateRight);
    }

    if (this.#keys.has(Keys.KeyQ) && !this.#keys.has(Keys.KeyE)) {
      this.#actions.add(Actions.moveLeft);
    } else if (this.#keys.has(Keys.KeyE) && !this.#keys.has(Keys.KeyQ)) {
      this.#actions.add(Actions.moveRight);
    } */
  }

  update(deltaTime) {
    if (this.moved) {
      this.moved = false;
      this.timeout = true;
      this.st = performance.now();
    } else {
      const now = performance.now();

      if (now - this.st > Controls.idleTime * 1000) {
        this.st = 0;
        this.timeout = false;
      }
    }

    this.input();

    // 自機の動き制御
    if (this.stunningRemainingTime > 0) {
      this.stunningRemainingTime -= deltaTime;

      if (this.stunningRemainingTime <= 0) {
        this.#states.delete(States.stunning);
        this.stunningRemainingTime = 0;
      }
    } else if (
      this.#states.has(States.urgency) &&
      this.urgencyRemainingTime === 0 &&
      this.player.onGround
    ) {
      this.urgencyRemainingTime = Controls.urgencyDuration;
    }

    if (this.#actions.has(Actions.jump)) {
      this.#actions.delete(Actions.jump);
      this.player.jump(deltaTime);
    }

    if (this.urgencyRemainingTime > 0) {
      this.urgencyRemainingTime -= deltaTime;

      if (this.urgencyRemainingTime <= 0) {
        this.#mashed = false;

        this.#actions.clear();
        this.#states.delete(States.urgency);
        this.#states.add(States.stunning);
        this.urgencyRemainingTime = 0;
        this.stunningRemainingTime = Controls.stunningDuration;
      }

      if (this.#actions.has(Actions.quickMoveForward)) {
        this.player.moveForward(deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveBackward)) {
        this.player.moveForward(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickTurnLeft)) {
        this.player.rotate(deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickTurnRight)) {
        this.player.rotate(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveLeft)) {
        this.player.moveSide(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveRight)) {
        this.player.moveSide(deltaTime, States.urgency);
      }
    } else {
      const speedDelta = 0;

      /* if (this.onGround) {
        speedDelta = deltaTime * Controls.speed;

        if (
          this.#states.has(States.sprint) &&
          this.#actions.has(Actions.moveForward)
        ) {
          speedDelta *= Controls.sprint;
        }
      } else {
        speedDelta = deltaTime * Controls.airSpeed;
      } */

      /* if (this.#actions.has(Actions.rotateLeft)) {
        this.rotate(speedDelta);
      } else if (this.#actions.has(Actions.rotateRight)) {
        this.rotate(-speedDelta);
      }

      if (this.#actions.has(Actions.moveForward)) {
        this.player.moveForward(deltaTime);
        //this.moveForward(speedDelta);
      } else if (this.#actions.has(Actions.moveBackward)) {
        this.player.moveForward(-deltaTime);
        //this.moveForward(-speedDelta);
      }

      if (this.#actions.has(Actions.moveLeft)) {
        this.moveSide(-speedDelta * 0.5);
      } else if (this.#actions.has(Actions.moveRight)) {
        this.moveSide(speedDelta * 0.5);
      } */
      if (this.#actions.has(Actions.rotateLeft)) {
        this.player.rotate(deltaTime);
      } else if (this.#actions.has(Actions.rotateRight)) {
        this.player.rotate(-deltaTime);
      }

      if (this.#actions.has(Actions.moveForward)) {
        if (this.#states.has(States.sprint)) {
          this.player.moveForward(deltaTime, States.sprint);
        } else {
          this.player.moveForward(deltaTime);
        }
      } else if (this.#actions.has(Actions.moveBackward)) {
        this.player.moveForward(-deltaTime);
      }

      if (this.#actions.has(Actions.moveLeft)) {
        this.player.moveSide(-deltaTime);
      } else if (this.#actions.has(Actions.moveRight)) {
        this.player.moveSide(deltaTime);
      }
    }

    /* if (this.onGround && this.#actions.has(Actions.jump)) {
      this.#actions.delete(Actions.jump);
      this.velocity.y = Controls.jumpPower * deltaTime * 50;
    } */

    /* const resistance = this.onGround
      ? Controls.resistance
      : Controls.airResistance;
    const damping = exp(-resistance * deltaTime) - 1;

    if (!this.onGround) {
      this.velocity.y -= World.gravity * deltaTime;
    }

    this.velocity.addScaledVector(this.velocity, damping); */

    // 自機の視点制御
    let actualLookSpeed = Controls.lookSpeed;
    const { spherical } = this.player;
    // let actualLookSpeed = deltaTime * Controls.lookSpeed * 0.02;

    if (!this.activeLook) {
      actualLookSpeed = 0;
    }

    if (this.timeout) {
      if (this.povSight.material.color !== sightColor.pov) {
        this.povSight.material.color = sightColor.pov;
      }

      if (!this.povIndicator.visible) {
        this.povIndicator.visible = true;
      }

      // this.rotation.x -= this.dy * actualLookSpeed;
      // this.rotation.y -= this.dx * actualLookSpeed;

      const degX = (Camera.FOV * this.dy) / (this.viewHalfY * 2);
      const radX = degX * degToRadCoef;
      this.povCoords.theta -= radX * actualLookSpeed;

      const degY = (Camera.FOV * this.dx) / (this.viewHalfX * 2);
      const radY = degY * degToRadCoef;
      this.povCoords.phi -= radY * actualLookSpeed;

      this.povCoords.theta = max(
        halfPI - this.maxPolarAngle.virtical,
        min(halfPI - this.minPolarAngle.virtical, this.povCoords.theta),
      );
      this.povCoords.phi = max(
        PI - this.maxPolarAngle.horizontal,
        min(PI - this.minPolarAngle.horizontal, this.povCoords.phi),
      );

      // this.povIndicator.position.x =
      // (-this.viewHalfX * (this.rotY - this.rotation.y)) / PI;
      let posX = (this.viewHalfX * -this.povCoords.phi) / quarterPI;
      // posX = max(-this.viewHalfX, min(this.viewHalfX, posX));

      if (posX < -this.viewHalfX) {
        posX = -this.viewHalfX;
        this.povIndicator.material.color = indicatorColor.beyondFov;
      } else if (posX > this.viewHalfX) {
        posX = this.viewHalfX;
        this.povIndicator.material.color = indicatorColor.beyondFov;
      } else if (this.povIndicator.material.color !== indicatorColor.normal) {
        this.povIndicator.material.color = indicatorColor.normal;
      }

      this.povIndicator.position.x = posX;
    } else if (!this.povLock) {
      if (this.povCoords.theta === 0 && this.povCoords.phi === 0) {
        if (this.povSight.material.color !== sightColor.front) {
          this.povSight.material.color = sightColor.front;
        }

        if (this.povIndicator.visible) {
          this.povIndicator.visible = false;
        }
      }

      if (this.povCoords.theta !== 0) {
        if (abs(this.povCoords.theta) < Controls.restoreMinAngle) {
          this.povCoords.theta = 0;
        } else {
          const rx =
            -this.povCoords.theta * deltaTime * Controls.restoreSpeed +
            sign(-this.povCoords.theta) * Controls.restoreMinAngle;
          this.povCoords.theta += rx;
        }
      }

      if (this.povCoords.phi !== 0) {
        if (abs(this.povCoords.phi) < Controls.restoreMinAngle) {
          this.povCoords.phi = 0;
        } else {
          const dr =
            this.povCoords.phi * deltaTime * Controls.restoreSpeed +
            sign(this.povCoords.phi) * Controls.restoreMinAngle;
          this.povCoords.phi -= dr;
        }

        if (this.povIndicator.material.color !== indicatorColor.normal) {
          this.povIndicator.material.color = indicatorColor.normal;
        }

        const posX = (this.viewHalfX * -this.povCoords.phi) / quarterPI;
        /* posX = max(-this.viewHalfX, min(this.viewHalfX, posX)); */
        this.povIndicator.position.x = posX;
      }
    }

    this.player.setPovCoords(this.povCoords);

    this.dx = 0;
    this.dy = 0;
  }
}

export { FirstPersonControls };
