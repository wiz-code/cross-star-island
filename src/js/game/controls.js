import { MathUtils, Spherical, Vector3, Euler, Quaternion } from 'three';

import { World, Controls } from './settings';

const { radToDeg, degToRad, clamp, mapLinear } = MathUtils;
const { abs, sign, floor, max, min, exp, PI } = Math;
const halfPI = PI / 2;

class FirstPersonControls {
  #vec3 = new Vector3();

  #virticalVector = new Vector3(0, 1, 0);

  #contextmenu(event) {
    event.preventDefault();
  }

  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // API

    this.enabled = true;

    this.lookVertical = true;
    this.autoForward = false;

    this.activeLook = true;

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

    this.sprint = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveBackward = false;
    this.rotateLeft = false;
    this.rotateRight = false;

    this.jumped = false;

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
    this.dx = event.movementX;
    this.dy = event.movementY;
  }

  onPointerDown(event) {
    this.lock();
  }

  onPointerUp(event) {
    //
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.sprint = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.rotateLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.rotateRight = true;
        break;

      case 'KeyR':
        this.moveUp = true;
        break;
      case 'KeyF':
        this.moveDown = true;
        break;

      case 'Space': {
        if (this.onGround) {
          this.jumped = true;
        }
        break;
      }

      case 'KeyQ': {
        this.moveLeft = true;
        break;
      }

      case 'KeyE': {
        this.moveRight = true;
        break;
      }

      default: {
        //
      }
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.sprint = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.rotateLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.rotateRight = false;
        break;

      case 'KeyR':
        this.moveUp = false;
        break;
      case 'KeyF':
        this.moveDown = false;
        break;

      case 'Space': {
        this.jumped = false;
        break;
      }

      case 'KeyQ': {
        this.moveLeft = false;
        break;
      }

      case 'KeyE': {
        this.moveRight = false;
        break;
      }

      default: {
        //
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

  forward(delta) {
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

    // 自機の動き制御
    let speedDelta = deltaTime * (this.onGround ? Controls.speed : Controls.airSpeed);

    if (this.sprint && !this.moveBackward) {
      speedDelta *= Controls.sprint;
    }

    if (this.rotateLeft && this.rotateRight && this.moveBackward) {
      this.forward(-speedDelta);
    } else if (this.rotateLeft && this.moveBackward) {
      this.rotate(-speedDelta);
      this.forward(-speedDelta);
    } else if (this.rotateRight && this.moveBackward) {
      this.rotate(speedDelta);
      this.forward(-speedDelta);
    } else if (this.rotateLeft && this.rotateRight) {
      this.forward(speedDelta);
    } else if (this.rotateLeft) {
      this.rotate(speedDelta);
      this.forward(speedDelta);
    } else if (this.rotateRight) {
      this.rotate(-speedDelta);
      this.forward(speedDelta);
    } if (this.moveLeft && !this.moveRight) {
			this.moveSide(-speedDelta);
    } else if (this.moveRight && !this.moveLeft) {
      this.moveSide(speedDelta);
    }

    if (this.onGround && this.jumped) {
      this.jumped = false;
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
    } else {
      const rad = PI * Controls.restoreSpeed * deltaTime;

      if (this.rotation.x !== 0) {
        if (abs(this.rotation.x) < rad) {
          this.rotation.x = 0;
        } else {
          const rx = sign(-this.rotation.x) * rad;
          this.rotation.x += rx;
        }
      }

      if (this.rotation.y !== this.rotY) {
        let ry = this.rotY - this.rotation.y

        if (abs(ry) < rad) {
          this.rotation.y = this.rotY;
        } else {
          ry = sign(ry) * rad;
          this.rotation.y += ry;
        }
      }
    }

    this.dx = 0;
    this.dy = 0;
  }
}

export { FirstPersonControls };
