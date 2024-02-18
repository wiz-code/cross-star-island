import { Spherical, Vector3, Color } from 'three';

import { Camera, Controls, Screen } from './settings';
import { Keys, Pointers } from './data';
import { createSight, sightLines, createPovIndicator, createCenterMark } from './screen';

const { abs, sign, max, min, PI } = Math;
const halfPI = PI / 2;
const degToRadCoef = PI / 180;
const Rad_1 = 1 / 360 * PI * 2;

const lerp = (x, y, p) => x + (y - x) * p;

const sightColor = {
  front: new Color(Screen.normalColor),
  pov: new Color(Screen.sightPovColor),
};
const indicatorColor = {
  normal: new Color(Screen.normalColor),
  beyondFov: new Color(Screen.warnColor),
};

const onContextmenu = (event) => {
  event.preventDefault();
};

const ActionKeys = new Set([
  'KeyW',
  'ArrowUp',

  'KeyA',
  'ArrowLeft',

  'KeyS',
  'ArrowDown',

  'KeyD',
  'ArrowRight',

  'KeyQ',
  'KeyE',

  'KeyR',
  'KeyF',
  'KeyZ',
  'KeyX',
  'KeyC',
]);

class FirstPersonControls {
  #vectorA = new Vector3();

  #vectorB = new Vector3();

  #keys = new Set();

  #pointers = new Set();

  #actions = new Set();

  #states = new Set();

  #rotation = new Spherical();

  #wheel = 0;

  #dx = 0;

  #dy = 0;

  #count = 0;

  #lastKey = '';

  #keyDownTime = 0;

  #keyUpTime = 0;

  #mashed = false;

  #moved = false;

  #timeout = false;

  #st = 0;

  #resetWheel = false;

  constructor(screen, camera, player, domElement) {
    this.screen = screen;
    this.camera = camera;
    this.player = player;
    this.domElement = domElement;

    this.povSight = createSight();
    this.screen.add(this.povSight);

    this.povSightLines = sightLines();
    this.screen.add(this.povSightLines);

    this.povIndicator = createPovIndicator();
    this.screen.add(this.povIndicator.horizontal);
    this.screen.add(this.povIndicator.virtical);

    this.centerMark = createCenterMark();
    this.screen.add(this.centerMark.horizontal);
    this.screen.add(this.centerMark.virtical);

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

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    this.gaugeHalfX = 0;
    this.gaugeHalfY = 0;

    this.onWheel = this.onWheel.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    document.addEventListener('contextmenu', onContextmenu);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerup', this.onPointerUp);

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    this.onChangeRotateComponent = this.onChangeRotateComponent.bind(this);
    this.player.subscribe(
      'onChangeRotateComponent',
      this.onChangeRotateComponent,
    );

    this.handleResize();
    this.setOrientation();
  }

  onChangeRotateComponent(rotateComponent) {
    if (this.povLock) {
      this.#rotation.phi -= rotateComponent;
    }
  }

  setOrientation() {
    const { rotation } = this.camera;
    this.#rotation.phi = rotation.y;
    this.#rotation.theta = rotation.x;
  }

  handleResize() {
    this.viewHalfX = this.domElement.offsetWidth / 2;
    this.viewHalfY = this.domElement.offsetHeight / 2;

    this.gaugeHalfX = this.viewHalfX - 32;
    this.gaugeHalfY = this.viewHalfY - 32;

    this.povIndicator.horizontal.position.setY(
      this.viewHalfY - Screen.sightPovSize / 2,
    );
    this.povIndicator.virtical.position.setX(
      this.viewHalfX - Screen.sightPovSize / 2,
    );
    this.centerMark.horizontal.position.setY(
      this.viewHalfY - Screen.sightPovSize / 2 + 7,
    );
    this.centerMark.virtical.position.setX(
      this.viewHalfX - Screen.sightPovSize / 2 + 7,
    );
    this.povSightLines.position.setX(0);
    this.povSightLines.position.setY(0);
  }

