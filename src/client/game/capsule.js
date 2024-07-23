import { Vector3 } from 'three';

const vecMin = new Vector3();
const vecMax = new Vector3();

class Capsule {
  constructor(
    start = new Vector3(0, 0, 0),
    end = new Vector3(0, 1, 0),
    radius = 1,
  ) {
    this.start = start;
    this.end = end;
    this.radius = radius;
    this.normal = new Vector3().subVectors(end, start).normalize();
  }

  clone() {
    return new Capsule(this.start.clone(), this.end.clone(), this.radius);
  }

  set(start, end, radius) {
    this.start.copy(start);
    this.end.copy(end);
    this.radius = radius;
    this.normal = this.normal.subVectors(end, start).normalize();
  }

  getBoundingBox(box) {
    vecMin.x = this.start.x - this.radius;
    vecMin.y = this.start.y - this.radius;
    vecMin.z = this.start.z - this.radius;
    vecMax.x = this.end.x + this.radius;
    vecMax.y = this.end.y + this.radius;
    vecMax.z = this.end.z + this.radius;
    box.set(vecMin, vecMax);
    return box;
  }

  copy(capsule) {
    this.start.copy(capsule.start);
    this.end.copy(capsule.end);
    this.radius = capsule.radius;
    this.normal.copy(capsule.normal);
  }

  getCenter(target) {
    return target.copy(this.end).add(this.start).multiplyScalar(0.5);
  }

  translate(v) {
    this.start.add(v);
    this.end.add(v);
  }

  checkAABBAxis(p1x, p1y, p2x, p2y, minx, maxx, miny, maxy, radius) {
    return (
      (minx - p1x < radius || minx - p2x < radius) &&
      (p1x - maxx < radius || p2x - maxx < radius) &&
      (miny - p1y < radius || miny - p2y < radius) &&
      (p1y - maxy < radius || p2y - maxy < radius)
    );
  }

  intersectsBox(box) {
    return (
      this.checkAABBAxis(
        this.start.x,
        this.start.y,
        this.end.x,
        this.end.y,
        box.min.x,
        box.max.x,
        box.min.y,
        box.max.y,
        this.radius,
      ) &&
      this.checkAABBAxis(
        this.start.x,
        this.start.z,
        this.end.x,
        this.end.z,
        box.min.x,
        box.max.x,
        box.min.z,
        box.max.z,
        this.radius,
      ) &&
      this.checkAABBAxis(
        this.start.y,
        this.start.z,
        this.end.y,
        this.end.z,
        box.min.y,
        box.max.y,
        box.min.z,
        box.max.z,
        this.radius,
      )
    );
  }
}

export default Capsule;
