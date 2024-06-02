import { Sphere, Vector3, Spherical } from 'three';

import Entity from './entity';
import { World } from './settings';
import { getVectorPos, visibleChildren } from './utils';

class Collidable extends Entity {
  #bounced = false;

  constructor(name, type) {
    super(name, type);

    this.rotation = new Spherical();
    this.collider = new Sphere();
    this.velocity = new Vector3();
  }

  setPosition(position, phi = 0, theta = 0) {
    const pos = getVectorPos(position);
    this.collider.center.copy(pos);
    this.rotation.phi = phi;
    this.rotation.theta = theta;

    if (this.object != null) {
      this.object.rotation.y = this.rotation.phi;
    }
  }

  setObject(object) {
    this.object = object;
  }

  isBounced() {
    return this.#bounced;
  }

  setBounced(bool) {
    this.#bounced = bool;
  }

  setAlive(bool = true) {
    super.setAlive(bool);

    if (bool) {
      this.#bounced = false;
    }

    super.visible(bool);
  }

  updatePos() {
    this.object.position.copy(this.collider.center);
  }

  update(deltaTime, elapsedTime, damping) {
    this.velocity.y -= World.gravity * deltaTime;
    this.velocity.addScaledVector(this.velocity, damping[this.type]);

    this.collider.center.addScaledVector(this.velocity, deltaTime);
  }
}

export default Collidable;
