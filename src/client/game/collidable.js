import { Sphere, Vector3 } from 'three';

import Publisher from './publisher';
import { World } from './settings';
import { getVectorPos, visibleChildren } from './utils';

let id = 0;

function genId() {
  id += 1;
  return id;
}

class Collidable extends Publisher {
  #alive = false;

  #bounced = false;

  constructor(name, type, object = null) {
    super();

    this.id = `${type}-${genId()}`;

    this.name = name;
    this.type = type;

    this.object = object;

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

  isAlive() {
    return this.#alive;
  }

  setAlive(bool = true) {
    this.#alive = bool;

    if (bool) {
      this.#bounced = false;
    }

    if (this.object != null) {
      visibleChildren(this.object, bool);
    }
  }

  addTweener(tweener, arg) {
    const tween = tweener(this, arg);
    const updater = tween.update.bind(tween);
    this.subscribe('tween', updater);
  }

  update(deltaTime, elapsedTime, damping) {
    if (this.#alive) {
      this.velocity.y -= World.gravity * deltaTime;
      this.velocity.addScaledVector(this.velocity, damping[this.type]);

      this.collider.center.addScaledVector(this.velocity, deltaTime);
    }
  }
}

export default Collidable;
