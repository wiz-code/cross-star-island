import { Box3, Vector3, Sphere } from 'three';

import { Game, World } from './settings';
import Publisher from './publisher';
// import {  } from './utils';

const { sin, cos, PI } = Math;

const coefX = 1;
const coefY = 5;
const offsetX = 0.08;
const offsetY = 0.02;

const frequencies = [2, -3, 5, -8, 12];
const fluctuation = (...tList) => {
  const len = frequencies.length;
  const sums = [];

  for (let i = 0, l = tList.length; i < l; i += 1) {
    const t = tList[i];
    let sum = 0;

    for (let j = 0; j < len; j += 1) {
      const f = frequencies[j];
      const amplitude = (1 / f) * sin(f * t);
      sum += amplitude;
    }

    sums.push(sum / len);
  }

  return sums;
};

class GridProcessor extends Publisher {
  #vec = new Vector3();

  constructor(game) {
    super();

    this.set = new Set();
  }

  addObject(grid) {
    this.set.add(grid);
  }

  addList(grids) {
    grids.forEach((grid) => this.addObject(grid));
  }

  removeObject(grid) {
    this.set.delete(grid);
  }

  update(elapsedTime) {
    const [fx, fy] = fluctuation(elapsedTime * coefX, elapsedTime * coefY);

    for (const grid of this.set) {
      const { position } = grid;
      const diff = fx * offsetX;
      this.#vec.set(diff, fy * offsetY, diff * 0.5);
      position.add(this.#vec);
    }
  }
}

export default GridProcessor;
