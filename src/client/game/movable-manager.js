import { Box3, Vector3, Sphere } from 'three';

import { Game, World } from './settings';
import Publisher from './publisher';
// import {  } from './utils';

const { sqrt, cos, PI } = Math;

class MovableManager extends Publisher {
  constructor(game) {
    super();

    this.bvh = null;
    this.refitSet = new Set();
    this.list = new Map();
  }

  setBVH(bvh) {
    this.bvh = bvh;
    this.geometry = this.bvh.geometry;
    this.boundsTree = this.bvh.boundsTree;
    this.data = this.geometry.userData;
  }

  addObject(movable) {
    if (this.bvh != null) {
      const map = this.data.movableBVH;
      const data = map.get(movable.name);
      movable.setGeometry(this.geometry, data.offset, data.count, data.object);
      this.list.set(movable.name, movable);
    }
  }

  removeObject() {}

  update() {
    for (const movable of this.list.values()) {
      movable.update();
    }

    if (this.refitSet.size > 0) {
      this.bvh.boundsTree.refit(this.refitSet);
      this.refitSet.clear();
    }
  }
}

export default MovableManager;
