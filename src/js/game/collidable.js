import { Sphere, Vector3 } from 'three';

import Publisher from './publisher';
import { World } from './settings';

let id = 0;

function genId() {
  id += 1;
  return id;
}

class Collidable extends Publisher {
  #active = false;

  #bounced = false;

  constructor(name, type, object = null) {
    super();

    this.id = `${type}-${genId()}`;

    this.name = name;
    this.type = type;

    this.object = object;

    this.collider = new Sphere();
    this.velocity = new Vector3();

    this.onUpdate = null;
  }

  setObject(object) {
    this.object = object;
  }

  setOnUpdate(update) {
    this.onUpdate = update.bind(this);
  }

  isBounced() {
    return this.#bounced;
  }

  setBounced(bool) {
    this.#bounced = bool;
  }

  isActive() {
    return this.#active;
  }

  setActive(bool = true) {
    this.#active = bool;

    if (bool) {
      this.#bounced = false;
    }

    if (this.object != null) {
      this.object.children.forEach((mesh) => {
        mesh.visible = bool;
      });
    }
  }

  addTweener(tweener, arg) {
    const tween = tweener(this, arg);
    const updater = tween.update.bind(tween);
    this.subscribe('tween', updater);
  }

  update(deltaTime, elapsedTime, damping) {
    if (this.#active) {
      this.velocity.y -= World.gravity * deltaTime;
      this.velocity.addScaledVector(this.velocity, damping[this.type]);

      this.collider.center.addScaledVector(this.velocity, deltaTime);

      if (this.onUpdate != null) {
        this.onUpdate(deltaTime, elapsedTime);
      }

      if (this.getSubscriberCount() > 0) {
        this.publish('tween', elapsedTime * 1000);
      }
    }
  }
}

export default Collidable;
