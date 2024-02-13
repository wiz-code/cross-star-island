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

import { World, Grid, ObjectSettings } from './settings';
import { Obstacles, Tweeners, Stages } from './data';
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
    wireframeColor: 0x000000,
    pointsColor: 0xffffff,
    rotateSpeed: 1,

    collider: new Sphere(new Vector3(), 1),
    velocity: new Vector3(),

    update: noop,
  };

  constructor(name, opts = {}) {
    this.data = {};
    this.data.obstacle = new Map(Obstacles);
    this.data.tweeners = new Map(Tweeners);
    this.data.stage = new Map(Stages);

    if (!this.data.obstacle.has(name)) {
      throw new Error('data not found');
    }

    const {
      size,
      detail,

      color,
      wireframeColor,
      pointsColor,

      weight,
      rotateSpeed,

      tweens,
      update,
    } = { ...Obstacle.defaults, ...this.data.obstacle.get(name), ...opts };

    this.name = name;
    this.rotateSpeed = rotateSpeed;
    this.weight = weight;
    this.collider = new Sphere(new Vector3(), size);
    this.velocity = new Vector3();
    this.update = update.bind(this);

    this.tweens = new Map();

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
      color: ObjectSettings.color,
    });
    const wireframeMat = new LineBasicMaterial({
      color: ObjectSettings.wireframeColor,
    });

    const pointsMat = new PointsMaterial({
      color: ObjectSettings.pointsColor,
      size: Grid.size,
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
  }

  setTweeners(tweeners) {
    tweeners.forEach((tweenName) => {
      const tweener = this.data.tweeners.get(tweenName);
      const tween = tweener(this.object.position);
      this.tweens.set(tweenName, tween.start());
    });
  }

  tween() {
    const list = Array.from(this.tweens.values());

    for (let i = 0, l = list.length; i < l; i += 1) {
      const tween = list[i];
      tween.update();
    }
  }
}

export default Obstacle;
