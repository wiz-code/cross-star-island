import EndPoint from './endpoint';
import Box from './box';

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
  constructor() {
    this.boxes = new Map();
    this.endPoints = [[], [], []];
    this.overlappings = [new Set(), new Set(), new Set()];
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

  updateObject(id, bb) {
    const box = this.boxes.get(id);

    const epMinX = box.min[0];
    const epMaxX = box.max[0];
    epMinX.value = bb.min.x;
    epMaxX.value = bb.max.x;

    const epMinY = box.min[1];
    const epMaxY = box.max[1];
    epMinY.value = bb.min.y;
    epMaxY.value = bb.max.y;

    const epMinZ = box.min[2];
    const epMaxZ = box.max[2];
    epMinZ.value = bb.min.z;
    epMaxZ.value = bb.max.z;
  }

  update() {
    this.pairs.clear();
    const [endPointsX, endPointsY, endPointsZ] = this.endPoints;

    insertionSort(endPointsX);
    insertionSort(endPointsY);
    insertionSort(endPointsZ);

    const [overlappingsX, overlappingsY, overlappingsZ] = this.overlappings;
    const pairsX = [];
    const pairsY = [];
    const pairsZ = [];

    for (let i = 0, l = endPointsX.length; i < l; i += 1) {
      const endPointX = endPointsX[i];

      if (endPointX.box.object.isAlive()) {
        if (endPointX.isMin) {
          for (const box of overlappingsX) {
            if (endPointX.box.overlapX(box)) {
              pairsX.push(endPointX.box, box);
            }
          }

          overlappingsX.add(endPointX.box);
        } else {
          overlappingsX.delete(endPointX.box);
        }
      }

      const endPointY = endPointsY[i];

      if (endPointY.box.object.isAlive()) {
        if (endPointY.isMin) {
          for (const box of overlappingsY) {
            if (endPointY.box.overlapY(box)) {
              pairsY.push(endPointY.box, box);
            }
          }

          overlappingsY.add(endPointY.box);
        } else {
          overlappingsY.delete(endPointY.box);
        }
      }

      const endPointZ = endPointsZ[i];

      if (endPointZ.box.object.isAlive()) {
        if (endPointZ.isMin) {
          for (const box of overlappingsZ) {
            if (endPointZ.box.overlapZ(box)) {
              pairsZ.push(endPointZ.box, box);
            }
          }

          overlappingsZ.add(endPointZ.box);
        } else {
          overlappingsZ.delete(endPointZ.box);
        }
      }
    }

    for (let i = 0, l = pairsX.length; i < l; i += 2) {
      const boxX1 = pairsX[i];
      const boxX2 = pairsX[i + 1];

      for (let j = 0, m = pairsY.length; j < m; j += 2) {
        const boxY1 = pairsY[j];
        const boxY2 = pairsY[j + 1];

        if (
          (boxX1 === boxY1 && boxX2 === boxY2) ||
          (boxX2 === boxY1 && boxX1 === boxY2)
        ) {
          for (let k = 0, n = pairsZ.length; k < n; k += 2) {
            const boxZ1 = pairsZ[k];
            const boxZ2 = pairsZ[k + 1];

            if (
              (boxX1 === boxZ1 && boxX2 === boxZ2) ||
              (boxX2 === boxZ1 && boxX1 === boxZ2)
            ) {
              this.pairs.add([boxX1.object, boxX2.object]);
              break;
            }
          }

          break;
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
