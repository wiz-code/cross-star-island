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
const fluctuation = (t) => {
  let sum = 0;
  const len = frequencies.length;

  for (let i = 0; i < len; i += 1) {
    const f = frequencies[i];
    const amplitude = 1 / f * sin(f * t);
    sum += amplitude;
  }

  return sum / len;
};

class GridProcessor extends Publisher {
  #t = 0;
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

  update(deltaTime) {
    this.#t += deltaTime;

    const fx = fluctuation(this.#t * coefX);
    const fy = fluctuation(this.#t * coefY);

    for (const grid of this.set) {
      const position = grid.position;
      const diff = fx * offsetX;
      this.#vec.set(
        diff,
        fy * offsetY,
        diff * 0.5
      );
      position.add(this.#vec);
    }
  }
}

export default GridProcessor;
