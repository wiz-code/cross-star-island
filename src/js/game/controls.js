import { MathUtils, Spherical, Vector3 } from 'three';

const { max, min, PI } = Math;

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

    this.movementSpeed = 1.0;
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

    // internals

    this.autoSpeedFactor = 0.0;

    this.pointerX = 0;
    this.pointerY = 0;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.isJumping = false;

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
    this.setOrientation(this);
  }

  setOrientation(controls) {
    const { quaternion } = controls.camera;

    this.#lookDirection.set(0, 0, -1).applyQuaternion(quaternion);
    this.#spherical.setFromVector3(this.#lookDirection);

    this.#lat = 90 - MathUtils.radToDeg(this.#spherical.phi);
    this.#lon = MathUtils.radToDeg(this.#spherical.theta);
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
    this.setOrientation(this);

    return this;
  }

  onPointerMove(event) {
    this.pointerX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
    this.pointerY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
  }

  onPointerDown(event) {
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
        if (this.isJumping) {
          this.isJumping = false;
        } else {
          this.isJumping = true;
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
        this.isJumping = false;
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

  update(deltaTime) {
    let actualLookSpeed = deltaTime * this.lookSpeed;

    if (!this.activeLook) {
      actualLookSpeed = 0;
    }

    let verticalLookRatio = 1;

    if (this.constrainVertical) {
      verticalLookRatio = PI / (this.verticalMax - this.verticalMin);
    }

    this.#lon -= this.pointerX * actualLookSpeed;
    if (this.lookVertical)
      this.#lat -= this.pointerY * actualLookSpeed * verticalLookRatio;

    this.#lat = max(-85, min(85, this.#lat));

    let phi = MathUtils.degToRad(90 - this.#lat);
    const theta = MathUtils.degToRad(this.#lon);

    if (this.constrainVertical) {
      phi = MathUtils.mapLinear(
        phi,
        0,
        PI,
        this.verticalMin,
        this.verticalMax,
      );
    }

    const { position } = this.camera;

    this.#targetPosition.setFromSphericalCoords(1, phi, theta).add(position);

    this.camera.lookAt(this.#targetPosition);
  }

  _update(delta) {
    if (this.enabled === false) return;
    if (this.heightSpeed) {
      const y = MathUtils.clamp(
        this.camera.position.y,
        this.heightMin,
        this.heightMax,
      );
      const heightDelta = y - this.heightMin;

      this.autoSpeedFactor = delta * (heightDelta * this.heightCoef);
    } else {
      this.autoSpeedFactor = 0.0;
    }

    const actualMoveSpeed = delta * this.movementSpeed;

    if (this.moveForward || (this.autoForward && !this.moveBackward))
      this.camera.translateZ(-(actualMoveSpeed + this.autoSpeedFactor));
    if (this.moveBackward) this.camera.translateZ(actualMoveSpeed);

    if (this.moveLeft) this.camera.translateX(-actualMoveSpeed);
    if (this.moveRight) this.camera.translateX(actualMoveSpeed);

    if (this.moveUp) this.camera.translateY(actualMoveSpeed);
    if (this.moveDown) this.camera.translateY(-actualMoveSpeed);

    let actualLookSpeed = delta * this.lookSpeed;

    if (!this.activeLook) {
      actualLookSpeed = 0;
    }

    let verticalLookRatio = 1;

    if (this.constrainVertical) {
      verticalLookRatio = PI / (this.verticalMax - this.verticalMin);
    }

    this.#lon -= this.pointerX * actualLookSpeed;
    if (this.lookVertical)
      this.#lat -= this.pointerY * actualLookSpeed * verticalLookRatio;

    this.#lat = max(-85, min(85, this.#lat));

    let phi = MathUtils.degToRad(90 - this.#lat);
    const theta = MathUtils.degToRad(this.#lon);

    if (this.constrainVertical) {
      phi = MathUtils.mapLinear(
        phi,
        0,
        PI,
        this.verticalMin,
        this.verticalMax,
      );
    }

    const { position } = this.camera;

    this.#targetPosition.setFromSphericalCoords(1, phi, theta).add(position);

    this.camera.lookAt(this.#targetPosition);
  }
}

export { FirstPersonControls };
