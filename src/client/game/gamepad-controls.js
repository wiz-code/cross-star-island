import { Spherical, Vector3 } from 'three';

import Publisher from './publisher';
import { Game, Controls, Screen, GameColor } from './settings';
import { Actions } from './data';

const {
  SightColor: sightColor,
  IndicatorColor: indicatorColor,
  SightLinesColor: sightLinesColor,
} = GameColor;

const { floor, abs, sin, cos, sign, max, min, PI } = Math;
const halfPI = PI / 2;
const degToRadCoef = PI / 180;
const Rad_1 = (1 / 360) * PI * 2;
const { EPS } = Game;
const StickEPS = 1e-4;

const buttonList = [
  'a',
  'b',
  'x',
  'y',
  'lb',
  'rb',
  'lt',
  'rt',
  'back',
  'start',
  'lsb',
  'rsb',
  'up',
  'down',
  'left',
  'right',
  'guide',
];
const axisList = ['lsx', 'lsy', 'rsx', 'rsy', 'lt2', 'rt2'];

const buttonMap = new Map(buttonList.map((button, index) => [button, index]));
const axisMap = new Map(axisList.map((axis, index) => [axis, index]));

const nonRepeatableButtonList = ['a', 'b', 'x', 'y', 'lt', 'rt', 'lsb', 'rsb'];
const nonRepeatableAxisList = ['lt2', 'rt2'];

class GamepadControls extends Publisher {
  #vectorA = new Vector3();

  #vectorB = new Vector3();

  #inputs = new Map();

  #rotation = new Spherical();

  #characterRot = new Spherical();

  #pendings = new Set();

  #pitch = 0;

  #x0 = 0;

  #y0 = 0;

  #x1 = 0;

  #y1 = 0;

  #px = 0;

  #py = 0;

  #mashed = false;

  #resetPointer = false;

  #resetWheel = false;

  #povLock = false;

  #enabled = false;

