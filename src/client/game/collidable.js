import { Sphere, Vector3 } from 'three';

import Entity from './entity';
import { World } from './settings';
import { getVectorPos, visibleChildren } from './utils';

let id = 0;

function genId() {
  id += 1;
  return id;
}

class Collidable extends Entity {
  #bounced = false;

  constructor(name, type, object = null) {
    super(name, type);

    /*this.id = `${type}-${genId()}`;

    this.name = name;
    this.type = type;

    this.params = null;*/
    this.object = object;

    this.collider = new Sphere();
    this.velocity = new Vector3();
  }

  setPosition(position) {
    const pos = getVectorPos(position);
    this.collider.center.copy(pos);
  }

  setObject(object) {
    this.object = object;
  }

  isBounced() {
    return this.#bounced;
  }

  setBounced(bool) {
    this.#bounced = bool;
  }

  /*isAlive() {
    return this.#alive;
  }*/

  setAlive(bool = true) {
    //this.#alive = bool;
    super.setAlive(bool);

    if (bool) {
      this.#bounced = false;
    }

    super.visible(bool);
    /*if (this.object != null) {
      visibleChildren(this.object, bool);
    }*/
  }

  /*// 関数が渡された場合、実行結果を返す
  setParams(params) {
    if (typeof params === 'function') {
      const result = params(this);
      this.params = params;
      return;
    }

    this.params = params;
  }*/

  update(deltaTime, elapsedTime, damping) {
    if (!this.isAlive()) {
      return;
    }

    this.velocity.y -= World.gravity * deltaTime;
    this.velocity.addScaledVector(this.velocity, damping[this.type]);

    this.collider.center.addScaledVector(this.velocity, deltaTime);
  }
}

export default Collidable;
