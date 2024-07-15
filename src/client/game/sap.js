import { Box3 } from 'three';
import EndPoint from './endpoint';
import Box from './box';
import { getCapsuleBoundingBox } from './utils';

const insertionSort = (endPoints) => {
  for (let i = 1, l = endPoints.length; i < l; i += 1) {
    for (let j = i - 1; j >= 0; j -= 1) {
      if (endPoints[j].value < endPoints[j + 1].value) {
        break;
      }

      const ep1 = endPoints[j];
      const ep2 = endPoints[j + 1];

      endPoints[j] = ep2;
      endPoints[j + 1] = ep1;
    }
  }

  return endPoints;
};

class SweepAndPrune {
  #bb = new Box3();

  #overlappings = new Set();

  #intersections = [new Set(), new Set(), new Set()];

  constructor() {
    this.boxes = new Map();
    this.endPoints = [[], [], []];
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

    insertionSort(endPointsX);
    insertionSort(endPointsY);
    insertionSort(endPointsZ);

    return box;
  }

  updateObject(object) {
    object.collider.getBoundingBox(this.#bb);

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

  update() {
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
