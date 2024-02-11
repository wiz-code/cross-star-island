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
import { Obstacles } from './data';
import textures from './textures';

const { exp, sqrt, PI } = Math;
const ObstacleData = new Map(Obstacles);

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
textures.crossStar(context);

const texture = new Texture(canvas);
texture.needsUpdate = true;

function noop() {}

class Stone {
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
    if (!ObstacleData.has(name)) {
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

      update,
    } = { ...Stone.defaults, ...ObstacleData.get(name), ...opts };

    this.name = name;
    this.weight = weight;
    this.collider = new Sphere(new Vector3(), size);
    this.velocity = new Vector3();
    this.update = update.bind(this);

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
}

export default Stone;
