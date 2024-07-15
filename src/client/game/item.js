import {
  TorusGeometry,
  RingGeometry,
  EdgesGeometry,
  TetrahedronGeometry,
  BufferGeometry,
  BufferAttribute,
  Float32BufferAttribute,
  MeshBasicMaterial,
  LineBasicMaterial,
  PointsMaterial,
  NormalBlending,
  Mesh,
  LineSegments,
  Points,
  Group,
  Vector3,
} from 'three';

import { World } from './settings';
import Collidable from './collidable';
import { Items } from './data';

const { floor } = Math;
const itemData = new Map(Items);

class Item extends Collidable {
  #elapsedTime = 0;

  static createTetra(data, texture) {
    const verticesOfTetra = new Float32Array([
      0, 0, 2, 0, 0.3, 0, 0.7, 0, -0.5, -0.7, 0, -0.5,
    ]);
    const indices = [0, 3, 1, 0, 1, 2, 0, 2, 3, 1, 3, 2];
    const geom = new BufferGeometry();
    geom.setIndex(indices);
    geom.setAttribute('position', new BufferAttribute(verticesOfTetra, 3));

    geom.scale(data.radius, data.radius, data.radius);
    geom.translate(0, data.radius * -0.8, data.radius * -0.5);
    geom.computeBoundingBox();
    const wireGeom = new EdgesGeometry(geom);

    let pointsGeom = new TetrahedronGeometry(data.radius + 1, 0);
    const vertices = pointsGeom.attributes.position.array.slice(0);
    pointsGeom = new BufferGeometry();
    pointsGeom.setAttribute(
      'position',
      new Float32BufferAttribute(vertices, 3),
    );
    pointsGeom.translate(0, -data.radius, 0);
    pointsGeom.computeBoundingSphere();

    const mat = new MeshBasicMaterial({ color: data.color });
    const wireMat = new LineBasicMaterial({
      color: data.wireColor,
    });

    const pointsMat = new PointsMaterial({
      color: data.pointColor,
      size: World.pointSize,
      map: texture.point,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    const mesh = new Mesh(geom, mat);
    const wireMesh = new LineSegments(wireGeom, wireMat);
    const pointsMesh = new Points(pointsGeom, pointsMat);

    const object = new Group();
    mesh.name = 'surface';
    wireMesh.name = 'wireframe';
    pointsMesh.name = 'points';
    object.add(mesh);
    object.add(wireMesh);
    object.add(pointsMesh);

    return object;
  }

  static createRing(data, texture) {
    const geom = new TorusGeometry(
      data.radius,
      data.tube,
      data.radialSegments,
      data.tubularSegments,
    );
    const wireGeom = new EdgesGeometry(geom);
    let pointsGeom = new RingGeometry(
      data.radius - 1.5,
      data.radius + 1.5,
      4,
      0,
    );
    const vertices = pointsGeom.attributes.position.array.slice(0);
    pointsGeom = new BufferGeometry();
    pointsGeom.setAttribute(
      'position',
      new Float32BufferAttribute(vertices, 3),
    );
    pointsGeom.computeBoundingSphere();

    const mat = new MeshBasicMaterial({ color: data.color });
    const wireMat = new LineBasicMaterial({
      color: data.wireColor,
    });

    const pointsMat = new PointsMaterial({
      color: data.pointColor,
      size: World.pointSize,
      map: texture.point,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    const mesh = new Mesh(geom, mat);
    const wireMesh = new LineSegments(wireGeom, wireMat);
    const pointsMesh = new Points(pointsGeom, pointsMat);

    const object = new Group();
    mesh.name = 'surface';
    wireMesh.name = 'wireframe';
    pointsMesh.name = 'points';
    object.add(mesh);
    object.add(wireMesh);
    object.add(pointsMesh);

    return object;
  }

  constructor(name, texture) {
    super(name, 'item');

    if (!itemData.has(name)) {
      throw new Error('item data not found');
    }

    this.data = itemData.get(name);
    this.collider.set(new Vector3(), this.data.radius);
    this.object = Item[this.data.method](this.data, texture);

    this.setObject(this.object);
  }

  update(deltaTime, elapsedTime, damping) {
    super.update(deltaTime, elapsedTime, damping);

    //
  }
}

export default Item;
