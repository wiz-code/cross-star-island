import { MathUtils, Spherical, Vector3, Euler, Quaternion } from 'three';

import { World, Controls } from './settings';

const { radToDeg, degToRad, clamp, mapLinear } = MathUtils;
const { abs, sign, floor, max, min, exp, PI } = Math;
const halfPI = PI / 2;

const Keys = {
  w: 0,
  a: 1,
  s: 2,
  d: 3,
  q: 4,
  e: 5,

  sp: 10,
  shift: 11,
  alt: 12,
};

const Actions = {
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

const States = {
  sprint: 1,
  urgency: 2,
  stunning: 3,
};

class FirstPersonControls {
  #vec3 = new Vector3();

  #virticalVector = new Vector3(0, 1, 0);

  #contextmenu(event) {
    event.preventDefault();
  }

  #keys = new Set();

  #actions = new Set();

  #states = new Set();

  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // API

    this.enabled = true;

    this.lookVertical = true;
    this.autoForward = false;

    this.activeLook = true;
    this.povLock = false;

    this.heightSpeed = false;
    this.heightCoef = 1.0;
    this.heightMin = 0.0;
    this.heightMax = 1.0;

    this.constrainVertical = false;
    this.verticalMin = 0;
    this.verticalMax = PI;

    this.minPolarAngle = {
      virtical: 0,
      horizontal: 0,
    };
		this.maxPolarAngle = {
      virtical: PI,
      horizontal: PI * 2,
    };

    // internals
    this.autoSpeedFactor = 0.0;

    this.velocity = new Vector3();
		this.direction = new Vector3();
    this.rotation = new Euler(0, 0, 0, 'YXZ');
    this.rotY = 0;
    this.onGround = false;



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
    this.rotation.copy(rotation);
    this.rx = this.rotation.x;
    this.camera.getWorldDirection(this.direction);
  }

  handleResize() {
    this.viewHalfX = this.domElement.offsetWidth / 2;
    this.viewHalfY = this.domElement.offsetHeight / 2;
  }

  lookAt(x, y, z) {
    if (x.isVector3) {
      this.#vec3.copy(x);
    } else {
      this.#vec3.set(x, y, z);
    }

    this.camera.lookAt(this.#vec3);
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

  setOnGround(bool = true) {
    this.onGround = bool;
  }

  onPointerMove(event) {
    this.moved = true;
    this.dx = max(-Controls.pointerMaxMove, min(event.movementX, Controls.pointerMaxMove));
    this.dy = max(-Controls.pointerMaxMove, min(event.movementY, Controls.pointerMaxMove));
  }

  onPointerDown(event) {
    this.lock();

    if (this.activeLook) {
			if (event.button === 0) {
        //
      } else if (event.button === 2) {
        this.povLock = true;
			}
		}
  }

  onPointerUp(event) {
    if (this.activeLook) {
      if (event.button === 0) {
        //
      } else if (event.button === 2) {
        this.povLock = false;
			}
		}
  }

  onKeyDown(event) {
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.#keys.add(Keys.w);
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.#keys.add(Keys.a);
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.#keys.add(Keys.s);
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.#keys.add(Keys.d);
        break;

      case 'Space': {
        this.#keys.add(Keys.sp);
        break;
      }

      case 'KeyQ': {
        this.#keys.add(Keys.q);
        break;
      }

      case 'KeyE': {
        this.#keys.add(Keys.e);
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
  }

  onKeyUp(event) {
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.#keys.delete(Keys.w);
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.#keys.delete(Keys.a);
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        this.#keys.delete(Keys.s);
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.#keys.delete(Keys.d);
        break;

      case 'Space': {
        this.#keys.delete(Keys.sp);
        break;
      }

      case 'KeyQ': {
        this.#keys.delete(Keys.q);
        break;
      }

      case 'KeyE': {
        this.#keys.delete(Keys.e);
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
    const rotation = delta * Controls.rotateSpeed * 0.02;
    this.rotY += rotation;
    this.rotation.y += rotation;

    this.direction.applyAxisAngle(this.#virticalVector, rotation);
    this.direction.normalize();
	}

  moveSide(delta) {
    const direction = this.#vec3.crossVectors(this.direction, this.#virticalVector);
    direction.normalize();
    this.velocity.add(direction.multiplyScalar(delta));
  }

  input() {
    // 入力操作の処理

    // 緊急回避中とスタン中はアクションを更新しない
    if (
      !this.#states.has(States.urgency) &&
      !this.#states.has(States.stunning)
    ) {
      this.#actions.clear();

      if (this.#keys.has(Keys.alt)) {
        this.#states.add(States.urgency);

        if (this.#keys.has(Keys.w)) {
          this.#actions.add(Actions.quickMoveForward);
        } else if (this.#keys.has(Keys.a)) {
          this.#actions.add(Actions.quickTurnLeft);
        } else if (this.#keys.has(Keys.s)) {
          this.#actions.add(Actions.quickMoveBackward);
        } else if (this.#keys.has(Keys.d)) {
          this.#actions.add(Actions.quickTurnRight);
        } else if (this.#keys.has(Keys.q)) {
          this.#actions.add(Actions.quickMoveLeft);
        } else if (this.#keys.has(Keys.e)) {
          this.#actions.add(Actions.quickMoveRight);
        } else {
          // 方向キーが押されてない場合はモードを解除
          this.#states.delete(States.urgency);
        }

        return;
      }
    } else {
      return;
    }

    this.#actions.clear();

    // update()で一度だけアクションを発動する
    if (this.onGround && this.#keys.has(Keys.sp)) {
      this.#actions.add(Actions.jump);
    }

    if (this.#keys.has(Keys.shift)) {
      this.#states.add(States.sprint);
    } else {
      this.#states.delete(States.sprint);
    }

    if (this.#keys.has(Keys.w) && !this.#keys.has(Keys.s)) {
      this.#actions.add(Actions.moveForward);
    } else if (this.#keys.has(Keys.s) && !this.#keys.has(Keys.w)) {
      this.#actions.add(Actions.moveBackward);
    }

    if (
      this.#keys.has(Keys.a) &&
      !this.#keys.has(Keys.d)
    ) {
      this.#actions.add(Actions.rotateLeft);
    }

    if (
      this.#keys.has(Keys.d) &&
      !this.#keys.has(Keys.a)
    ) {
      this.#actions.add(Actions.rotateRight);
    }

    if (
      this.#keys.has(Keys.q) &&
      !this.#keys.has(Keys.e)
    ) {
      this.#actions.add(Actions.moveLeft);
    } else if (
      this.#keys.has(Keys.e) &&
      !this.#keys.has(Keys.q)
    ) {
      this.#actions.add(Actions.moveRight);
    }
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
      this.onGround
    ) {
      this.urgencyRemainingTime = Controls.urgencyDuration;
    }

    if (this.urgencyRemainingTime > 0) {
      this.urgencyRemainingTime -= deltaTime;

      if (this.urgencyRemainingTime <= 0) {
        this.#states.delete(States.urgency);
        this.#states.add(States.stunning);
        this.urgencyRemainingTime = 0;
        this.stunningRemainingTime = Controls.stunningDuration;
      }

      if (this.onGround) {
        const speedDelta = deltaTime * Controls.speed * Controls.urgency;

        if (this.#actions.has(Actions.quickMoveForward)) {
          this.moveForward(speedDelta);
        } else if (this.#actions.has(Actions.quickMoveBackward)) {
          this.moveForward(-speedDelta);
        } else if (this.#actions.has(Actions.quickTurnLeft)) {
          this.rotate(speedDelta);
        } else if (this.#actions.has(Actions.quickTurnRight)) {
          this.rotate(-speedDelta);
        } else if (this.#actions.has(Actions.quickMoveLeft)) {
          this.moveSide(-speedDelta);
        } else if (this.#actions.has(Actions.quickMoveRight)) {
          this.moveSide(speedDelta);
        }
      }
    } else {
      let speedDelta = 0;

      if (this.onGround) {
        speedDelta = deltaTime * Controls.speed;

        if (
          this.#states.has(States.sprint) &&
          (
            this.#actions.has(Actions.moveForward) ||
            this.#actions.has(Actions.rotateLeft) ||
            this.#actions.has(Actions.rotateRight)
          )
        ) {
          speedDelta *= Controls.sprint;
        }
      } else {
        speedDelta = deltaTime * Controls.airSpeed;
      }

      if (this.#actions.has(Actions.rotateLeft)) {
        this.rotate(speedDelta);
      } else if (this.#actions.has(Actions.rotateRight)) {
        this.rotate(-speedDelta);
      }

      if (this.#actions.has(Actions.moveForward)
      ) {
        this.moveForward(speedDelta);
      } else if (this.#actions.has(Actions.moveBackward)) {
        this.moveForward(-speedDelta);
      }


      if (this.#actions.has(Actions.moveLeft)) {
        this.moveSide(-speedDelta * 0.5);
      } else if (this.#actions.has(Actions.moveRight)) {
        this.moveSide(speedDelta * 0.5);
      }
    }

    if (this.onGround && this.#actions.has(Actions.jump)) {
      this.#actions.delete(Actions.jump);
      this.velocity.y = Controls.jumpPower * deltaTime * 50;
    }

    const resistance = this.onGround ? Controls.resistance : Controls.airResistance;
    let damping = exp(-resistance * deltaTime) - 1;

		if (!this.onGround) {
			this.velocity.y -= World.gravity * deltaTime;
		}

		this.velocity.addScaledVector(this.velocity, damping);

    // 自機の視点制御
    let actualLookSpeed = deltaTime * Controls.lookSpeed * 0.02;

    if (!this.activeLook) {
      actualLookSpeed = 0;
    }

    let verticalLookRatio = 1;

    if (this.timeout) {
      this.rotation.x -= this.dy * actualLookSpeed;
      this.rotation.y -= this.dx * actualLookSpeed;

      this.rotation.x = max(
        halfPI - this.maxPolarAngle.virtical,
        min(halfPI - this.minPolarAngle.virtical, this.rotation.x)
      );
      this.rotation.y = max(
        PI - this.maxPolarAngle.horizontal + this.rotY,
        min(PI - this.minPolarAngle.horizontal + this.rotY, this.rotation.y)
      );
    } else if (!this.povLock) {
      if (this.rotation.x !== 0) {
        if (abs(this.rotation.x) < Controls.restoreMinAngle) {
          this.rotation.x = 0;
        } else {
          const rx = -this.rotation.x * deltaTime * Controls.restoreSpeed + sign(-this.rotation.x) * Controls.restoreMinAngle;
          this.rotation.x += rx;
        }
      }

      if (this.rotation.y !== this.rotY) {
        let ry = this.rotY - this.rotation.y

        if (abs(ry) < Controls.restoreMinAngle) {
          this.rotation.y = this.rotY;
        } else {
          ry = ry * deltaTime * Controls.restoreSpeed + sign(ry) * Controls.restoreMinAngle;
          this.rotation.y += ry;
        }
      }
    }

    this.dx = 0;
    this.dy = 0;
  }
}

export { FirstPersonControls };
