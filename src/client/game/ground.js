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
  Vector3,
} from 'three';
import { SUBTRACTION, ADDITION, Brush, Evaluator } from 'three-bvh-csg';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

import { World, Ground, Cylinder } from './settings';

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

export const createGround = (
  {
    widthSegments = 10,
    depthSegments = 10,
    spacing = World.spacing,
    bumpHeight = 1,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 },
  },
  texture,
) => {
  const width = widthSegments * spacing;
  const depth = depthSegments * spacing;

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

  geom.bvh = geom.surface.clone();
  geom.bvh = geom.bvh.toNonIndexed();
  geom.bvh.deleteAttribute('uv'); // mergeGeometries()でattributesの数を揃える必要があるため
  geom.bvh.setIndex(null); // mergeGeometries()でindexの有無をどちらかに揃える必要があるため

  geom.wireframe = new WireframeGeometry(geom.surface);

  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(pointsVertices, 3),
  );
  geom.points.computeBoundingSphere();

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


  // BVHジオメトリーは先に回転、次に移動の順番にする必要がある
  group.rotation.set(rotation.x, rotation.y, rotation.z, 'YXZ');
  geom.bvh.rotateY(rotation.y);
  geom.bvh.rotateX(rotation.x);
  geom.bvh.rotateZ(rotation.z);

  if (position.sx != null) {
    group.position.set(
      position.sx * spacing,
      position.sy * spacing,
      position.sz * spacing,
    );
    geom.bvh.translate(
      position.sx * spacing,
      position.sy * spacing,
      position.sz * spacing,
    );
  } else {
    group.position.set(position.x, position.y, position.z);
    geom.bvh.translate(position.x, position.y, position.z);
  }

  return { object: group, bvh: geom.bvh };
};

