class Box {
  constructor(minX, minY, minZ, maxX, maxY, maxZ) {
    this.min = new Map([
      ['x', minX],
      ['y', minY],
      ['z', minZ],
    ]);
    this.max = new Map([
      ['x', maxX],
      ['y', maxY],
      ['z', maxZ],
    ]);
    this.object = null;
  }

  overlaps(box) {
    const minX1 = this.min.get('x').value;
    const maxX1 = this.max.get('x').value;
    const minY1 = this.min.get('y').value;
    const maxY1 = this.max.get('y').value;
    const minZ1 = this.min.get('z').value;
    const maxZ1 = this.max.get('z').value;

    const minX2 = box.min.get('x').value;
    const maxX2 = box.max.get('x').value;
    const minY2 = box.min.get('y').value;
    const maxY2 = box.max.get('y').value;
    const minZ2 = box.min.get('z').value;
    const maxZ2 = box.max.get('z').value;

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
