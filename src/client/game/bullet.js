import { Vector3 } from 'three';

import Collidable from './collidable';
import { Ammos } from './data';

const ammos = new Map(Ammos);

class Bullet extends Collidable {
  constructor(index, name, object) {
    super(name, 'ammo');

    this.data = ammos.get(name);
    this.setObject(object);

    this.index = index;
    this.collider.set(
      new Vector3(0, this.index * this.data.radius * 2 - 1000, 0),
      this.data.radius,
    );
    this.elapsedTime = 0;
    this.owner = null;

    this.setAlive(false);
  }

  setAlive(bool) {
    super.setAlive(bool);
    this.elapsedTime = 0;
    this.owner = null;
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
