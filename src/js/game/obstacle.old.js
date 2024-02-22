import {
  IcosahedronGeometry,
  OctahedronGeometry,
  BufferGeometry,
  WireframeGeometry,
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

import Publisher from './publisher';
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

class Obstacle {
  static defaults = {
    size: 1,
    detail: 0,
    weight: 1,

    color: 0xffffff,
    wireColor: 0x000000,
    pointColor: 0xffffff,
    pointSize: 10,

    rotateSpeed: 1,

    collider: new Sphere(new Vector3(), 1),
    velocity: new Vector3(),

    update: noop,
  };

  #active = false;

  #elapsedTime = 0;

  constructor(name, opts = {}) {
    const data = new Map(Obstacles);

    if (!data.has(name)) {
      throw new Error('data not found');
    }

    this.data = data.get(name);

    const {
      size,
      detail,

      color,
      wireColor,
      pointColor,
      pointSize,

      weight,
      rotateSpeed,

      tweens, /// //
      init,
      update,
    } = { ...Obstacle.defaults, ...this.data, ...opts };

    this.name = name;
    this.type = 'obstacle';

    this.collider = new Sphere(new Vector3(), size);
    this.velocity = new Vector3();
    this.onUpdate = update.bind(this);
    this.updater = new Publisher();

    const geom = new IcosahedronGeometry(size, detail);
    const wireframeGeom = new WireframeGeometry(geom);

    const pointsGeom = new OctahedronGeometry(size + 4, detail);
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

    this.object = new Group();
    this.object.add(mesh);
    this.object.add(wireMesh);
    this.object.add(pointsMesh);

    this.setActive(true);
  }

  isActive() {
    return this.#active();
  }

  setActive(bool) {
    this.#active = bool;
  }

  addTweener(tweener) {
    this.tweener = tweener(this);
    this.tweener = this.tweener.update.bind(this.tweener);
    this.updater.subscribe('update', this.tweener);
  }

  update(deltaTime) {
    if (this.#active) {
      this.#elapsedTime += deltaTime;

      this.updater.publish('update');
      this.onUpdate(deltaTime);
    }
  }
}

export default Obstacle;
