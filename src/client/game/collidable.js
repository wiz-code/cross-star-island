import { Sphere, Vector3 } from 'three';

import Entity from './entity';
import { World } from './settings';
import { getVectorPos, visibleChildren } from './utils';

class Collidable extends Entity {
  #bounced = false;

  constructor(name, type) {
    super(name, type);

    this.collider = new Sphere();
    this.velocity = new Vector3();
  }

  setPosition(position) {
    const pos = getVectorPos(position);
    this.collider.center.copy(pos);
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

  update(deltaTime, elapsedTime, damping) {
    if (!this.isAlive()) {
      return;
    }

    this.velocity.y -= World.gravity * deltaTime;
    this.velocity.addScaledVector(this.velocity, damping[this.type]);

    this.collider.center.addScaledVector(this.velocity, deltaTime);
  }
}

export default Collidable;