  lookAt(x, y, z) {
    if (x.isVector3) {
      this.#vectorA.copy(x);
    } else {
      this.#vectorA.set(x, y, z);
    }

    this.camera.lookAt(this.#vectorA);
    this.setOrientation();
  }

  async lock() {
    if (this.domElement.ownerDocument.pointerLockElement == null) {
      await this.domElement.requestPointerLock();
    }
  }

  dispose() {}

  unlock() {
    this.domElement.ownerDocument.exitPointerLock();
  }

  dispatchAction(button) {
    if (button === 0) {
      this.#moved = true;
      this.player.fire();
    }

    if (button === 1) {
      this.#resetWheel = true;
    }

    if (button === 2) {
      this.povLock = true;
    }
  }

  onWheel(event) {
    event.preventDefault();

    const delta = sign(event.deltaY) * 2 * Rad_1;
    const rot = this.#rotation.theta + this.#wheel + delta;

    if (
      halfPI - this.minPolarAngle.virtical >= rot &&
      halfPI - this.maxPolarAngle.virtical <= rot
    ) {
      this.#wheel += delta;
    }
  }

  onPointerMove(event) {
    this.#moved = true;

    if (this.#pointers.has(Pointers.right)) {
      if (event.button === Pointers.left) {
        if (this.#count % 2 === 0) {
          this.dispatchAction(event.button);
        }

        this.#count += 1;
      }
    }

    this.#dx = max(
      -Controls.pointerMaxMove,
      min(event.movementX, Controls.pointerMaxMove),
    );
    this.#dy = max(
      -Controls.pointerMaxMove,
      min(event.movementY, Controls.pointerMaxMove),
    );
  }

  onPointerDown(event) {
    this.#pointers.add(event.button);
    this.lock(); // 開発中はコメントアウト

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

    if (event.repeat) {
      return;
    }

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

    if (ActionKeys.has(event.code)) {
      const now = performance.now();

      if (!this.#mashed) {
        if (
          this.#keyUpTime === 0 ||
          now - this.#keyUpTime > Controls.inputDuration
        ) {
          this.#keyDownTime = now;
          this.#lastKey = event.code;
        } else {
          if (now - this.#keyUpTime <= Controls.inputDuration) {
            this.#mashed = true;
          }

          this.#keyUpTime = 0;
        }
      }
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

      if (!this.#mashed) {
        if (this.#keyDownTime === 0) {
          this.#keyUpTime = 0;
          this.#lastKey = '';
        } else {
          if (now - this.#keyDownTime <= Controls.inputDuration) {
            this.#keyUpTime = performance.now();
          }

          this.#keyDownTime = 0;
        }
      }
    }
  }

  dispose() {
    document.removeEventListener('contextmenu', onContextmenu);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);

    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);

    this.player.unsubscribe(
      'onChangeRotateComponent',
      this.onChangeRotateComponent,
    );
  }

  update(deltaTime) {
    this.player.input(this.#keys, this.#lastKey, this.#mashed);

    if (this.#mashed) {
      this.#mashed = false;
    }

    if (this.#keys.has(Keys.Space)) {
      this.#keys.delete(Keys.Space);
    }

    // 自機の視点制御
    if (this.#moved) {
      this.#moved = false;
      this.#timeout = true;
      this.#st = performance.now();
    } else {
      const now = performance.now();

      if (now - this.#st > Controls.idleTime * 1000) {
        this.#st = 0;
        this.#timeout = false;
      }
    }

    let actualLookSpeed = Controls.lookSpeed;

    if (!this.activeLook) {
      actualLookSpeed = 0;
    }

    if (this.#timeout || this.povLock) {
      if (this.#timeout) {
        if (this.povSight.material.color !== sightColor.pov) {
          this.povSight.material.color = sightColor.pov;
        }

        if (!this.povIndicator.horizontal.visible) {
          this.povIndicator.horizontal.visible = true;
        }

        if (!this.povIndicator.virtical.visible) {
          this.povIndicator.virtical.visible = true;
        }

        const degX = (90 * this.#dy) / this.gaugeHalfY; // (Camera.FOV * this.#dy) / (this.viewHalfY * 2);
        const radX = degX * degToRadCoef;
        this.#rotation.theta -= radX * actualLookSpeed;

        const degY = (135 * this.#dx) / this.gaugeHalfX; // (Camera.FOV * this.#dx) / (this.viewHalfX * 2);
        const radY = degY * degToRadCoef;
        this.#rotation.phi -= radY * actualLookSpeed;

        this.#rotation.theta = max(
          halfPI - this.maxPolarAngle.virtical,
          min(halfPI - this.minPolarAngle.virtical, this.#rotation.theta),
        );
        this.#rotation.phi = max(
          PI - this.maxPolarAngle.horizontal,
          min(PI - this.minPolarAngle.horizontal, this.#rotation.phi),
        );
      }

      let posX = (this.gaugeHalfX * -this.#rotation.phi) / PI;
      let posY = (this.gaugeHalfY * this.#rotation.theta) / halfPI;

      if (posX <= -this.gaugeHalfX) {
        posX = -this.gaugeHalfX;
        this.povIndicator.horizontal.material.color = indicatorColor.beyondFov;
      } else if (posX >= this.gaugeHalfX) {
        posX = this.gaugeHalfX;
        this.povIndicator.horizontal.material.color = indicatorColor.beyondFov;
      } else if (
        this.povIndicator.horizontal.material.color !== indicatorColor.normal
      ) {
        this.povIndicator.horizontal.material.color = indicatorColor.normal;
      }

      if (posY <= -this.gaugeHalfY) {
        posY = -this.gaugeHalfY;
        this.povIndicator.virtical.material.color = indicatorColor.beyondFov;
      } else if (posY >= this.gaugeHalfY) {
        posY = this.gaugeHalfY;
        this.povIndicator.virtical.material.color = indicatorColor.beyondFov;
      } else if (
        this.povIndicator.virtical.material.color !== indicatorColor.normal
      ) {
        this.povIndicator.virtical.material.color = indicatorColor.normal;
      }

      this.povIndicator.horizontal.position.x = posX;
      this.povIndicator.virtical.position.y = posY;
    } else {
      if (this.#rotation.theta === 0 && this.#rotation.phi === 0) {
        if (this.povSight.material.color !== sightColor.front) {
          this.povSight.material.color = sightColor.front;
        }

        if (this.povIndicator.horizontal.visible) {
          this.povIndicator.horizontal.visible = false;
        }

        if (this.povIndicator.virtical.visible) {
          this.povIndicator.virtical.visible = false;
        }
      }

      if (this.#rotation.theta !== 0) {
        if (abs(this.#rotation.theta) < Controls.restoreMinAngle) {
          this.#rotation.theta = 0;
        } else {
          const rx =
            -this.#rotation.theta * deltaTime * Controls.restoreSpeed +
            sign(-this.#rotation.theta) * Controls.restoreMinAngle;
          this.#rotation.theta += rx;
        }
      }

      if (this.#rotation.phi !== 0) {
        if (abs(this.#rotation.phi) < Controls.restoreMinAngle) {
          this.#rotation.phi = 0;
        } else {
          const dr =
            this.#rotation.phi * deltaTime * Controls.restoreSpeed +
            sign(this.#rotation.phi) * Controls.restoreMinAngle;
          this.#rotation.phi -= dr;
        }

        if (
          this.povIndicator.horizontal.material.color !== indicatorColor.normal
        ) {
          this.povIndicator.horizontal.material.color = indicatorColor.normal;
        }

        if (
          this.povIndicator.virtical.material.color !== indicatorColor.normal
        ) {
          this.povIndicator.virtical.material.color = indicatorColor.normal;
        }

        const posX = (this.gaugeHalfX * -this.#rotation.phi) / PI;
        this.povIndicator.horizontal.position.x = posX;

        const posY = (this.gaugeHalfY * this.#rotation.theta) / halfPI;
        this.povIndicator.virtical.position.y = posY;
      }
    }

    if (this.#resetWheel) {
      if (this.#wheel >= 0) {
        this.#wheel -= deltaTime;

        if (this.#wheel <= 0) {
          this.#wheel = 0;
          this.#resetWheel = false;
        }
      } else {
        this.#wheel += deltaTime;

        if (this.#wheel >= 0) {
          this.#wheel = 0;
          this.#resetWheel = false;
        }
      }
    }

    const posY = -this.#wheel / halfPI * this.viewHalfY * 2.3;
    this.povSightLines.position.setY(posY);
    this.player.setPovRotation(this.#rotation, this.#wheel);

    this.#dx = 0;
    this.#dy = 0;
  }
}

export default FirstPersonControls;
