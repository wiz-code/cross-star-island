class Box {
  constructor(minX, minY, minZ, maxX, maxY, maxZ) {
    this.min = [minX, minY, minZ];
    this.max = [maxX, maxY, maxZ];
    this.object = null;
  }

  overlapX(box) {
    const minX1 = this.min[0].value;
    const maxX1 = this.max[0].value;
    const minX2 = box.min[0].value;
    const maxX2 = box.max[0].value;

    return (
      maxX1 > minX2 &&
      minX1 < maxX2
    );
  }

  overlapY(box) {
    const minY1 = this.min[1].value;
    const maxY1 = this.max[1].value;
    const minY2 = box.min[1].value;
    const maxY2 = box.max[1].value;

    return (
      maxY1 > minY2 &&
      minY1 < maxY2
    );
  }

  overlapZ(box) {
    const minZ1 = this.min[2].value;
    const maxZ1 = this.max[2].value;
    const minZ2 = box.min[2].value;
    const maxZ2 = box.max[2].value;

    return (
      maxZ1 > minZ2 &&
      minZ1 < maxZ2
    );
  }

  overlaps(box) {
    const minX1 = this.min[0].value;
    const maxX1 = this.max[0].value;
    const minY1 = this.min[1].value;
    const maxY1 = this.max[1].value;
    const minZ1 = this.min[2].value;
    const maxZ1 = this.max[2].value;

    const minX2 = box.min[0].value;
    const maxX2 = box.max[0].value;
    const minY2 = box.min[1].value;
    const maxY2 = box.max[1].value;
    const minZ2 = box.min[2].value;
    const maxZ2 = box.max[2].value;

    return (
      maxX1 > minX2 &&
      minX1 < maxX2 &&
      maxY1 > minY2 &&
      minY1 < maxY2 &&
      maxZ1 > minZ2 &&
      minZ1 < maxZ2
    );
  }
}

export default Box;
