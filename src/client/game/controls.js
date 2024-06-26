import { Spherical, Vector3 } from 'three';

import Publisher from './publisher';
import { Controls, Screen, GameColor } from './settings';
import { Keys, Pointers, Actions } from './data';

const { abs, sin, cos, sign, max, min, PI } = Math;
const halfPI = PI / 2;
const degToRadCoef = PI / 180;
const Rad_1 = (1 / 360) * PI * 2;

const {
  SightColor: sightColor,
  IndicatorColor: indicatorColor,
  SightLinesColor: sightLinesColor,
} = GameColor;

const onContextmenu = (event) => {
  event.preventDefault();
};

const MashKeys = new Set([
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
]);

const nonRepeatableKeyList = ['Space'];
const nonRepeatablePointerList = ['left'];

class FirstPersonControls extends Publisher {
  #vectorA = new Vector3();

  #vectorB = new Vector3();

  #keys = new Set();

  #pointers = new Set();

  #actions = new Set();//////////

  #states = new Set();////////

  #inputs = new Map();

  #rotation = new Spherical();

  #characterRot = new Spherical();

  #wheel = 0;

  #dx = 0;

  #dy = 0;

  #count = 0;

  #lastKey = '';

  #urgencyKey = '';

  #keyDownTime = 0;

  #keyUpTime = 0;

  #mashed = false;

  #mashedKey = '';

  #moved = false;

  #timeout = false;

  #st = 0;

  #resetPointer = false;

  #resetWheel = false;

  #povLock = false;

  #enabled = false;

  constructor(indicators, camera, domElement) {
    super();

    this.camera = camera;
    this.domElement = domElement;

    this.povSight = indicators.povSight;
    this.povSightLines = indicators.povSightLines;
    this.povIndicator = {
      horizontal: indicators.povIndicator.horizontal,
      virtical: indicators.povIndicator.virtical,
    };
    this.centerMark = indicators.centerMark;

    this.virticalAngle = {
      min: (-Controls.virticalAngleLimit / 360) * PI * 2,
      max: (Controls.virticalAngleLimit / 360) * PI * 2,
    };
    this.horizontalAngle = {
      min: (-Controls.horizontalAngleLimit / 360) * PI * 2,
      max: (Controls.horizontalAngleLimit / 360) * PI * 2,
    };

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    this.yawIndicatorRadius = 0;
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

    this.setCharacterRot = this.setCharacterRot.bind(this);
    this.onRotate = this.onRotate.bind(this);
    this.onUnsetControls = this.onUnsetControls.bind(this);

    this.handleResize();
    //this.setOrientation();

    this.enable();
  }

  isEnabled() {
    return this.#enabled;
  }

  enable(bool = true) {
    this.#enabled = bool;
  }

  setCharacterRot(rot) {
    this.#characterRot.phi = rot.phi;
    this.#characterRot.theta = rot.theta;
  }

  onRotate(phi, rotateComponent) {
    if (this.#povLock) {
      this.#rotation.phi -= rotateComponent;
    }

    this.#characterRot.phi = phi;
  }

  onUnsetControls() {
    this.clear('input');
    this.clear('setPovRot');
  }

  setOrientation() {
    const { rotation } = this.camera;
    this.#rotation.phi = rotation.y;
    this.#rotation.theta = rotation.x;
  }