export const createMaze = (list, texture) => {
  const boxes = [];
  const mesh = {};
  const mat = {};
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

  const evaluator = new Evaluator();
  evaluator.attributes = ['position', 'normal'];

  for (let i = 0, l = list.length; i < l; i += 1) {
    const {
      front = true,
      back = true,
      left = true,
      right = true,
      top = true,
      bottom = true,
      widthSegments = 10,
      heightSegments = 10,
      depthSegments = 10,
      position = { sx: 0, sy: 0, sz: 0 },
    } = list[i];

    // 前後の面
    const plane1 = new PlaneGeometry(
      World.spacing * widthSegments,
      World.spacing * heightSegments,
      widthSegments,
      heightSegments,
    );

    // 左右の面
    const plane2 = new PlaneGeometry(
      World.spacing * depthSegments,
      World.spacing * heightSegments,
      depthSegments,
      heightSegments,
    );

    // 上下の面
    const plane3 = new PlaneGeometry(
      World.spacing * widthSegments,
      World.spacing * depthSegments,
      widthSegments,
      depthSegments,
    );

    const brushes = [];

    const x = floor(World.spacing * widthSegments * 0.5);
    const y = floor(World.spacing * heightSegments * 0.5);
    const z = floor(World.spacing * depthSegments * 0.5);

    let moveX, moveY, moveZ;

    if (position.sx != null) {
      moveX = World.spacing * position.sx;
      moveY = World.spacing * position.sy;
      moveZ = World.spacing * position.sz;
    } else {
      moveX = position.x;
      moveY = position.y;
      moveZ = position.z;
    }

    if (front) {
      const plane = plane1.clone();
      plane.rotateY(-PI);
      plane.translate(0, 0, z);

      const brush = new Brush(plane, mat.surface);
      brush.position.set(moveX, moveY, moveZ);
      brush.updateMatrixWorld();

      brushes.push(brush);
    }

    if (back) {
      const plane = plane1.clone();
      plane.translate(0, 0, -z);

      const brush = new Brush(plane, mat.surface);
      brush.position.set(moveX, moveY, moveZ);
      brush.updateMatrixWorld();

      brushes.push(brush);
    }

    if (right) {
      const plane = plane2.clone();
      plane.rotateY(PI * 0.5);
      plane.translate(-x, 0, 0);

      const brush = new Brush(plane, mat.surface);
      brush.position.set(moveX, moveY, moveZ);
      brush.updateMatrixWorld();

      brushes.push(brush);
    }

    if (left) {
      const plane = plane2.clone();
      plane.rotateY(-PI * 0.5);
      plane.translate(x, 0, 0);

      const brush = new Brush(plane, mat.surface);
      brush.position.set(moveX, moveY, moveZ);
      brush.updateMatrixWorld();

      brushes.push(brush);
    }

    if (top) {
      const plane = plane3.clone();
      plane.rotateX(PI * 0.5);
      plane.translate(0, y, 0);

      const brush = new Brush(plane, mat.surface);
      brush.position.set(moveX, moveY, moveZ);
      brush.updateMatrixWorld();

      brushes.push(brush);
    }

    if (bottom) {
      const plane = plane3.clone();
      plane.rotateX(-PI * 0.5);
      plane.translate(0, -y, 0);

      const brush = new Brush(plane, mat.surface);
      brush.position.set(moveX, moveY, moveZ);
      brush.updateMatrixWorld();

      brushes.push(brush);
    }

    let box;

    for (let j = 0, m = brushes.length; j < m; j += 1) {
      const brush = brushes[j];

      if (j === 0) {
        box = brush;
      } else {
        box = evaluator.evaluate(box, brush, ADDITION);
      }
    }

    box.updateMatrixWorld();

    boxes.push(box);
  }

  for (let i = 0, l = boxes.length; i < l; i += 1) {
    const box = boxes[i];

    if (i === 0) {
      mesh.surface = box;
    } else if (boxes.length >= 2) {
      mesh.surface = evaluator.evaluate(mesh.surface, box, ADDITION);
    }
  }

  mesh.surface.updateMatrixWorld();
  mesh.surface.geometry.computeVertexNormals();

  const geom = {};
  geom.bvh = mesh.surface.geometry.clone();
  geom.bvh = geom.bvh.toNonIndexed();
  geom.bvh.deleteAttribute('uv'); // mergeGeometries()でattributesの数を揃える必要があるため
  geom.bvh.setIndex(null); // mergeGeometries()でindexの有無をどちらかに揃える必要があるため

  geom.wireframe = new WireframeGeometry(mesh.surface.geometry);

  const vertices = mesh.surface.geometry.getAttribute('position').array.slice(0);
  const normals = mesh.surface.geometry.getAttribute('normal').array.slice(0);

  const newVertices = [];
  const vertexMap = new Map();

  for (let i = 0, l = vertices.length; i < l; i += 3) {
    const vx1 = vertices[i];
    const vy1 = vertices[i + 1];
    const vz1 = vertices[i + 2];

    const key = `${vx1}:${vy1}:${vz1}`;

    if (!vertexMap.has(key)) {
      vertexMap.set(key, new Set());
    }

    const set = vertexMap.get(key);
    set.add(i);
  }

  const vertexList = Array.from(vertexMap.entries());
  const normalMap = new Map();

  for (let i = 0, l = vertexList.length; i < l; i += 1) {
    const [key, vertexSet] = vertexList[i];
    const indices = Array.from(vertexSet.keys());

    if (!normalMap.has(key)) {
      normalMap.set(key, []);
    }

    const list = normalMap.get(key);

    let x = 0, y = 0, z = 0;

    for (let j = 0, m = indices.length; j < m; j += 1) {
      const index = indices[j];

      const nx = normals[index];
      const ny = normals[index + 1];
      const nz = normals[index + 2];

      x += nx;
      y += ny;
      z += nz;
    }

    x /= indices.length;
    y /= indices.length;
    z /= indices.length;

    list.push(x, y, z);
  }

  for (let i = 0, l = vertices.length; i < l; i += 3) {
    const vx1 = vertices[i];
    const vy1 = vertices[i + 1];
    const vz1 = vertices[i + 2];

    const vertex = new Vector3(
      vx1,
      vy1,
      vz1
    );

    const key = `${vx1}:${vy1}:${vz1}`;
    const list = normalMap.get(key);

    const normal = new Vector3(
      list[0],
      list[1],
      list[2]
    );

    vertex.add(normal.normalize().multiplyScalar(1));
    newVertices.push(vertex.x, vertex.y, vertex.z);
  }

  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(newVertices, 3)
  );
  geom.points.computeBoundingSphere();

  mesh.wireframe = new LineSegments(geom.wireframe, mat.wireframe);
  mesh.points = new Points(geom.points, mat.points);

  mesh.surface.name = 'surface';
  mesh.wireframe.name = 'wireframe';
  mesh.points.name = 'points';

  const group = new Group();
  group.add(mesh.surface);
  group.add(mesh.wireframe);
  group.add(mesh.points);

  return { object: group, bvh: geom.bvh };
};

export const createCylinder = (
  {
    radiusTop = 5,
    radiusBottom = 5,
    height = 10,
    radialSegments = 8,
    heightSegments = 1,
    spacing = World.spacing,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 },
  },
  texture,
) => {
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
  geom.bvh = geom.surface.clone();
  geom.bvh = geom.bvh.toNonIndexed();
  geom.bvh.deleteAttribute('uv'); // mergeGeometries()でattributesの数を揃える必要があるため
  geom.bvh.setIndex(null); // mergeGeometries()でindexの有無をどちらかに揃える必要があるため

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

  // BVHジオメトリーは先に回転、次に移動の順番にする必要がある
  group.rotation.set(rotation.x, rotation.y, rotation.z, 'YXZ');
  geom.bvh.rotateY(rotation.y);
  geom.bvh.rotateX(rotation.x);
  geom.bvh.rotateZ(rotation.z);

  if (position.sx != null) {
    group.position.set(
      position.sx * spacing,
      position.sy * spacing,
      position.sz * spacing,
    );
    geom.bvh.translate(
      position.sx * spacing,
      position.sy * spacing,
      position.sz * spacing,
    );
  } else {
    group.position.set(position.x, position.y, position.z);
    geom.bvh.translate(position.x, position.y, position.z);
  }

  return { object: group, bvh: geom.bvh };
};
