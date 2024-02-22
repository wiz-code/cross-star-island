import { Sphere, Vector3 } from 'three';

import { Ammo as AmmoData } from './data';

class Bullet {
  #active = false;

  #elapsedTime = 0;

  #bounced = false;

  constructor(index, object, data) {
    this.index = index;
    this.name = data.name;
    this.type = 'ammo';
    this.object = object;
    this.collider = new Sphere(
      new Vector3(0, this.index * data.radius * 2 - 1000, 0),
      data.radius
    );
    this.velocity = new Vector3();

    this.radius = data.radius;
    this.weight = data.weight;
    this.speed = data.speed;
    this.rotateSpeed = data.rotateSpeed;

    this.lifetime = data.lifetime;

    this.onUpdate = data.update.bind(this);

    this.setActive(false);
  }

  getElapsedTime() {
    return this.#elapsedTime;
  }

  setBounced(bool) {
    this.#bounced = bool;
  }

  isBounced() {
    return this.#bounced;
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

    this.object.children.forEach((mesh) => {
      mesh.visible = bool;
    });
  }

  update(deltaTime) {
    if (this.#active) {
      if (this.#elapsedTime > this.lifetime) {
        this.setActive(false);
        return;
      }

      this.#elapsedTime += deltaTime;
      this.onUpdate(deltaTime);
    }
  }
}

export default Bullet;