  handleResize() {
    this.viewHalfX = this.domElement.offsetWidth / 2;
    this.viewHalfY = this.domElement.offsetHeight / 2;

    this.gaugeHalfY = this.viewHalfY - 32;

    this.yawIndicatorRadius = this.viewHalfY / 2 - 96;

    this.povIndicator.horizontal.position.setY(this.yawIndicatorRadius);
    this.povIndicator.virtical.position.setX(
      this.viewHalfX - Screen.sightPovSize / 2,
    );
    this.centerMark.position.setX(this.viewHalfX - Screen.sightPovSize / 2 + 7);
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

  unlock() {
    this.domElement.ownerDocument.exitPointerLock();
  }

  dispatchAction(type, button) {
    switch (type) {
      case 'pointerdown': {
        if (button === 0) {
          this.#moved = true;
        }

        if (button === 1) {
          //
        }

        if (button === 2) {
          this.#povLock = true;
        }

        break;
      }

      case 'pointerup': {
        if (button === 1) {
          this.#resetWheel = true;
        } else if (button === 2) {
          this.#povLock = false;
          this.#resetPointer = true;
        }

        break;
      }

      default: {
        //
      }
    }
  }

  onWheel(event) {
    event.preventDefault();

    if (!this.#enabled) {
      return;
    }

    const delta = sign(event.deltaY) * Controls.wheelSpeed * Rad_1;
    this.#wheel += delta;
  }

  onPointerMove(event) {
    if (!this.#enabled) {
      return;
    }

    this.#moved = true;

    if (this.#pointers.has(Pointers.right)) {
      if (event.button === Pointers.left) {
        if (this.#count % 2 === 0) {
          this.dispatchAction('pointerdown', event.button);
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
    if (!this.#enabled) {
      return;
    }

    this.#pointers.add(event.button);
    this.lock(); // 開発中はコメントアウト

    this.dispatchAction(event.type, event.button);
  }

  onPointerUp(event) {
    if (!this.#enabled) {
      return;
    }

    this.#pointers.delete(event.button);
    this.dispatchAction(event.type, event.button);
  }

  onKeyDown(event) {
    event.preventDefault();

    if (!this.#enabled) {
      return;
    }

    if (event.repeat) {
      return;
    }

    this.#keys.add(Keys[event.code]);

    if (event.shiftKey) {
      this.#keys.add(Keys.Shift);
    }

    if (event.altKey) {
      this.#keys.add(Keys.Alt);
    }

    if (MashKeys.has(event.code)) {
      const now = performance.now();

      if (this.#mashedKey === '') {
        if (
          this.#keyUpTime === 0 ||
          now - this.#keyUpTime > Controls.inputDuration
        ) {
          this.#keyDownTime = now;
          this.#lastKey = event.code;
        } else {
          if (
            this.#lastKey === event.code &&
            now - this.#keyUpTime <= Controls.inputDuration
          ) {
            this.#mashedKey = this.#lastKey;
            //const code = `Mash-${event.code}`;
            //this.#inputs.add(code);
          }

          this.#keyUpTime = 0;
        }
      }
    }
  }

  onKeyUp(event) {
    event.preventDefault();

    if (!this.#enabled) {
      return;
    }

    this.#keys.delete(Keys[event.code]);

    if (!event.shiftKey) {
      this.#keys.delete(Keys.Shift);
    }

    if (!event.altKey) {
      this.#keys.delete(Keys.Alt);
    }

    if (MashKeys.has(event.code)) {
      const now = performance.now();

      if (this.#mashedKey === '') {
        if (this.#keyDownTime === 0) {
          this.#keyUpTime = 0;
          this.#lastKey = '';
        } else {
          if (
            this.#lastKey === event.code &&
            now - this.#keyDownTime <= Controls.inputDuration
          ) {
            this.#keyUpTime = performance.now();
          }

          this.#keyDownTime = 0;
        }
      }
    }
  }

  dispose() {
    this.clear();

    document.removeEventListener('contextmenu', onContextmenu);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);

    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
  }

  input() {
    this.#inputs.clear();

    if (this.#keys.has(Keys.Space)) {
      this.#inputs.set(Actions.jump, 1);
    }

    const mashedCode = Keys[this.#mashedKey] ?? -1;
    let urgencyAction = -1;

    if (this.#keys.has(Keys.KeyW) || this.#keys.has(Keys.ArrowUp)) {
      if (this.#keys.has(mashedCode)) {
        urgencyAction = Actions.quickMoveForward;
        this.#inputs.set(Actions.quickMoveForward, 1);
      } else if (this.#keys.has(Keys.Shift)) {
        this.#inputs.set(Actions.splint, 1);
      } else {
        this.#inputs.set(Actions.moveForward, 1);
      }
    } else if (this.#keys.has(Keys.KeyS) || this.#keys.has(Keys.ArrowDown)) {
      if (this.#keys.has(mashedCode)) {
        urgencyAction = Actions.quickMoveBackward;
        this.#inputs.set(Actions.quickMoveBackward, 1);
      } else {
        this.#inputs.set(Actions.moveBackward, 1);
      }
    }

    if (this.#keys.has(Keys.KeyA) || this.#keys.has(Keys.ArrowLeft)) {
      if (this.#keys.has(mashedCode)) {
        urgencyAction = Actions.quickTurnLeft;
        this.#inputs.set(Actions.quickTurnLeft, 1);
      } else {
        this.#inputs.set(Actions.rotateLeft, 1);
      }
    } else if (this.#keys.has(Keys.KeyD) || this.#keys.has(Keys.ArrowRight)) {
      if (this.#keys.has(mashedCode)) {
        urgencyAction = Actions.quickTurnRight;
        this.#inputs.set(Actions.quickTurnRight, 1);
      } else {
        this.#inputs.set(Actions.rotateRight, 1);
      }
    }

    if (this.#keys.has(Keys.KeyQ)) {
      if (this.#keys.has(mashedCode)) {
        urgencyAction = Actions.quickMoveLeft;
        this.#inputs.set(Actions.quickMoveLeft, 1);
      } else {
        this.#inputs.set(Actions.moveLeft, 1);
      }
    } else if (this.#keys.has(Keys.KeyE)) {
      if (this.#keys.has(mashedCode)) {
        urgencyAction = Actions.quickMoveRight;
        this.#inputs.set(Actions.quickMoveRight, 1);
      } else {
        this.#inputs.set(Actions.moveRight, 1);
      }
    }

    if (this.#pointers.has(Pointers.left)) {
      this.#inputs.set(Actions.trigger, 1);
    }

    this.publish('input', this.#inputs, urgencyAction);

    if (this.#mashedKey !== '') {
      this.#mashedKey = '';
    }

    nonRepeatableKeyList.forEach((key) => this.#keys.delete(Keys[key]));
    nonRepeatablePointerList.forEach((pointer) => this.#pointers.delete(Pointers[pointer]));
  }

  update(deltaTime) {
    if (!this.#enabled) {
      return;
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

    const { lookSpeed } = Controls;
    const { virtical: pitchIndicator, horizontal: yawIndicator } =
      this.povIndicator;

    if (!this.#resetPointer) {
      if (this.povSight.material.color !== sightColor.pov) {
        this.povSight.material.color = sightColor.pov;
      }

      if (!yawIndicator.visible) {
        yawIndicator.visible = true;
      }

      if (!pitchIndicator.visible) {
        pitchIndicator.visible = true;
      }

      const degX = (90 * this.#dy) / this.gaugeHalfY;
      const radX = degX * degToRadCoef;
      this.#rotation.theta -= radX * lookSpeed;

      const degY = (135 * this.#dx) / this.viewHalfX;
      const radY = degY * degToRadCoef;
      this.#rotation.phi -= radY * lookSpeed;

      this.#rotation.theta = max(
        this.virticalAngle.min,
        min(this.virticalAngle.max, this.#rotation.theta),
      );
      this.#rotation.phi = max(
        this.horizontalAngle.min,
        min(this.horizontalAngle.max, this.#rotation.phi),
      );

      let posY =
        (this.gaugeHalfY * this.#rotation.theta) / this.virticalAngle.max;

      if (
        this.#rotation.phi === this.horizontalAngle.min ||
        this.#rotation.phi === this.horizontalAngle.max
      ) {
        yawIndicator.material.color = indicatorColor.beyondFov;
      } else if (yawIndicator.material.color !== indicatorColor.normal) {
        yawIndicator.material.color = indicatorColor.normal;
      }

      if (this.#rotation.theta <= this.virticalAngle.min) {
        posY = -this.gaugeHalfY;
        pitchIndicator.material.color = indicatorColor.beyondFov;
      } else if (this.#rotation.theta >= this.virticalAngle.max) {
        posY = this.gaugeHalfY;
        pitchIndicator.material.color = indicatorColor.beyondFov;
      } else if (pitchIndicator.material.color !== indicatorColor.normal) {
        pitchIndicator.material.color = indicatorColor.normal;
      }

      yawIndicator.material.rotation = this.#rotation.phi;
      yawIndicator.position.x =
        this.yawIndicatorRadius * cos(this.#rotation.phi + halfPI);
      yawIndicator.position.y =
        this.yawIndicatorRadius * sin(this.#rotation.phi + halfPI);
      pitchIndicator.position.y = posY;
    } else {
      if (this.#rotation.theta !== 0) {
        if (abs(this.#rotation.theta) < Controls.restoreMinAngle) {
          this.#rotation.theta = 0;
        } else {
          const rx =
            -this.#rotation.theta * deltaTime * Controls.restoreSpeed +
            sign(-this.#rotation.theta) * Controls.restoreMinAngle;
          this.#rotation.theta += rx;
        }

        if (pitchIndicator.material.color !== indicatorColor.normal) {
          pitchIndicator.material.color = indicatorColor.normal;
        }

        const posY = (this.gaugeHalfY * this.#rotation.theta) / halfPI;
        pitchIndicator.position.y = posY;
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

        if (yawIndicator.material.color !== indicatorColor.normal) {
          yawIndicator.material.color = indicatorColor.normal;
        }

        yawIndicator.material.rotation = this.#rotation.phi;
        yawIndicator.position.x =
          this.yawIndicatorRadius * cos(this.#rotation.phi + halfPI);
        yawIndicator.position.y =
          this.yawIndicatorRadius * sin(this.#rotation.phi + halfPI);
      }
    }

    if (this.#rotation.theta === 0 && this.#rotation.phi === 0) {
      if (this.#resetPointer) {
        this.#resetPointer = false;
      }

      if (this.povSight.material.color !== sightColor.front) {
        this.povSight.material.color = sightColor.front;
      }

      if (yawIndicator.visible) {
        yawIndicator.visible = false;
      }

      if (pitchIndicator.visible) {
        pitchIndicator.visible = false;
      }
    }

    if (this.#wheel === 0) {
      if (this.povSightLines.material.color !== sightLinesColor.normal) {
        this.povSightLines.material.color = sightLinesColor.normal;
      }
    } else if (this.povSightLines.material.color !== sightLinesColor.wheel) {
      this.povSightLines.material.color = sightLinesColor.wheel;
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

    if (this.virticalAngle.max <= this.#wheel) {
      this.#wheel = this.virticalAngle.max;
    } else if (this.virticalAngle.min >= this.#wheel) {
      this.#wheel = this.virticalAngle.min;
    }

    this.publish('setPovRot', this.#rotation, this.#wheel);

    const posY = (-this.#wheel / halfPI) * this.viewHalfY * 2.4;
    this.povSightLines.position.setY(posY);
    this.camera.rotation.x = this.#rotation.theta + this.#wheel;

    this.camera.rotation.y = this.#rotation.phi + this.#characterRot.phi;

    this.#dx = 0;
    this.#dy = 0;
  }
}

export default FirstPersonControls;
