import { Sphere, Vector3 } from 'three';

import Collidable from './collidable';
import { Ammo as AmmoData } from './data';

const ammoData = new Map(AmmoData);

class Bullet extends Collidable {
  constructor(index, name, object) {
    super(name, 'ammo', object);

    this.data = ammoData.get(name);

    this.index = index;
    this.collider.set(
      new Vector3(0, this.index * this.data.radius * 2 - 1000, 0),
      this.data.radius,
    );
    this.elapsedTime = 0;

    this.setOnUpdate(this.data.update);
    this.setActive(false);
  }

  setActive(bool) {
    super.setActive(bool);
    this.elapsedTime = 0;
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.isActive()) {
      this.elapsedTime += deltaTime;

      if (this.elapsedTime > this.data.lifetime) {
        this.setActive(false);
      }
    }
  }
}

export default Bullet;
