import Publisher from './publisher';
import { visibleChildren } from './utils';
import { States } from './data';

let id = 0;

function genId() {
  id += 1;
  return id;
}

class Entity extends Publisher {
  #states = new Set();

  constructor(name, type) {
    super();

    this.id = `${type}-${genId()}`;

    this.name = name;
    this.type = type;

    this.params = null;

    this.object = null;
    this.collider = null;
    this.velocity = null;
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

  visible(bool) {
    if (this.object != null) {
      visibleChildren(this.object, bool);
    }
  }

  // 関数が渡された場合、実行結果を返す
  setParams(params) {
    if (typeof params === 'function') {
      const result = params(this);
      this.params = params;
      return;
    }

    this.params = params;
  }

  update() {
    //
  }
}

export default Entity;
