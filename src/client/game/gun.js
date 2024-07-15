import { Vector3, Euler } from 'three';

import { Guns } from './data';
import Publisher from './publisher';

const { random, PI } = Math;
const Rad1 = PI / 180;

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
    this.currentAmmo = null;
    this.ammos = new Map();
    this.fireAt = performance.now();
  }

  setAmmoType(ammoType) {
    if (this.ammos.has(ammoType)) {
      this.currentAmmo = this.ammos.get(ammoType);
    }
  }

  fire(character, game) {
    if (this.currentAmmo == null) {
      return;
    }

    const now = performance.now();

    if (now - this.fireAt < this.data.fireInterval) {
      return;
    }

    if (character.hasControls && character.game.methods.has('play-sound')) {
      character.game.methods.get('play-sound')('shot');
    }

    this.fireAt = now;

    const { rotation, povRotation } = character;
    const bullet = this.currentAmmo.list[this.currentAmmo.index];
    bullet.setAlive(true);

    const halfRad = (this.data.accuracy / 2) * Rad1;
    const theta = getRandomInclusive(-halfRad, halfRad);
    const phi = getRandomInclusive(-halfRad, halfRad);

    this.#euler.x = povRotation.theta + rotation.theta + theta;
    this.#euler.y = povRotation.phi + rotation.phi + phi;
    const dir = this.#dir.clone().applyEuler(this.#euler);
    bullet.object.rotation.copy(this.#euler);

    bullet.collider.center
      .copy(character.collider.end)
      .addScaledVector(dir, character.data.radius + bullet.data.radius);

    bullet.velocity.copy(dir).multiplyScalar(this.data.speed);
    bullet.velocity.addScaledVector(character.velocity, 2);

    this.currentAmmo.index =
      (this.currentAmmo.index + 1) % this.currentAmmo.list.length;
  }

  update(deltaTime) {
    //
  }
}

export default Gun;
