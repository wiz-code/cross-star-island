import { Box3, Vector3, Sphere } from 'three';

import { Game, World } from './settings';
import Publisher from './publisher';
// import {  } from './utils';

const { sqrt, cos, PI } = Math;

class MovableManager extends Publisher {
  constructor(game) {
    super();

    this.bvh = null;
    this.geometry = null;
    this.boundsTree = null;
    this.data = null;
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

  removeObject(movable) {
    if (this.list.has(movable.name)) {
      movable.clearObject();
      this.list.delete(movable.name);
    }
  }

  clearBVH() {
    this.bvh = null;
    this.refitSet.clear();
    this.list.clear();

    this.geometry = null;
    this.boundsTree = null;
    this.data = null;
  }

  dispose() {
    this.clearBVH();
    this.clear();
  }

  update() {
    if (this.bvh == null) {
      return;
    }

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
