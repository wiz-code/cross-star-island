import Publisher from './publisher';
import { genId, visibleChildren, disposeObject } from './utils';
import { States } from './data';

class Entity extends Publisher {
  #states = new Set();

  constructor(name, type) {
    super();

    this.id = genId(type);

    this.name = name;
    this.type = type;

    this.params = null;
    this.colliderEnabled = true;

    this.object = null;
    this.collider = null;
    this.velocity = null;
  }

  getStates() {
    return this.#states;
  }

  isAlive() {
    return this.#states.has(States.alive);
  }

  setAlive(bool = true) {
    if (bool) {
      this.#states.add(States.alive);
    } else {
      this.#states.delete(States.alive);
    }
  }

  enableCollider(bool) {
    this.colliderEnabled = bool;
  }

  visible(bool) {
    if (this.object != null) {
      visibleChildren(this.object, bool);
    }
  }

  // 関数が渡された場合、実行結果を返す
  setParams(params) {
    if (typeof params === 'function') {
      this.params = params(this);
      return;
    }

    this.params = params;
  }

  dispose() {
    if (this.object != null) {
      this.object.traverse(disposeObject);
    }

    // リスナーを全削除
    this.clear();
  }

  update() {
    //
  }
}

export default Entity;
