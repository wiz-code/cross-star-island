import { MathUtils, Spherical, Vector3, Euler, Quaternion } from 'three';

import { World, Controls } from './settings';

const { radToDeg, degToRad, clamp, mapLinear } = MathUtils;
const { max, min, exp, PI } = Math;
const halfPI = PI / 2;

class FirstPersonControls {
  #vec3 = new Vector3();
  #target = new Vector3();

  #virticalVector = new Vector3(0, 1, 0);

  #contextmenu(event) {
    event.preventDefault();
  }

  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // API

    this.enabled = true;

    //this.movementSpeed = 1.0;
    this.lookSpeed = 0.005;

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

    this.mouseDragOn = false;

    this.minPolarAngle = 0;
		this.maxPolarAngle = PI;

    // internals
    this.autoSpeedFactor = 0.0;

    this.velocity = new Vector3();
    this.quaternion = new Quaternion();
		this.direction = new Vector3();
    this.rotation = new Euler(0, 0, 0, 'YXZ');
    this.onGround = false;



    this.timeout = false;
    this.moved = false;
    this.st = 0;
    this.dx = 0;
    this.dy = 0;

    this.moveForward = false;
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
    const { quaternion, rotation } = this.camera;
    this.rotation.copy(rotation);
    this.quaternion.copy(quaternion);
    this.camera.getWorldDirection(this.direction);
  }

  handleResize() {
    this.viewHalfX = this.domElement.offsetWidth / 2;
    this.viewHalfY = this.domElement.offsetHeight / 2;
  }

  lookAt(x, y, z) {
    if (x.isVector3) {
      this.#target.copy(x);
    } else {
      this.#target.set(x, y, z);
    }

    this.camera.lookAt(this.#target);
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

    if (this.activeLook) {
      switch (event.button) {
        case 0:
          this.moveForward = true;
          break;
        case 2:
          this.moveBackward = true;
          break;
      }
    }

    this.mouseDragOn = true;
  }

  onPointerUp(event) {
    if (this.activeLook) {
      switch (event.button) {
        case 0:
          this.moveForward = false;
          break;
        case 2:
          this.moveBackward = false;
          break;
      }
    }

    this.mouseDragOn = false;
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true;
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

    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
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
    this.velocity.add(this.direction.clone().multiplyScalar(delta));
	}

  rotate(delta) {
    const rotation = delta * Controls.rotateSpeed * 0.02;
    this.rotation.y += rotation;
    this.direction.applyAxisAngle(this.#virticalVector, rotation);
    this.direction.normalize();
	}

  update(deltaTime) {
    if (this.moved) {
      this.moved = false;
      this.timeout = true;
      this.st = performance.now();
    } else if (this.timeout) {
      const now = performance.now();

      if (now - this.st > 300) {
        this.st = 0;
        this.moved = false;
        this.timeout = false;
      }
    }

    // 自機の動き制御
    const speedDelta = deltaTime * (this.onGround ? Controls.speed : Controls.airSpeed);

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
      this.rotation.y -= this.dx * actualLookSpeed;
      this.rotation.x -= this.dy * actualLookSpeed;

      this.rotation.x = max(
        halfPI - this.maxPolarAngle,
        min(halfPI - this.minPolarAngle, this.rotation.x)
      );
    }

    this.dx = 0;
    this.dy = 0;
  }
}

export { FirstPersonControls };
