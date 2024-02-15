import { Vector3, Spherical, Euler } from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';

import Character from './character';
import { Keys, Actions, States } from './data';
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

class Player extends Character {
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

  constructor(camera, name, ammo) {
    super(name, ammo);

    this.camera = camera;

    //this.camera.rotation.x = -RAD_30;
    this.camera.getWorldDirection(this.direction);
  }

  setPosition(checkPoint) {
    this.rotation.phi = checkPoint.direction;
    this.camera.rotation.y = checkPoint.direction;
    this.camera.getWorldDirection(this.direction);

    this.collider.start.copy(checkPoint.position);
    this.collider.end.copy(checkPoint.position);
    this.collider.end.y += this.data.height;
  }

  update(deltaTime) {
    super.update(deltaTime);

    this.camera.rotation.x = this.povRotation.theta;
    this.camera.rotation.y = this.povRotation.phi + this.rotation.phi;
    this.camera.position.copy(this.collider.end);
  }
}

export default Player;
