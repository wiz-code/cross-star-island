import {
  CylinderGeometry,
  BoxGeometry,
  BufferGeometry,
  WireframeGeometry,
  Float32BufferAttribute,
  BufferAttribute,
  MeshBasicMaterial,
  PointsMaterial,
  NormalBlending,
  LineBasicMaterial,
  Mesh,
  Points,
  Group,
  PlaneGeometry,
  LineSegments,
} from 'three';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

import { World, Grid, Ground, Cylinder } from './settings';

const { sin, floor, abs, PI } = Math;

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
  widthSpacing = World.spacing,
  depthSpacing = World.spacing,
  bumpHeight = 1,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
} = {}, texture) => {
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
    pointsVertices[j + 1] = vertices[j + 1] + World.pointSize / 2;
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
    color: Ground.wireColor,
  });

  mat.points = new PointsMaterial({
    color: Ground.pointColor,
    size: World.pointSize,
    map: texture.point,
    blending: NormalBlending,
    alphaTest: 0.5,
  });

  mesh.surface = new Mesh(geom.surface, mat.surface);
  mesh.surface.name = 'surface';
  mesh.wireframe = new LineSegments(geom.wireframe, mat.wireframe);
  mesh.wireframe.name = 'wireframe';
  mesh.points = new Points(geom.points, mat.points);
  mesh.points.name = 'points';

  const ground = new Group();
  ground.add(mesh.surface);
  ground.add(mesh.wireframe);
  ground.add(mesh.points);

  if (position.sx != null) {
    const heightSpacing = position.heightSpacing ?? World.spacing;
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

export const createMaze = ({
  widthSegments = 10,
  heightSegments = 10,
  depthSegments = 10,
  widthSpacing = World.spacing,
  heightSpacing = World.spacing,
  depthSpacing = World.spacing,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
  offset = { x: 0, y: 0, z: 0 }, /// ///////////
} = {}, texture) => {
  const geom = {};
  const mat = {};
  const mesh = {};

  geom.box = new BoxGeometry(
    widthSpacing * widthSegments,
    heightSpacing * heightSegments,
    depthSpacing * depthSegments,
    widthSegments,
    heightSegments,
    depthSegments,
  );
  geom.wireframe = new WireframeGeometry(geom.box);
  geom.points = new BoxGeometry(
    widthSpacing * widthSegments - 10,
    heightSpacing * heightSegments - 10,
    depthSpacing * depthSegments - 10,
    widthSegments,
    heightSegments,
    depthSegments,
  );

  let vertices = geom.points.attributes.position.array.slice(0);
  geom.points = new BufferGeometry();
  geom.points.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geom.points.computeBoundingSphere();

  vertices = geom.box.getAttribute('position').array.slice(0);
  const indices = geom.box.getIndex().array.slice(0);

  for (let i = 0, l = indices.length; i < l; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];
    indices[i] = c;
    indices[i + 1] = b;
    indices[i + 2] = a;
  }

  geom.surface = new BufferGeometry();
  geom.surface.setIndex(new BufferAttribute(indices, 1));
  geom.surface.setAttribute('position', new BufferAttribute(vertices, 3));
  geom.surface.computeVertexNormals();

  /* mesh.brush1 = new Brush(geom.surface);
  mesh.brush1.updateMatrixWorld();
console.log(mesh.brush1)
  geom.plane = new PlaneGeometry(
    heightSpacing * heightSegments,
    depthSpacing * depthSegments,
    heightSegments,
    depthSegments
  );

  mesh.brush2 = new Brush(geom.plane);
  mesh.brush2.updateMatrixWorld();
  const evaluator = new Evaluator();
  geom.surface = evaluator.evaluate(mesh.brush1.geometry, mesh.brush2.geometry, SUBTRACTION); */

  mat.surface = new MeshBasicMaterial({
    color: Ground.color,
  });
  mat.wireframe = new LineBasicMaterial({
    color: Ground.wireColor,
  });
  mat.points = new PointsMaterial({
    color: Ground.pointColor,
    size: World.pointSize,
    map: texture.point,
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

export const createCylinder = ({
  radiusTop = 5,
  radiusBottom = 5,
  height = 10,
  radialSegments = 8,
  heightSegments = 1,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
} = {}, texture) => {
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
  geom.points = new CylinderGeometry(
    radiusTop,
    radiusBottom,
    height + World.pointSize * 1.2,
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
    size: World.pointSize,
    map: texture.point,
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
