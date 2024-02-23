import { Sphere, Vector3 } from 'three';

import Publisher from './publisher';

function noop() {}

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

    if (object != null) {
      this.object = object;
    }

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

  update(deltaTime, elapsedTime) {
    if (this.#active && this.onUpdate != null) {
      this.onUpdate(deltaTime, elapsedTime);
    }
  }
}

export default Collidable;
