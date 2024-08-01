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
  #bb = new Box3();

  #overlappings1 = new Map();/////
  #overlappings2 = new Map();////
  #overlappings3 = new Map();/////
  #overlaps = Array(Dimensions).fill().map(() => new Map());

  #overlappings = new Set();

  #intersections = [new Set(), new Set()];

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
      this.#bb.copy(object.collider);
    } else {
      object.collider.getBoundingBox(this.#bb);
    }

    const box = this.boxes.get(object.id);

    const epMinX = box.min[0];
    const epMaxX = box.max[0];
    epMinX.value = this.#bb.min.x;
    epMaxX.value = this.#bb.max.x;

    const epMinY = box.min[1];
    const epMaxY = box.max[1];
    epMinY.value = this.#bb.min.y;
    epMaxY.value = this.#bb.max.y;

    const epMinZ = box.min[2];
    const epMaxZ = box.max[2];
    epMinZ.value = this.#bb.min.z;
    epMaxZ.value = this.#bb.max.z;
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
    /*const endPoints1 = this.endPoints[this.#order[0]];
    const endPoints2 = this.endPoints[this.#order[1]];
    const endPoints3 = this.endPoints[this.#order[2]];
    const [intersection1, intersection2] = this.#intersections;

    //insertionSort(endPoints1);
    //insertionSort(endPoints2);
    //insertionSort(endPoints3);

    intersection1.clear();
    intersection2.clear();

    this.#overlappings1.clear();
    this.#overlappings2.clear();
    this.#overlappings3.clear();*/

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

    /*for (let i = 1, l = endPoints1.length; i < l; i += 1) {
      for (let j = i - 1; j >= 0; j -= 1) {
        if (endPoints1[j].value < endPoints1[j + 1].value) {
          break;
        }

        const ep2 = endPoints1[j];
        const ep1 = endPoints1[j + 1];

        endPoints1[j] = ep1;
        endPoints1[j + 1] = ep2;

        if (ep1.isMin && !ep2.isMin) {
          this.#overlappings1.set(getKey(ep1, ep2), [ep1, ep2]);
        } else if (!ep1.isMin && ep2.isMin) {
          this.#overlappings1.delete(getKey(ep1, ep2));
        }
      }
    }
//console.log('1', this.#overlappings1.size)
    for (let i = 1, l = endPoints2.length; i < l; i += 1) {
      for (let j = i - 1; j >= 0; j -= 1) {
        if (endPoints2[j].value < endPoints2[j + 1].value) {
          break;
        }

        const ep2 = endPoints2[j];
        const ep1 = endPoints2[j + 1];

        endPoints2[j] = ep1;
        endPoints2[j + 1] = ep2;

        if (ep1.isMin && !ep2.isMin) {
          this.#overlappings2.set(getKey(ep1, ep2), [ep1, ep2]);
        } else if (!ep1.isMin && ep2.isMin) {
          this.#overlappings2.delete(getKey(ep1, ep2));
        }
      }
    }
//console.log('2', this.#overlappings2.size)
    for (let i = 1, l = endPoints3.length; i < l; i += 1) {
      for (let j = i - 1; j >= 0; j -= 1) {
        if (endPoints3[j].value < endPoints3[j + 1].value) {
          break;
        }

        const ep2 = endPoints3[j];
        const ep1 = endPoints3[j + 1];

        endPoints3[j] = ep1;
        endPoints3[j + 1] = ep2;

        if (ep1.isMin && !ep2.isMin) {
          this.#overlappings3.set(getKey(ep1, ep2), [ep1, ep2]);
        } else if (!ep1.isMin && ep2.isMin) {
          this.#overlappings3.delete(getKey(ep1, ep2));
        }
      }
    }
//console.log('3', this.#overlappings3.size)*/
    const leastSizeOverlaps = this.#overlaps[leastSizeIndex];
    const restOverlaps = [];

    for (let i = 0, l = this.#order.length; i < l; i += 1) {
      if (i !== leastSizeIndex) {
        restOverlaps.push(this.#overlaps[i]);
      }
    }

    for (const [key, [ep1, ep2]] of leastSizeOverlaps.entries()) {
      const [overlaps1, overlaps2] = restOverlaps;

      if (restOverlaps.every((overlaps) => overlaps.has(key))) {
        this.pairs.add([ep1.box.object, ep2.box.object]);
      }
      /*if (overlaps1.has(key) && overlaps2.has(key)) {
        this.pairs.add([ep1.box.object, ep2.box.object]);
      }*/
    }


    /*for (let i = 0, l = endPoints1.length; i < l; i += 1) {
      const { isMin, box: epBox } = endPoints1[i];

      if (isMin) {
        for (const box of this.#overlappings) {
          if (epBox.overlapX(box)) {
            intersection1.add(epBox).add(box);
          }
        }

        this.#overlappings.add(epBox);
      } else {
        this.#overlappings.delete(epBox);
      }
    }

    if (intersection1.size === 0) {
      return;
    }

    for (let i = 0, l = endPoints2.length; i < l; i += 1) {
      const { isMin, box: epBox } = endPoints2[i];

      if (intersection1.has(epBox)) {
        // X軸で交差していないBoxは除外
        if (isMin) {
          for (const box of this.#overlappings) {
            if (epBox.overlapY(box)) {
              intersection2.add(epBox).add(box);
            }
          }

          this.#overlappings.add(epBox);
        } else {
          this.#overlappings.delete(epBox);
        }
      }
    }

    if (intersection2.size === 0) {
      return;
    }

    for (let i = 0, l = endPoints3.length; i < l; i += 1) {
      const { isMin, box: epBox } = endPoints3[i];

      if (intersection2.has(epBox)) {
        // X, Y軸で交差していないBoxは除外
        if (isMin) {
          for (const box of this.#overlappings) {
            if (epBox.overlapZ(box)) {
              this.pairs.add([epBox.object, box.object]);
            }
          }

          this.#overlappings.add(epBox);
        } else {
          this.#overlappings.delete(epBox);
        }
      }
    }*/
  }

  /*update() {
    this.pairs.clear();
    const [endPointsX, endPointsY, endPointsZ] = this.endPoints;
    const [intersectionX, intersectionY, intersectionZ] = this.#intersections;

    insertionSort(endPointsX);
    insertionSort(endPointsY);
    insertionSort(endPointsZ);

    intersectionX.clear();
    intersectionY.clear();
    intersectionZ.clear();

    for (let i = 0, l = endPointsX.length; i < l; i += 1) {
      const { isMin, box: epBox } = endPointsX[i];

      if (isMin) {
        for (const box of this.#overlappings) {
          if (epBox.overlapX(box)) {
            intersectionX.add(epBox).add(box);
          }
        }

        this.#overlappings.add(epBox);
      } else {
        this.#overlappings.delete(epBox);
      }
    }

    if (intersectionX.size === 0) {
      return;
    }

    for (let i = 0, l = endPointsY.length; i < l; i += 1) {
      const { isMin, box: epBox } = endPointsY[i];

      if (intersectionX.has(epBox)) {
        // X軸で交差していないBoxは除外
        if (isMin) {
          for (const box of this.#overlappings) {
            if (epBox.overlapY(box)) {
              intersectionY.add(epBox).add(box);
            }
          }

          this.#overlappings.add(epBox);
        } else {
          this.#overlappings.delete(epBox);
        }
      }
    }

    if (intersectionY.size === 0) {
      return;
    }

    for (let i = 0, l = endPointsZ.length; i < l; i += 1) {
      const { isMin, box: epBox } = endPointsZ[i];

      if (intersectionY.has(epBox)) {
        // X, Y軸で交差していないBoxは除外
        if (isMin) {
          for (const box of this.#overlappings) {
            if (epBox.overlapZ(box)) {
              this.pairs.add([epBox.object, box.object]);
            }
          }

          this.#overlappings.add(epBox);
        } else {
          this.#overlappings.delete(epBox);
        }
      }
    }
  }*/

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
