import { Sphere, Vector3 } from 'three';

import { Ammo as AmmoData } from './data';

class Bullet {
  #active = false;

  #startTime = 0;

  #elapsedTime = 0;

  constructor(index, object, data) {
    this.index = index;
    this.name = data.name;
    this.type = 'ammo';
    this.object = object;
    (this.collider = new Sphere(
      new Vector3(0, this.index * data.radius * 2 - 1000, 0),
      data.radius,
    )),
      (this.velocity = new Vector3());
    this.radius = data.radius;
    this.weight = data.weight;
    this.speed = data.speed;
    this.rotateSpeed = data.rotateSpeed;

    this.duration = data.duration;

    this.onUpdate = data.update.bind(this);

    this.setActive(false);
  }

  getElapsedTime() {
    return this.#elapsedTime;
  }

  isActive() {
    return this.#active;
  }

  setActive(bool = true) {
    this.#active = bool;

    if (bool) {
      this.#startTime = 0;
      this.#elapsedTime = 0;
    }

    this.object.children.forEach((mesh) => {
      mesh.visible = bool;
    });
  }

  update(deltaTime) {
    if (this.#active) {
      if (this.#elapsedTime > this.duration) {
        this.setActive(false);
        return;
      }

      this.#elapsedTime += deltaTime;
      this.onUpdate(deltaTime);
    }
  }
}

export default Bullet;
