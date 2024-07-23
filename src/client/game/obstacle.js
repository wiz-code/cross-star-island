import {
  IcosahedronGeometry,
  OctahedronGeometry,
  BufferGeometry,
  WireframeGeometry,
  MeshBasicMaterial,
  LineBasicMaterial,
  PointsMaterial,
  Mesh,
  LineSegments,
  Points,
  Group,
  Float32BufferAttribute,
  Vector3,
  Sphere,
  Box3,
  NormalBlending,
} from 'three';

import { World } from './settings';
import Collidable from './collidable';
import { Obstacles } from './data';

const obstacleData = new Map(Obstacles);

class Obstacle extends Collidable {
  constructor(name, texture) {
    super(name, 'obstacle');

    if (!obstacleData.has(name)) {
      throw new Error('obstacle data not found');
    }

    this.data = obstacleData.get(name);

    const {
      collider,
      radius,
      detail,

      color,
      wireColor,
      pointColor,
    } = this.data;
    const pointsDetail = this.data.pointsDetail ?? detail;

    if (collider === 'sphere') {
      this.setCollider(new Sphere(new Vector3(), radius));
    } else if (collider === 'box3') {
      const boundingBox = new Box3();
      const sphere = new Sphere(new Vector3(), radius);
      sphere.getBoundingBox(boundingBox);

      this.setCollider(boundingBox);
    }

    const geom = new IcosahedronGeometry(radius, detail);
    const wireframeGeom = new WireframeGeometry(geom);

    const pointsGeom = new OctahedronGeometry(radius + 1, pointsDetail);
    const pointsVertices = pointsGeom.attributes.position.array.slice(0);

    const bufferGeom = new BufferGeometry();
    bufferGeom.setAttribute(
      'position',
      new Float32BufferAttribute(pointsVertices, 3),
    );
    bufferGeom.computeBoundingSphere();

    const mat = new MeshBasicMaterial({
      color,
    });
    const wireframeMat = new LineBasicMaterial({
      color: wireColor,
    });

    const pointsMat = new PointsMaterial({
      color: pointColor,
      size: World.pointSize,
      map: texture.point,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    const mesh = new Mesh(geom, mat);
    const wireMesh = new LineSegments(wireframeGeom, wireframeMat);
    const pointsMesh = new Points(bufferGeom, pointsMat);

    const object = new Group();
    object.add(mesh);
    object.add(wireMesh);
    object.add(pointsMesh);

    this.setObject(object);
  }

  update(deltaTime, elapsedTime, damping) {
    super.update(deltaTime, elapsedTime, damping);

    //
  }
}

export default Obstacle;
