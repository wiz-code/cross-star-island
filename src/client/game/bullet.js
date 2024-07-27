import { Vector3, Sphere, Box3 } from 'three';

import Collidable from './collidable';
import { Ammos } from './data';

const ammos = new Map(Ammos);

class Bullet extends Collidable {
  constructor(index, name, object) {
    super(name, 'ammo');

    this.data = ammos.get(name);
    this.sideDir = new Vector3();
    this.setObject(object);

    this.index = index;
    const distributed = -this.index * this.data.radius * 2 - 1000;

    if (this.data.collider === 'sphere') {
      this.setCollider(
        new Sphere(
          new Vector3(distributed, distributed, distributed),
          this.data.radius,
        ),
      );
    } else if (this.data.collider === 'box3') {
      const boundingBox = new Box3();
      const sphere = new Sphere(
        new Vector3(distributed, distributed, distributed),
        this.data.radius,
      );
      sphere.getBoundingBox(boundingBox);

      this.setCollider(boundingBox);
    }

    this.elapsedTime = 0;
  }

  setAlive(bool) {
    super.setAlive(bool);
    this.elapsedTime = 0;
  }

  update(deltaTime, elapsedTime, damping) {
    super.update(deltaTime, elapsedTime, damping);

    if (this.isAlive()) {
      this.elapsedTime += deltaTime;

      if (this.elapsedTime > this.data.lifetime) {
        this.setAlive(false);
      }
    }
  }
}

export default Bullet;
