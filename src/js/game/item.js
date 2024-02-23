import {
  TorusGeometry,
  EdgesGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  LineBasicMaterial,
  PointsMaterial,
  NormalBlending,
  Mesh,
  LineSegments,
  Points,
  Group,
  Sphere,
  Vector3,
} from 'three';

import Publisher from './publisher';
import { Items } from './data';

const { floor } = Math;
const itemData = new Map(Items);

class Item extends Publisher {
  #active = false;

  #elapsedTime = 0;

  static createRing(data) {
    const halfValue = {
      radius: floor(data.radius),
      tube: floor(data.tube),
      radialSegments: floor(data.radialSegments),
      tubularSegments: floor(data.tubularSegment),
    };
    const geom = new TorusGeometry(data.radius, data.tube, data.radialSegments, data.tubularSegments);
    const wireGeom = new EdgesGeometry(geom);
    let pointsGeom = new TorusGeometry(halfValue.radius, halfValue.tube, halfValue.radialSegments, halfValue.tubularSegment);
    const vertices = pointsGeom.attributes.position.array.slice(0);
    pointsGeom = new BufferGeometry();
    pointsGeom.setAttribute(
      'position',
      new Float32BufferAttribute(vertices, 3),
    );
    pointsGeom.computeBoundingSphere();

    const mat = new MeshBasicMaterial({ color });
    const wireMat = new LineBasicMaterial({
      color: data.wireColor,
    });

    const pointsMat = new PointsMaterial({
      color: data.pointColor,
      size: data.pointSize,
      map: texture,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    const mesh = new Mesh(geom, mat);
    const wireMesh = new LineSegments(wireGeom, wireframeMat);
    const pointsMesh = new Points(pointsGeom, pointsMat);

    const object = new Group();
    object.add(mesh);
    object.add(wireMesh);
    object.add(pointsMesh);

    return object;
  }

  constructor(name) {
    super();

    this.name = name;
    this.data = itemData.get(name);

    this.onCollide = null;
    this.object = Item[this.data.method](this.data);

    this.setOnUpdate(this.data.update);
    this.setOnCollide(this.data.collide);
    this.setActive(false);
  }

  setObject(object) {
    this.object = object;
  }

  setOnCollide(onCollide) {
    this.onCollide = onCollide;
  }

  isActive() {
    return this.#active;
  }

  setActive(bool = true) {
    this.#active = bool;

    if (bool) {
      this.#elapsedTime = 0;
    }

    if (this.object != null) {
      this.visible(bool);
    }
  }

  visible(bool) {
    this.object.children.forEach((mesh) => {
      mesh.visible = bool;
    });
  }

  setOnUpdate(update) {
    this.onUpdate = update.bind(this);
  }

  getElapsedTime() {
    return this.#elapsedTime;
  }

  update(deltaTime) {
    if (this.#active) {
      this.#elapsedTime += deltaTime;

      if (this.onUpdate != null) {
        this.onUpdate(deltaTime);
      }
    }
  }
}

export default Bullet;
