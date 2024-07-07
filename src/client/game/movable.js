import Publisher from './publisher';
import Entity from './entity';
import { getVerticesPos } from './utils';
import { States } from './data';



class Movable extends Entity {

  constructor(name) {
    super(name, 'movable');

    this.data = null;
    this.geometry = null;
    this.offset = 0;
    this.count = 0;

    this.setAlive();

  }

  setGeometry(geometry) {
    this.geometry = geometry;
    const map = geometry.userData.movableBVH;
    this.data = map.get(this.name);
  }

  visible(bool = true) {
    //
  }

  dispose() {
    this.params = null;
    this.geometry = null;
    this.offset = 0;
    this.count = 0;

    // リスナーを全削除
    this.clear();
  }

  update() {
    //
  }
}

export default Movable;
