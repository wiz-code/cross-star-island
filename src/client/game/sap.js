import { Box3 } from 'three';
import EndPoint from './endpoint';
import Box from './box';
import { Game } from './settings';
import { getCapsuleBoundingBox } from './utils';

const Dimensions = 3;
const UpdatePerFrame = 60 * Game.stepsPerFrame;

const insertionSort = (endPoints) => {
  for (let i = 1, l = endPoints.length; i < l; i += 1) {
    for (let j = i - 1; j >= 0; j -= 1) {
      const ep1 = endPoints[j];
      const ep2 = endPoints[j + 1];

      if (ep1.value < ep2.value) {
        break;
      }

      endPoints[j] = ep2;
      endPoints[j + 1] = ep1;
    }
  }

  return endPoints;
};

const getKey = (ep1, ep2) => {
  const id1 = ep1.box.id;
  const id2 = ep2.box.id;

  if (id1 < id2) {
    return `${id1}-${id2}`;
  } else {
    return `${id2}-${id1}`;
  }
};

class SweepAndPrune {
  #box = new Box3();

  #overlaps = Array(Dimensions).fill().map(() => new Map());

  #order = Array(Dimensions).fill().map((value, index) => index);

  #tickCount = 0;

  constructor() {
    this.boxes = new Map();
    this.endPoints = Array(Dimensions).fill().map(() => ([]));
    this.pairs = new Set();

    this.onAdd = this.onAdd.bind(this);
    this.onRemove = this.onRemove.bind(this);
  }

  addObject(object, bb) {
    const epMinX = new EndPoint(bb.min.x, true);
    const epMaxX = new EndPoint(bb.max.x, false);
    const epMinY = new EndPoint(bb.min.y, true);
    const epMaxY = new EndPoint(bb.max.y, false);
    const epMinZ = new EndPoint(bb.min.z, true);
    const epMaxZ = new EndPoint(bb.max.z, false);

    const box = new Box(epMinX, epMinY, epMinZ, epMaxX, epMaxY, epMaxZ);
    box.object = object;

    epMinX.box = box;
    epMaxX.box = box;
    epMinY.box = box;
    epMaxY.box = box;
    epMinZ.box = box;
    epMaxZ.box = box;
    this.boxes.set(object.id, box);

    const [endPointsX, endPointsY, endPointsZ] = this.endPoints;
    endPointsX.push(epMinX, epMaxX);
    endPointsY.push(epMinY, epMaxY);
    endPointsZ.push(epMinZ, epMaxZ);

    return box;
  }

  updateObject(object) {
    if (object.collider instanceof Box3) {
      this.#box.copy(object.collider);
    } else {
      object.collider.getBoundingBox(this.#box);
    }

    const box = this.boxes.get(object.id);

    const epMinX = box.min[0];
    const epMaxX = box.max[0];
    epMinX.value = this.#box.min.x;
    epMaxX.value = this.#box.max.x;

    const epMinY = box.min[1];
    const epMaxY = box.max[1];
    epMinY.value = this.#box.min.y;
    epMaxY.value = this.#box.max.y;

    const epMinZ = box.min[2];
    const epMaxZ = box.max[2];
    epMinZ.value = this.#box.min.z;
    epMaxZ.value = this.#box.max.z;
  }

  sortByVariance() {
    const variances = [];

    for (let i = 0, l = this.endPoints.length; i < l; i += 1) {
      const endPoints = this.endPoints[i];
      const len = endPoints.length;
      let sum = 0;

      for (let j = 0; j < len; j += 1) {
        const { value } = endPoints[j];
        sum += value;
      }

      const avg = sum / len;
      let diff2Sum = 0;

      for (let j = 0; j < len; j += 1) {
        const { value } = endPoints[j];
        const diff2 = (value - avg) ** 2;
        diff2Sum += diff2;
      }

      const variance = diff2Sum / len;

      variances.push([variance, i]);
    }

    variances.sort(([v1], [v2]) => v2 - v1);

    for (let i = 0, l = variances.length; i < l; i += 1) {
      this.#order[i] = variances[i][1];
    }
  }

  update() {
    if (this.#tickCount % UpdatePerFrame === 0) {
      this.sortByVariance();
    }

    this.#tickCount += 1;
    this.pairs.clear();
    let leastSize, leastSizeIndex;

    for (let i = 0, l = this.#order.length; i < l; i += 1) {
      const order = this.#order[i];
      const endPoints = this.endPoints[order];
      const overlaps = this.#overlaps[order];

      for (let j = 1, m = endPoints.length; j < m; j += 1) {
        for (let k = j - 1; k >= 0; k -= 1) {
          if (endPoints[k].value < endPoints[k + 1].value) {
            break;
          }

          const ep2 = endPoints[k];
          const ep1 = endPoints[k + 1];

          endPoints[k] = ep1;
          endPoints[k + 1] = ep2;

          if (ep1.isMin && !ep2.isMin) {
            overlaps.set(getKey(ep1, ep2), [ep1, ep2]);
          } else if (!ep1.isMin && ep2.isMin) {
            overlaps.delete(getKey(ep1, ep2));
          }
        }
      }

      if (i === 0 || overlaps.size < leastSize) {
        leastSize = overlaps.size;
        leastSizeIndex = order;
      }
    }

    const leastSizeOverlaps = this.#overlaps[leastSizeIndex];
    const restOverlaps = [];

    for (let i = 0, l = this.#order.length; i < l; i += 1) {
      if (i !== leastSizeIndex) {
        restOverlaps.push(this.#overlaps[i]);
      }
    }

    for (const [key, [ep1, ep2]] of leastSizeOverlaps.entries()) {
      if (restOverlaps.every((overlaps) => overlaps.has(key))) {
        this.pairs.add([ep1.box.object, ep2.box.object]);
      }
    }
  }

  removeObject(object) {
    const box = this.boxes.get(object.id);

    this.endPoints.forEach((endPoints, index) => {
      const filtered = endPoints.filter((endPoint) => endPoint.box !== box);
      this.endPoints[index] = filtered;
    });

    this.boxes.delete(object.id);
  }

  onAdd() {}

  onRemove() {}
}

export default SweepAndPrune;
