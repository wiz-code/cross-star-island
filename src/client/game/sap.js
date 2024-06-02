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
    this.endPoints = new Map([
      ['x', []],
      ['y', []],
      ['z', []],
    ]);
    this.overlappings = new Map([
      ['x', new Set()],
      ['y', new Set()],
      ['z', new Set()],
    ]);
    this.pairs = new Map();

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

    const endPointsX = this.endPoints.get('x');
    endPointsX.push(epMinX, epMaxX);

    const endPointsY = this.endPoints.get('y');
    endPointsY.push(epMinY, epMaxY);

    const endPointsZ = this.endPoints.get('z');
    endPointsZ.push(epMinZ, epMaxZ);

    insertionSort(endPointsX);
    //insertionSort(endPointsY);
    //insertionSort(endPointsZ);

    return box;
  }

  updateObject(id, bb) {
    const box = this.boxes.get(id);

    const epMinX = box.min.get('x');
    const epMaxX = box.max.get('x');
    epMinX.value = bb.min.x;
    epMaxX.value = bb.max.x;

    const epMinY = box.min.get('y');
    const epMaxY = box.max.get('y');
    epMinY.value = bb.min.y;
    epMaxY.value = bb.max.y;

    const epMinZ = box.min.get('z');
    const epMaxZ = box.max.get('z');
    epMinZ.value = bb.min.z;
    epMaxZ.value = bb.max.z;
  }

  update() {
    this.pairs.clear();
    const endPointsX = this.endPoints.get('x');
    //const endPointsY = this.endPoints.get('y');
    //const endPointsZ = this.endPoints.get('z');

    insertionSort(endPointsX);
    //insertionSort(endPointsY);
    //insertionSort(endPointsZ);

    const overlappingsX = this.overlappings.get('x');

    for (let i = 0, l = endPointsX.length; i < l; i += 1) {
      const endPointX = endPointsX[i];

      if (endPointX.isMin) {
        const overlappings = [...overlappingsX.keys()];

        for (let j = 0, m = overlappings.length; j < m; j += 1) {
          const box = overlappings[j];

          if (endPointX.box.overlaps(box)) {
            this.pairs.set(endPointX.box.object, box.object);
          }
        }

        overlappingsX.add(endPointX.box);
      } else {
        overlappingsX.delete(endPointX.box);
      }
    }
  }

  removeObject(object) {
    const box = this.boxes.get(object.id);

    this.endPoints.forEach((endPoints, key) => {
      const filtered = endPoints.filter((endPoint) => endPoint.box !== box);
      this.endPoints.set(key, filtered);
    });

    this.boxes.delete(object.id);
  }

  onAdd() {}

  onRemove() {}
}

export default SweepAndPrune;
