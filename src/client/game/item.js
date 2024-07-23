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
  Box3,
  Sphere,
  Vector2,
  Vector3,
  Shape,
  ExtrudeGeometry,
  ShapeGeometry, /// ////
} from 'three';

import { World } from './settings';
import Collidable from './collidable';
import { Items } from './data';

const { floor, PI } = Math;
const itemData = new Map(Items);

class Item extends Collidable {
  #elapsedTime = 0;

  static createTetra(data, texture) {
    const {
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: PI / 2, y: 0, z: 0 },
    } = data;

    const path1 = [
      new Vector2(0, 0),
      new Vector2(0.7, -0.7),
      new Vector2(0.7, -1),
      new Vector2(0, -0.3),
      new Vector2(-0.7, -1),
      new Vector2(-0.7, -0.7),
    ];
    const path2 = [
      new Vector2(0, -0.9),
      new Vector2(0.7, -1.6),
      new Vector2(0.7, -1.9),
      new Vector2(0, -1.2),
      new Vector2(-0.7, -1.9),
      new Vector2(-0.7, -1.6),
    ];
    const shapes = [
      new Shape().setFromPoints(path1),
      new Shape().setFromPoints(path2),
    ];
    const geom = new ExtrudeGeometry(shapes, {
      steps: 1,
      depth: 0.02,
      bevelEnabled: false,
    });

    geom.rotateY(rotation.y);
    geom.rotateX(rotation.x);
    geom.rotateZ(rotation.z);
    geom.scale(data.radius, data.radius, data.radius);
    // geom.translate(0, data.radius * -0.8, data.radius * -0.5);
    geom.translate(position.x, position.y, position.z + data.radius * 0.5);

    const wireGeom = new EdgesGeometry(geom);

    let pointsGeom = new TetrahedronGeometry(data.radius + 1, 0);
    const vertices = pointsGeom.attributes.position.array.slice(0);
    pointsGeom = new BufferGeometry();
    pointsGeom.setAttribute(
      'position',
      new Float32BufferAttribute(vertices, 3),
    );
    pointsGeom.translate(0, -data.radius, 0);
    // pointsGeom.computeBoundingSphere();

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

    if (this.data.collider === 'sphere') {
      this.setCollider(new Sphere(new Vector3(), this.data.radius));
    } else if (this.data.collider === 'box3') {
      const boundingBox = new Box3();
      const sphere = new Sphere(new Vector3(), this.data.radius);
      sphere.getBoundingBox(boundingBox);

      this.setCollider(boundingBox);
    }

    this.object = Item[this.data.method](this.data, texture);

    this.setObject(this.object);
  }

  update(deltaTime, elapsedTime, damping) {
    super.update(deltaTime, elapsedTime, damping);

    //
  }
}

export default Item;
