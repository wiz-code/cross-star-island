import { Box3, Sphere, Vector3, Spherical } from 'three';

import Entity from './entity';
import { World } from './settings';
import { getVectorPos, visibleChildren } from './utils';

class Collidable extends Entity {
  #vec = new Vector3();

  #center = new Vector3();

  #bounceCount = 0;

  #keepVisible = false;

  constructor(name, type) {
    super(name, type);

    this.rotation = new Spherical();
    this.velocity = new Vector3();

    this.parent = null;
    this.vi
  }

  setCollider(collider = new Sphere()) {
    this.collider = collider;
  }

  setPosition(position, phi = 0, theta = 0) {
    const pos = getVectorPos(position);

    if (this.collider instanceof Sphere) {
      this.collider.center.copy(pos);
    } else if (this.collider instanceof Box3) {
      this.collider.getCenter(this.#center);
      this.#vec.subVectors(pos, this.#center);
      this.collider.translate(this.#vec);
    }

    this.rotation.phi = phi;
    this.rotation.theta = theta;

    if (this.object != null) {
      this.object.rotation.y = this.rotation.phi;
    }
  }

  setObject(object) {
    this.object = object;
  }

  keepVisible(bool) {
    this.#keepVisible = bool;
  }

  getBounceCount() {
    return this.#bounceCount;
  }

  addBounceCount() {
    this.#bounceCount += 1;
  }

  resetBounceCount() {
    this.#bounceCount = 0;
  }

  setAlive(bool = true) {
    super.setAlive(bool);

    if (bool) {
      this.#bounceCount = 0;
    }

    this.enableCollider(bool);

    if (this.#keepVisible && !bool) {
      return;
    }

    super.visible(bool);
  }

  update(deltaTime, elapsedTime, damping) {
    this.velocity.y -= World.gravity * deltaTime;
    this.velocity.addScaledVector(this.velocity, damping[this.type]);

    if (this.collider instanceof Sphere) {
      this.collider.center.addScaledVector(this.velocity, deltaTime);
    } else if (this.collider instanceof Box3) {
      this.#vec.copy(this.velocity).multiplyScalar(deltaTime);
      this.collider.translate(this.#vec);
    }
  }
}

export default Collidable;
