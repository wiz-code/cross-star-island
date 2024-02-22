import { Sphere, Vector3 } from 'three';

function noop() {}

class Collidable {
  #active = false;

  #bounced = false;

  #elapsedTime = 0;

  constructor(name, type, object = null) {
    this.name = name;
    this.type = type;

    if (object != null) {
      this.object = object;
    }

    this.collider = new Sphere();
    this.velocity = new Vector3();

    this.onUpdate = null;

    this.setActive(false);
  }

  setObject(object) {
    this.object = object;
  }

  getElapsedTime() {
    return this.#elapsedTime;
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
      this.#elapsedTime = 0;
      this.#bounced = false;
    }

    if (this.object != null) {
      this.object.children.forEach((mesh) => {
        mesh.visible = bool;
      });
    }
  }

  update(deltaTime) {
    if (this.#active) {
      this.#elapsedTime += deltaTime;

      if (this.onUpdate != null) {
        this.onUpdate(deltaTime);
      }
    }
  }
}

export default Collidable;