  constructor(index, indicators, camera, domElement) {
    super();

    this.index = index;
    this.buttons = new Map(buttonList.map((value) => [value, 0]));
    this.axes = new Map(
      axisList.map((value, index) => {
        if (index > 3) {
          return [value, -1];
        }

        return [value, 0];
      }),
    );

    this.cache = {};

    this.camera = camera;
    this.domElement = domElement;

    this.povSight = indicators.povSight;
    this.povSightLines = indicators.povSightLines;
    this.povIndicator = {
      horizontal: indicators.povIndicator.horizontal,
      vertical: indicators.povIndicator.vertical,
    };

    this.verticalAngle = {
      min: (-Controls.verticalAngleLimit / 360) * PI * 2,
      max: (Controls.verticalAngleLimit / 360) * PI * 2,
    };
    this.horizontalAngle = {
      min: (-Controls.horizontalAngleLimit / 360) * PI * 2,
      max: (Controls.horizontalAngleLimit / 360) * PI * 2,
    };

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    this.yawIndicatorRadius = 0;
    this.gaugeHalfY = 0;
    this.multiplier = 1;

    this.setCharacterRot = this.setCharacterRot.bind(this);
    this.onRotate = this.onRotate.bind(this);
    this.onUnsetControls = this.onUnsetControls.bind(this);

    this.handleResize();
    // this.setOrientation();

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
    this.gaugeHalfY = Screen.gaugeHeight / 2;
    this.multiplier = this.gaugeHalfY / this.viewHalfX;

    this.yawIndicatorRadius = this.viewHalfY / 2 - 96;
    this.povIndicator.horizontal.position.setY(this.yawIndicatorRadius);

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

  dispose() {
    // TODO
  }

  input() {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.index];

    if (gamepad == null) {
      return;
    }

    const { axes, buttons } = gamepads[this.index];

    for (let i = 0, l = buttons.length; i < l; i += 1) {
      const button = buttonList[i];
      const { value } = buttons[i];
      this.buttons.set(button, value);
    }

    for (let i = 0, l = axes.length; i < l; i += 1) {
      const axis = axisList[i];
      const value = axes[i];
      this.axes.set(axis, value);
    }

    nonRepeatableButtonList.forEach((button) => {
      const index = buttonMap.get(button);
      const { value } = buttons[index];

      if (this.#pendings.has(button) && value === 0) {
        this.#pendings.delete(button);

        if (button === 'rsb') {
          this.#povLock = false;
          this.#resetPointer = true;
        } else if (button === 'y') {
          this.#resetWheel = true;
        }
      }
    });

    nonRepeatableAxisList.forEach((axis) => {
      const index = axisMap.get(axis);
      const value = axes[index];

      if (value < -1 + StickEPS) {
        this.#pendings.delete(axis);
      }
    });

    this.#inputs.clear();
    let urgencyAction = -1;

    this.buttons.forEach((value, button) => {
      const mashed = this.buttons.get('x');

      if (button === 'a' && value === 1) {
        if (!this.#pendings.has(button)) {
          this.#pendings.add(button);
          this.#inputs.set(Actions.jump, value);
        }
      } else if (button === 'lb' && value === 1) {
        if (mashed === 1) {
          urgencyAction = Actions.quickMoveLeft;
          this.#inputs.set(Actions.quickMoveLeft, 1);
        } else {
          this.#inputs.set(Actions.moveLeft);
        }
      } else if (button === 'rb' && value === 1) {
        if (mashed === 1) {
          urgencyAction = Actions.quickMoveRight;
          this.#inputs.set(Actions.quickMoveRight, 1);
        } else {
          this.#inputs.set(Actions.moveRight);
        }
      } else if ((button === 'rt' || button === 'b') && value === 1) {
        if (!this.#pendings.has(button)) {
          this.#pendings.add(button);
          this.#inputs.set(Actions.trigger, value);
        }
      } else if (button === 'up' && value === 1) {
        const delta = Rad_1;
        this.#pitch += delta;
      } else if (button === 'down' && value === 1) {
        const delta = Rad_1;
        this.#pitch -= delta;
      } else if (button === 'x' && value === 1) {
        if (!this.#pendings.has(button)) {
          this.#pendings.add(button);
        }
      } else if (button === 'y' && value === 1) {
        if (!this.#pendings.has(button)) {
          this.#pendings.add(button);
        }
      } else if (button === 'rsb' && value === 1) {
        if (!this.#pendings.has(button)) {
          this.#pendings.add(button);
          this.#povLock = true;
        }
      }
    });

    this.axes.forEach((value, axis) => {
      const mashed = this.buttons.get('x');

      if (axis === 'lsy') {
        if (value < -StickEPS) {
          if (mashed === 1) {
            urgencyAction = Actions.quickMoveForward;
            this.#inputs.set(Actions.quickMoveForward, 1);
          } else if (
            this.buttons.get('lsb') === 1 ||
            this.buttons.get('lt') === 1 ||
            this.axes.get('lt2') > 0
          ) {
            this.#inputs.set(Actions.splint, -value);
          } else {
            this.#inputs.set(Actions.moveForward, -value);
          }
        } else if (value > StickEPS) {
          if (mashed === 1) {
            urgencyAction = Actions.quickMoveBackward;
            this.#inputs.set(Actions.quickMoveBackward, 1);
          } else {
            this.#inputs.set(Actions.moveBackward, value);
          }
        }
      } else if (axis === 'lsx') {
        if (value > StickEPS) {
          if (mashed === 1) {
            urgencyAction = Actions.quickTurnRight;
            this.#inputs.set(Actions.quickTurnRight, 1);
          } else {
            this.#inputs.set(Actions.rotateRight, value);
          }
        } else if (value < -StickEPS) {
          if (mashed === 1) {
            urgencyAction = Actions.quickTurnLeft;
            this.#inputs.set(Actions.quickTurnLeft, 1);
          } else {
            this.#inputs.set(Actions.rotateLeft, -value);
          }
        }
      } else if (axis === 'rsy') {
        if (value > StickEPS) {
          this.#y0 = this.#py + value;
          this.#py = this.#y0;
        } else if (value < -StickEPS) {
          this.#y0 = this.#py + value;
          this.#py = this.#y0;
        }
      } else if (axis === 'rsx') {
        if (value > StickEPS) {
          this.#x0 = this.#px + value;
          this.#px = this.#x0;
        } else if (value < -StickEPS) {
          this.#x0 = this.#px + value;
          this.#px = this.#x0;
        }
      } else if (axis === 'rt2' && value > 0) {
        if (!this.#pendings.has(axis)) {
          this.#pendings.add(axis);
          this.#inputs.set(Actions.trigger, value);
        }
      } else if (axis === 'lt2' && value > 0) {
        if (!this.#pendings.has(axis)) {
          this.#pendings.add(axis);
        }
      }
    });

    this.publish('input', this.#inputs, urgencyAction);
  }

  update(deltaTime) {
    if (!this.#enabled) {
      return;
    }

    // 自機の視点制御
    const { lookSpeed, stickMomentum: momentum, restoreMinAngle, restoreSpeed } = Controls;
    const { vertical: pitchIndicator, horizontal: yawIndicator } =
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

      let dx = this.#x0 - this.#x1;
      let dy = this.#y0 - this.#y1;

      if ((dx > 0 && dx < EPS) || (dx < 0 && dx > -EPS)) {
        dx = 0;
      }

      if ((dy > 0 && dy < EPS) || (dy < 0 && dy > -EPS)) {
        dy = 0;
      }

      dx /= momentum;
      dy /= momentum;

      this.#x1 += dx;
      this.#y1 += dy;

      const multiplier = Controls.stickSpeed * lookSpeed;

      const degX = (dy * multiplier) / this.gaugeHalfY;
      const radX = degX * degToRadCoef * this.multiplier;
      this.#rotation.theta -= radX;

      const degY = (dx * multiplier) / this.viewHalfX;
      const radY = degY * degToRadCoef;
      this.#rotation.phi -= radY;

      this.#rotation.theta = max(
        this.verticalAngle.min,
        min(this.verticalAngle.max, this.#rotation.theta),
      );
      this.#rotation.phi = max(
        this.horizontalAngle.min,
        min(this.horizontalAngle.max, this.#rotation.phi),
      );

      let posY =
        (this.gaugeHalfY * this.#rotation.theta) / this.verticalAngle.max;

      if (
        this.#rotation.phi === this.horizontalAngle.min ||
        this.#rotation.phi === this.horizontalAngle.max
      ) {
        yawIndicator.material.color = indicatorColor.beyondFov;
      } else if (yawIndicator.material.color !== indicatorColor.normal) {
        yawIndicator.material.color = indicatorColor.normal;
      }

      if (this.#rotation.theta <= this.verticalAngle.min) {
        posY = -this.gaugeHalfY;
        pitchIndicator.material.color = indicatorColor.beyondFov;
      } else if (this.#rotation.theta >= this.verticalAngle.max) {
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
        if (abs(this.#rotation.theta) < restoreMinAngle) {
          this.#rotation.theta = 0;
        } else {
          const rx =
            -this.#rotation.theta * deltaTime * restoreSpeed +
            sign(-this.#rotation.theta) * restoreMinAngle;
          this.#rotation.theta += rx;
        }

        if (pitchIndicator.material.color !== indicatorColor.normal) {
          pitchIndicator.material.color = indicatorColor.normal;
        }

        const posY = (this.gaugeHalfY * this.#rotation.theta) / halfPI;
        pitchIndicator.position.y = posY;
      }

      if (this.#rotation.phi !== 0) {
        if (abs(this.#rotation.phi) < restoreMinAngle) {
          this.#rotation.phi = 0;
        } else {
          const dr =
            this.#rotation.phi * deltaTime * restoreSpeed +
            sign(this.#rotation.phi) * restoreMinAngle;
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

        this.#px = 0;
        this.#py = 0;
        this.#x0 = 0;
        this.#y0 = 0;
        this.#x1 = 0;
        this.#y1 = 0;
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

    if (this.#pitch === 0) {
      if (this.povSightLines.material.color !== sightLinesColor.normal) {
        this.povSightLines.material.color = sightLinesColor.normal;
      }
    } else if (this.povSightLines.material.color !== sightLinesColor.wheel) {
      this.povSightLines.material.color = sightLinesColor.wheel;
    }

    if (this.#resetWheel) {
      if (this.#pitch >= 0) {
        this.#pitch -= deltaTime;

        if (this.#pitch <= 0) {
          this.#pitch = 0;
          this.#resetWheel = false;
        }
      } else {
        this.#pitch += deltaTime;

        if (this.#pitch >= 0) {
          this.#pitch = 0;
          this.#resetWheel = false;
        }
      }
    }

    if (this.verticalAngle.max <= this.#pitch) {
      this.#pitch = this.verticalAngle.max;
    } else if (this.verticalAngle.min >= this.#pitch) {
      this.#pitch = this.verticalAngle.min;
    }

    this.publish('setPovRot', this.#rotation, this.#pitch);

    const posY = (-this.#pitch / halfPI) * this.viewHalfY * 2.4;
    this.povSightLines.position.setY(posY);
    this.camera.rotation.x = this.#rotation.theta + this.#pitch;

    this.camera.rotation.y = this.#rotation.phi + this.#characterRot.phi;
  }
}

export default GamepadControls;
