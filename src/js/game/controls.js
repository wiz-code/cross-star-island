import { MathUtils, Spherical, Vector3, Euler } from 'three';

import { World, Controls } from './settings';

const { radToDeg, degToRad, clamp, mapLinear } = MathUtils;
const { max, min, exp, PI } = Math;
const halfPI = PI / 2;

class FirstPersonControls {
  #lookDirection = new Vector3();

  #spherical = new Spherical();

  #target = new Vector3();

  #lat = 0;

  #lon = 0;

  #targetPosition = new Vector3();

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

    this.ownDirection = new Vector3();

    this.autoSpeedFactor = 0.0;

    this.velocity = new Vector3();
		this.direction = new Vector3();
    this.onGround = false;

    this.euler = new Euler(0, 0, 0, 'YXZ');

    this.dx = 0;
    this.dy = 0;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

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
    const { quaternion } = this.camera;
    this.euler.setFromQuaternion(quaternion);
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
        this.moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
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
        this.moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
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

  getForwardVector() {
		this.camera.getWorldDirection(this.direction);
		this.direction.y = 0;
		this.direction.normalize();

		return this.direction;
	}

  getSideVector() {
		this.camera.getWorldDirection(this.direction);
		this.direction.y = 0;
		this.direction.normalize();
		this.direction.cross(this.camera.up);

		return this.direction;
	}

  update(deltaTime) {
    // 自機の動き制御
    const speedDelta = deltaTime * (this.onGround ? Controls.speed : Controls.airSpeed);

    if (this.moveForward) {
      this.velocity.add(this.getForwardVector().multiplyScalar(speedDelta));
    }

    if (this.moveBackward) {
      this.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
    }

    if (this.moveLeft) {
      this.velocity.add(this.getSideVector().multiplyScalar(-speedDelta));
    }

    if (this.moveRight) {
      this.velocity.add(this.getSideVector().multiplyScalar(speedDelta));
    }

    if (this.onGround && this.jumped) {
      this.onGround = false;
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

    const { quaternion } = this.camera;
    this.euler.setFromQuaternion(quaternion);

	  this.euler.y -= this.dx * actualLookSpeed;
    this.euler.x -= this.dy * actualLookSpeed;

    this.euler.x = max(
      halfPI - this.maxPolarAngle,
      min(halfPI - this.minPolarAngle, this.euler.x)
    );

    //this.camera.quaternion.setFromEuler(this.euler);

    this.dx = 0;
    this.dy = 0;
  }
}

export { FirstPersonControls };
