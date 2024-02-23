import {
  Texture,
  CylinderGeometry,
  BufferGeometry,
  WireframeGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  PointsMaterial,
  NormalBlending,
  LineBasicMaterial,
  Mesh,
  Points,
  Group,
  OctahedronGeometry,
  PlaneGeometry,
  LineSegments,
  DoubleSide,
} from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

import { Grid, Ground, Cylinder } from './settings';
import textures from './textures';

const { random, sin, floor, abs, PI } = Math;

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
textures.crossStar(context);

const texture = new Texture(canvas);
texture.needsUpdate = true;

let seed = PI / 4;
const customRandom = () => {
  seed += 1;
  const x = sin(seed) * 10000;
  return x - floor(x);
};

const generateHeight = (width, height) => {
  const size = width * height;
  const data = new Uint8Array(size);
  const perlin = new ImprovedNoise();
  const z = customRandom() * 100;

  let quality = 1;

  for (let j = 0; j < 4; j += 1) {
    for (let i = 0; i < size; i += 1) {
      const x = i % width;
      const y = floor(i / width);
      data[i] += abs(
        perlin.noise(x / quality, y / quality, z) * quality * 1.75,
      );
    }

    quality *= 2;
  }

  return data;
};

export const createGround = ({
  widthSegments = 10,
  depthSegments = 10,
  widthSpacing = 80,
  depthSpacing = 80,
  bumpHeight = 1,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
} = {}) => {
  const width = widthSegments * widthSpacing;
  const depth = depthSegments * depthSpacing;

  const data = generateHeight(width, depth);

  const geom = {};
  const mat = {};
  const mesh = {};

  geom.surface = new PlaneGeometry(width, depth, widthSegments, depthSegments);
  geom.surface.rotateX(-PI / 2);

  const vertices = geom.surface.attributes.position.array;
  const pointsVertices = vertices.slice(0);

  for (let i = 0, j = 0, l = vertices.length; i < l; i += 1, j += 3) {
    vertices[j + 1] = data[i] * bumpHeight;
    pointsVertices[j + 1] = vertices[j + 1] + Grid.size / 2;
  }

  geom.wireframe = new WireframeGeometry(geom.surface);

  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(pointsVertices, 3),
  );
  geom.points.computeBoundingSphere();

  mat.surface = new MeshBasicMaterial({
    color: Ground.color,
    // side: DoubleSide,
  });
  mat.wireframe = new LineBasicMaterial({
    color: Ground.wireframeColor,
  });

  mat.points = new PointsMaterial({
    color: Ground.pointsColor,
    size: Grid.size,
    map: texture,
    blending: NormalBlending,
    alphaTest: 0.5,
  });

  mesh.surface = new Mesh(geom.surface, mat.surface);
  mesh.surface.name = 'surface';
  // mesh.wireframe = new Mesh(geom.surface, mat.wireframe);
  mesh.wireframe = new LineSegments(geom.wireframe, mat.wireframe);
  mesh.wireframe.name = 'wireframe';
  mesh.points = new Points(geom.points, mat.points);
  mesh.points.name = 'points';

  const ground = new Group();
  ground.add(mesh.surface);
  ground.add(mesh.wireframe);
  ground.add(mesh.points);

  if (position.sx != null) {
    const heightSpacing = position.heightSpacing ?? 80;
    ground.position.set(
      position.sx * widthSpacing,
      position.sy * heightSpacing,
      position.sz * depthSpacing,
    );
  } else {
    ground.position.set(position.x, position.y, position.z);
  }

  ground.rotation.set(rotation.x, rotation.y, rotation.z, 'YXZ');

  return ground;
};

export const createCylinder = ({
  radiusTop = 5,
  radiusBottom = 5,
  height = 10,
  radialSegments = 8,
  heightSegments = 1,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
} = {}) => {
  const geom = {};
  const mat = {};
  const mesh = {};

  geom.surface = new CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    heightSegments,
  );
  // geom.surface.rotateX(-PI / 2);
  geom.points = new CylinderGeometry(
    radiusTop,
    radiusBottom,
    height + 4,
    radialSegments,
    heightSegments,
  );

  const vertices = geom.points.attributes.position.array.slice(0);
  geom.wireframe = new WireframeGeometry(geom.surface);

  geom.points = new BufferGeometry();
  geom.points.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geom.points.computeBoundingSphere();

  mat.surface = new MeshBasicMaterial({
    color: Cylinder.color,
    // side: DoubleSide,
  });
  mat.wireframe = new LineBasicMaterial({
    color: Cylinder.wireColor,
  });

  mat.points = new PointsMaterial({
    color: Cylinder.pointColor,
    size: Grid.size,
    map: texture,
    blending: NormalBlending,
    alphaTest: 0.5,
  });

  mesh.surface = new Mesh(geom.surface, mat.surface);
  mesh.surface.name = 'surface';
  mesh.wireframe = new LineSegments(geom.wireframe, mat.wireframe);
  mesh.wireframe.name = 'wireframe';
  mesh.points = new Points(geom.points, mat.points);
  mesh.points.name = 'points';

  const group = new Group();
  group.add(mesh.surface);
  group.add(mesh.wireframe);
  group.add(mesh.points);

  if (position.sx != null) {
    const spacing = position.spacing ?? 80;
    group.position.set(
      position.sx * spacing,
      position.sy * spacing,
      position.sz * spacing,
    );
  } else {
    group.position.set(position.x, position.y, position.z);
  }

  group.rotation.set(rotation.x, rotation.y, rotation.z, 'YXZ');

  return group;
};
