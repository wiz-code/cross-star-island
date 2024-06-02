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
    this.overlappings = [[], [], []];
    this.pairs = [];

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

    const endPointsX = this.endPoints[0];
    endPointsX.push(epMinX, epMaxX);

    const endPointsY = this.endPoints[1];
    endPointsY.push(epMinY, epMaxY);

    const endPointsZ = this.endPoints[2];
    endPointsZ.push(epMinZ, epMaxZ);

    insertionSort(endPointsX);
    //insertionSort(endPointsY);
    //insertionSort(endPointsZ);

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
    this.pairs.length = 0;
    const endPointsX = this.endPoints[0];
    //const endPointsY = this.endPoints[1];
    //const endPointsZ = this.endPoints[2];

    insertionSort(endPointsX);
    //insertionSort(endPointsY);
    //insertionSort(endPointsZ);

    const [overlappingsX] = this.overlappings;

    for (let i = 0, l = endPointsX.length; i < l; i += 1) {
      const endPointX = endPointsX[i];
      const object = endPointX.box.object;

      if (!object.isAlive()) {
        continue;
      }

      if (endPointX.isMin) {
        for (let j = 0, m = overlappingsX.length; j < m; j += 1) {
          const box = overlappingsX[j];

          if (endPointX.box.overlaps(box)) {
            this.pairs.push([endPointX.box.object, box.object]);
          }
        }

        overlappingsX.push(endPointX.box);
      } else {
        const index = overlappingsX.indexOf(endPointX.box);

        if (index !== -1) {
          overlappingsX.splice(index, 1);
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
