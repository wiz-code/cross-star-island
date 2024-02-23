import { Sphere, Vector3, Euler } from 'three';

import { Ammo as AmmoData, Guns } from './data';
import Publisher from './publisher';

const { random, PI } = Math;
const Rad_1 = PI / 180;

const gunData = new Map(Guns);

const getRandomInclusive = (min, max) => random() * (max - min) + min;

class Gun extends Publisher {
  #dir = new Vector3(0, 0, -1);

  #euler = new Euler(0, 0, 0, 'YXZ');

  constructor(name) {
    super();

    if (!gunData.has(name)) {
      throw new Error('gun data not found');
    }

    this.name = name;
    this.type = 'gun';
    this.data = gunData.get(name);
    this.ammo = null;
    this.fireAt = performance.now();
  }

  setAmmo(ammo) {
    if (!this.data.ammoTypes.includes(ammo.name)) {
      return;
    }

    this.ammo = ammo;
  }

  fire(character) {
    if (this.ammo == null) {
      return;
    }

    const now = performance.now();

    if (now - this.fireAt < this.data.fireInterval) {
      return;
    }

    this.fireAt = now;

    const { rotation, povRotation, deltaY } = character;
    const bullet = this.ammo.list[this.ammo.index];
    bullet.setActive(true);

    const halfRad = (this.data.accuracy / 2) * Rad_1;
    const theta = getRandomInclusive(-halfRad, halfRad);
    const phi = getRandomInclusive(-halfRad, halfRad);

    this.#euler.x = povRotation.theta + rotation.theta + deltaY + theta;
    this.#euler.y = povRotation.phi + rotation.phi + phi;
    const dir = this.#dir.clone().applyEuler(this.#euler);
    bullet.object.rotation.copy(this.#euler);

    bullet.collider.center
      .copy(character.collider.end)
      .addScaledVector(dir, character.data.radius + bullet.data.radius);

    bullet.velocity.copy(dir).multiplyScalar(this.data.speed);
    bullet.velocity.addScaledVector(character.velocity, 2);

    this.ammo.index = (this.ammo.index + 1) % this.ammo.list.length;
  }

  update(deltaTime) {
    //
  }
}

export default Gun;
