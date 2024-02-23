import {
  IcosahedronGeometry,
  OctahedronGeometry,
  BufferGeometry,
  WireframeGeometry,
  EdgesGeometry,
  MeshBasicMaterial,
  MeshNormalMaterial,
  LineBasicMaterial,
  PointsMaterial,
  Mesh,
  LineSegments,
  Points,
  Group,
  Float32BufferAttribute,
  Texture,
  Sphere,
  Vector3,
  NormalBlending,
} from 'three';

import Collidable from './collidable';
import { World, Grid } from './settings';
import { Obstacles, Stages } from './data';
import textures from './textures';

const { exp, sqrt, PI } = Math;

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
textures.crossStar(context);

const texture = new Texture(canvas);
texture.needsUpdate = true;

function noop() {}

const obstacleData = new Map(Obstacles);

class Obstacle extends Collidable {
  constructor(name) {
    super(name, 'obstacle');

    if (!obstacleData.has(name)) {
      throw new Error('obstacle data not found');
    }

    this.name = name;
    this.type = 'obstacle';
    this.data = obstacleData.get(name);

    const {
      radius,
      detail,

      color,
      wireColor,
      pointColor,
      pointSize,

      weight,
      rotateSpeed,

      tweens, /// //
      init,
    } = this.data;

    this.collider.set(new Vector3(), radius);
    this.velocity = new Vector3();
    //this.onUpdate = this.data.update.bind(this);
    //this.updater = new Publisher();

    const geom = new IcosahedronGeometry(radius, detail);
    const wireframeGeom = new WireframeGeometry(geom);

    const pointsGeom = new OctahedronGeometry(radius + 4, detail);
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
      size: pointSize,
      map: texture,
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
    this.setActive(false);
  }

  addTweener(tweener, arg) {
    const tween = tweener(this, arg);
    const updater = tween.update.bind(tween);
    this.subscribe('tween', updater);
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.isActive()) {
      this.publish('tween', elapsedTime * 1000);
    }
  }
}

export default Obstacle;
