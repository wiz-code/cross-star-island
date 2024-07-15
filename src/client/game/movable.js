import { Box3, Vector3 } from 'three';

import { Game } from './settings';
import Publisher from './publisher';
import Entity from './entity';
import { getVerticesPos } from './utils';
import { States } from './data';

class Movable extends Entity {
  #currentPos = new Vector3();

  #prevPos = new Vector3();

  constructor(name, offset, count) {
    super(name, 'movable');

    this.velocity = new Vector3();

    this.geometry = null;
    this.offset = 0;
    this.count = 0;

    this.setAlive();
  }

  setGeometry(geometry, offset, count, object) {
    this.geometry = geometry;
    this.offset = offset;
    this.count = count;
    this.object = object;
  }

  setVelocity(vec) {
    this.velocity.copy(vec);
  }

  visible(bool = true) {
    //
  }

  dispose() {
    this.params = null;

    this.geometry = null;
    this.offset = 0;
    this.count = 0;
    this.object = null;

    // リスナーを全削除
    this.clear();
  }

  update() {
    const positions = this.geometry.getAttribute('position').array;
    const index = this.offset * 3;
    const [x, y, z] = positions.subarray(index, index + 3);
    this.#currentPos.set(x, y, z);

    if (this.velocity == null) {
      this.velocity = new Vector3();
      return;
    }

    this.velocity
      .subVectors(this.#currentPos, this.#prevPos)
      .divideScalar(Game.stepsPerFrame);
    this.#prevPos.copy(this.#currentPos);
  }
}

export default Movable;
