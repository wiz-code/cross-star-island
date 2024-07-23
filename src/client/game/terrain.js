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
  Vector2,
  Vector3,
  FrontSide,
  BackSide,
  DoubleSide,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SUBTRACTION, ADDITION, Brush, Evaluator } from 'three-bvh-csg';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

import { World, Ground, Cylinder, Tower, Column } from './settings';
import { getPointsVertices } from './utils';

const { sin, cos, floor, ceil, abs, PI } = Math;

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

export const createTower = (
  {
    name = '',
    movable = false,

    radius,
    height,
    radialSegments = 8,
    heightSegments = 4,
    inside = false,
    spacing = World.spacing,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 },
  },
  texture,
) => {
  const geom = {};
  const mat = {};
  const mesh = {};

  const interiorAngle = (180 * (radialSegments - 2)) / radialSegments;
  const phi = (180 - interiorAngle) / 360 * PI * 2;

  const width = radius * sin(PI / radialSegments) * 2;
  const widthSegments = ceil(width / spacing);

  const offsetX = -radius * cos(phi * 0.5);
  const radialPoint = new Vector2(offsetX, 0);
  const center = new Vector2(0, 0);
  const geomList = [];

  geom.wall = new PlaneGeometry(width, height, widthSegments, heightSegments);
  geom.wall.rotateY(PI / 2 * (inside ? 1 : -1));
  geom.wall = geom.wall.toNonIndexed();
  geom.wall.deleteAttribute('uv');
  geom.wall.setIndex(null);

  for (let i = 0; i < radialSegments; i += 1) {
    const rotate = phi * i;
    const wall = geom.wall.clone();
    wall.rotateY(rotate);
    wall.translate(radialPoint.x, height * 0.5, radialPoint.y);

    radialPoint.rotateAround(center, -phi);
    geomList.push(wall);
  }

  mat.surface = new MeshBasicMaterial({
    color: Tower.color,
  });
  mat.wireframe = new LineBasicMaterial({
    color: Tower.wireColor,
  });
  mat.points = new PointsMaterial({
    color: Tower.pointColor,
    size: World.pointSize,
    map: texture.point,
    blending: NormalBlending,
    alphaTest: 0.5,
  });

  const merged = mergeGeometries(geomList);
  mesh.surface = new Mesh(merged, mat.surface);

  geom.bvh = mesh.surface.geometry.clone();
  geom.bvh = geom.bvh.toNonIndexed();
  geom.bvh.deleteAttribute('uv'); // mergeGeometries()でattributesの数を揃える必要があるため
  geom.bvh.setIndex(null); // mergeGeometries()でindexの有無をどちらかに揃える必要があるため

  if (name !== '') {
    geom.bvh.name = name;
  }

  if (movable) {
    geom.bvh.userData.movable = true;
  }

  geom.wireframe = new WireframeGeometry(mesh.surface.geometry);

  const vertices = mesh.surface.geometry
    .getAttribute('position')
    .array.slice(0);
  const normals = mesh.surface.geometry.getAttribute('normal').array.slice(0);
  const newVertices = getPointsVertices(vertices, normals);

  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(newVertices, 3),
  );

  mesh.wireframe = new LineSegments(geom.wireframe, mat.wireframe);
  mesh.points = new Points(geom.points, mat.points);

  mesh.surface.name = 'surface';
  mesh.wireframe.name = 'wireframe';
  mesh.points.name = 'points';

  const group = new Group();
  group.add(mesh.surface);
  group.add(mesh.wireframe);
  group.add(mesh.points);

  geom.bvh.userData.object = group;

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

export const createRingTower = (
  {
    name = '',
    movable = false,

    radius,
    width,
    height,
    depth,
    radialSegments = 8,
    widthSegments = 4,
    heightSegments = 4,
    depthSegments = 4,
    spacing = World.spacing,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 },
  },
  texture,
) => {
  const geom = {};
  const mat = {};
  const mesh = {};

  const interiorAngle = (180 * (radialSegments - 2)) / radialSegments;
  const phi = (180 - interiorAngle) / 360 * PI * 2;

  const offsetX = -radius * cos(phi * 0.5) - depth * 0.5;
  const radialPoint = new Vector2(offsetX, 0);
  const center = new Vector2(0, 0);
  const geomList = [];

  geom.wall = new BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
  //geom.wall.rotateY(PI / 2);
  geom.wall = geom.wall.toNonIndexed();
  geom.wall.deleteAttribute('uv');
  geom.wall.setIndex(null);

  for (let i = 0; i < radialSegments; i += 1) {
    const rotate = phi * i;
    const wall = geom.wall.clone();
    wall.rotateY(rotate);
    wall.translate(radialPoint.x, height * 0.5, radialPoint.y);

    radialPoint.rotateAround(center, -phi);
    geomList.push(wall);
  }

  mat.surface = new MeshBasicMaterial({
    color: Tower.color,
  });
  mat.wireframe = new LineBasicMaterial({
    color: Tower.wireColor,
  });
  mat.points = new PointsMaterial({
    color: Tower.pointColor,
    size: World.pointSize,
    map: texture.point,
    blending: NormalBlending,
    alphaTest: 0.5,
  });

  const merged = mergeGeometries(geomList);
  mesh.surface = new Mesh(merged, mat.surface);

  geom.bvh = mesh.surface.geometry.clone();
  geom.bvh = geom.bvh.toNonIndexed();
  geom.bvh.deleteAttribute('uv'); // mergeGeometries()でattributesの数を揃える必要があるため
  geom.bvh.setIndex(null); // mergeGeometries()でindexの有無をどちらかに揃える必要があるため

  if (name !== '') {
    geom.bvh.name = name;
  }

  if (movable) {
    geom.bvh.userData.movable = true;
  }

  geom.wireframe = new WireframeGeometry(mesh.surface.geometry);

  const vertices = mesh.surface.geometry
    .getAttribute('position')
    .array.slice(0);
  const normals = mesh.surface.geometry.getAttribute('normal').array.slice(0);
  const newVertices = getPointsVertices(vertices, normals);

  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(newVertices, 3),
  );

  mesh.wireframe = new LineSegments(geom.wireframe, mat.wireframe);
  mesh.points = new Points(geom.points, mat.points);

  mesh.surface.name = 'surface';
  mesh.wireframe.name = 'wireframe';
  mesh.points.name = 'points';

  const group = new Group();
  group.add(mesh.surface);
  group.add(mesh.wireframe);
  group.add(mesh.points);

  geom.bvh.userData.object = group;

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

export const createTowerStairs = (
  {
    radialSegments,
    innerRadius,
    outerRadius,
    incline,
    height,
    heightSegments,
    spacing = World.spacing,
    movable = false,

    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 },
  },
  texture,
) => {
  const geom = {};
  const mat = {};
  const mesh = {};

  const interiorAngle = (180 * (radialSegments - 2)) / radialSegments;
  const phi = (180 - interiorAngle) / 360 * PI * 2;

  const horizontalDepth = innerRadius * sin(PI / radialSegments) * 2;
  const depth = horizontalDepth / cos(incline);
  const width = (outerRadius - innerRadius) * cos(phi * 0.5);
  const depthSegments = ceil(depth / spacing);

  const inclineHeight = depth * sin(incline);
  const steps = floor(height / inclineHeight);

  const radialPoint = new Vector2(0, -outerRadius * cos(phi * 0.5) - depth * 0.25);

  const lp = new Vector2(
    outerRadius * sin(phi * 0.5),
    -outerRadius * cos(phi * 0.5),
  );
  const rp = new Vector2(
    -outerRadius * sin(phi * 0.5),
    -outerRadius * cos(phi * 0.5),
  );

  let x1 = innerRadius * sin(PI / radialSegments);
  let z1 = -innerRadius * cos(PI / radialSegments);
  let x2 = x1;
  let z2 = z1 - width;
  let x3 = x1 - horizontalDepth;
  let z3 = z2;
  let x4 = x3;
  let z4 = z1;

  const v1 = new Vector2(x1, z1);
  const v2 = new Vector2(x2, z2);
  const v3 = new Vector2(x3, z3);
  const v4 = new Vector2(x4, z4);

  geom.slope = new PlaneGeometry(width, depth, 1, depthSegments);
  geom.slope.rotateY(PI / 2);
  geom.slope.rotateZ(PI / 2 - incline);
  geom.slope.translate(0, inclineHeight / 2, 0);

  geom.slope = geom.slope.toNonIndexed();
  geom.slope.deleteAttribute('uv');
  geom.slope.setIndex(null);

  geom.wall = new BoxGeometry(depth * 0.5, height, depth * 0.5, 2, heightSegments, 2);
  geom.wall = geom.wall.toNonIndexed();
  geom.wall.deleteAttribute('uv');
  geom.wall.setIndex(null);

  const landing = new BufferGeometry();

  const center = new Vector2(0, 0);
  const vec = new Vector2(0, z1 - width / 2);

  const geomList = [];


  for (let i = 0; i < radialSegments; i += 1) {
    const rotate = phi * i;
    const wall = geom.wall.clone();
    wall.rotateY(rotate);
    wall.translate(radialPoint.x, height * 0.5, radialPoint.y);

    radialPoint.rotateAround(center, -phi);
    //geomList.push(wall);
  }

  for (let i = 0; i < steps; i += 1) {
    const step = steps[i];
    const rotate = phi * i;
    const slope = geom.slope.clone();

    slope.rotateY(rotate);
    slope.translate(vec.x, inclineHeight * i, vec.y);

    let l1 = landing.clone();
    let l2 = landing.clone();

    const leftVertices = [
      v1.x, inclineHeight * i, v1.y,
      lp.x, inclineHeight * i, lp.y,
      v2.x, inclineHeight * i, v2.y,


    ];
    const rightVertices = [
      v3.x, inclineHeight * (i + 1), v3.y,
      rp.x, inclineHeight * (i + 1), rp.y,
      v4.x, inclineHeight * (i + 1), v4.y,
    ];

    l1.setAttribute(
      'position',
      new Float32BufferAttribute(leftVertices, 3),
    );
    l2.setAttribute(
      'position',
      new Float32BufferAttribute(rightVertices, 3),
    );
    l1.computeVertexNormals();
    l2.computeVertexNormals();

    l1.deleteAttribute('uv');
    l2.deleteAttribute('uv');

    //l1.rotateY(PI / 2);
    //l2.rotateY(PI / 2);

    vec.rotateAround(center, -phi);
    v1.rotateAround(center, -phi);
    v2.rotateAround(center, -phi);
    v3.rotateAround(center, -phi);
    v4.rotateAround(center, -phi);
    lp.rotateAround(center, -phi);
    rp.rotateAround(center, -phi);

    geomList.push(l1, l2, slope);
  }

  geom.surface = mergeGeometries(geomList);

  const vertices = geom.surface.getAttribute('position').array;
  const normals = geom.surface.getAttribute('normal').array;

  const pointsVertices = getPointsVertices(vertices, normals);

  geom.bvh = geom.surface.clone();
  geom.bvh = geom.bvh.toNonIndexed();
  geom.bvh.deleteAttribute('uv'); // mergeGeometries()でattributesの数を揃える必要があるため
  geom.bvh.setIndex(null); // mergeGeometries()でindexの有無をどちらかに揃える必要があるため

  if (name !== '') {
    geom.bvh.name = name;
  }

  if (movable) {
    geom.bvh.userData.movable = true;
  }

  geom.wireframe = new WireframeGeometry(geom.surface);

  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(pointsVertices, 3),
  );
  // geom.points.computeBoundingSphere();

  mat.surface = new MeshBasicMaterial({
    color: Tower.stairColor,
    side: DoubleSide,
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

  geom.bvh.userData.object = group;

  return { object: group, bvh: geom.bvh };
};

export const createGround = (
  {
    name = '',
    movable = false,

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

  const vertices = geom.surface.getAttribute('position').array;
  const normals = geom.surface.getAttribute('normal').array;
  // const pointsVertices = vertices.slice(0);

  for (let i = 0, j = 0, l = vertices.length; i < l; i += 1, j += 3) {
    vertices[j + 1] = data[i] * bumpHeight;
    // pointsVertices[j + 1] = vertices[j + 1] + World.pointSize / 2;
  }

  const pointsVertices = getPointsVertices(vertices, normals);

  geom.bvh = geom.surface.clone();
  geom.bvh = geom.bvh.toNonIndexed();
  geom.bvh.deleteAttribute('uv'); // mergeGeometries()でattributesの数を揃える必要があるため
  geom.bvh.setIndex(null); // mergeGeometries()でindexの有無をどちらかに揃える必要があるため

  if (name !== '') {
    geom.bvh.name = name;
  }

  if (movable) {
    geom.bvh.userData.movable = true;
  }

  geom.wireframe = new WireframeGeometry(geom.surface);

  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(pointsVertices, 3),
  );
  // geom.points.computeBoundingSphere();

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

  geom.bvh.userData.object = group;

  return { object: group, bvh: geom.bvh };
};
const evaluator = new Evaluator();
evaluator.attributes = ['position', 'normal'];
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

  // const evaluator = new Evaluator();
  // evaluator.attributes = ['position', 'normal'];

  let name = '';
  let movable = false;

  for (let i = 0, l = list.length; i < l; i += 1) {
    if (i === 0) {
      const { name: mazeName, movable: mazeMovable } = list[i];

      if (mazeName !== '') {
        name = mazeName;
      }

      if (mazeMovable) {
        movable = true;
      }
    }

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

    let moveX;
    let moveY;
    let moveZ;

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

  if (name !== '') {
    geom.bvh.name = name;
  }

  if (movable) {
    geom.bvh.userData.movable = true;
  }

  geom.wireframe = new WireframeGeometry(mesh.surface.geometry);

  const vertices = mesh.surface.geometry
    .getAttribute('position')
    .array.slice(0);
  const normals = mesh.surface.geometry.getAttribute('normal').array.slice(0);

  /* const newVertices = [];
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
  } */
  const newVertices = getPointsVertices(vertices, normals);

  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(newVertices, 3),
  );
  // geom.points.computeBoundingSphere();

  mesh.wireframe = new LineSegments(geom.wireframe, mat.wireframe);
  mesh.points = new Points(geom.points, mat.points);

  mesh.surface.name = 'surface';
  mesh.wireframe.name = 'wireframe';
  mesh.points.name = 'points';

  const group = new Group();
  group.add(mesh.surface);
  group.add(mesh.wireframe);
  group.add(mesh.points);

  geom.bvh.userData.object = group;

  return { object: group, bvh: geom.bvh };
};

export const createCylinder = (
  {
    name = '',
    movable = false,

    radiusTop = 5,
    radiusBottom = 5,
    height = 10,
    radialSegments = 8,
    heightSegments = 1,
    openEnded = false,
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
    openEnded,
  );
  geom.bvh = geom.surface.clone();
  geom.bvh = geom.bvh.toNonIndexed();
  geom.bvh.deleteAttribute('uv'); // mergeGeometries()でattributesの数を揃える必要があるため
  geom.bvh.setIndex(null); // mergeGeometries()でindexの有無をどちらかに揃える必要があるため

  if (name !== '') {
    geom.bvh.name = name;
  }

  if (movable) {
    geom.bvh.userData.movable = true;
  }

  /* geom.points = new CylinderGeometry(
    radiusTop,
    radiusBottom,
    height + World.pointSize * 1.2,
    radialSegments,
    heightSegments,
  ); */

  const vertices = geom.surface.getAttribute('position').array.slice(0);
  const normals = geom.surface.getAttribute('normal').array.slice(0);
  geom.wireframe = new WireframeGeometry(geom.surface);

  const pointsVertices = getPointsVertices(vertices, normals);
  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(pointsVertices, 3),
  );
  // geom.points.computeBoundingSphere();

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

  geom.bvh.userData.object = group;

  return { object: group, bvh: geom.bvh };
};

export const createColumn = (
  {
    name = '',
    movable = false,

    radiusEnd = 12,
    radiusShaft = 8,
    heightShaft = 10,
    heightEnd = 2,
    radialSegments = 8,
    heightSegments = 4,
    openEnded = true,
    side = FrontSide,
    spacing = World.spacing,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 },
  },
  texture,
) => {
  const geom = {};
  const mat = {};
  const mesh = {};

  geom.capital = new CylinderGeometry(
    radiusEnd,
    radiusShaft,
    heightEnd,
    radialSegments,
    1,
    openEnded,
  );
  geom.base = new CylinderGeometry(
    radiusShaft,
    radiusEnd,
    heightEnd,
    radialSegments,
    1,
    openEnded,
  );
  geom.shaft = new CylinderGeometry(
    radiusShaft,
    radiusShaft,
    heightShaft,
    radialSegments,
    heightSegments,
    openEnded,
  );

  mat.surface = new MeshBasicMaterial({
    color: Column.color,
    side,
  });
  mat.wireframe = new LineBasicMaterial({
    color: Column.wireColor,
  });
  mat.points = new PointsMaterial({
    color: Column.pointColor,
    size: World.pointSize,
    map: texture.point,
    blending: NormalBlending,
    alphaTest: 0.5,
  });

  const y = (heightShaft + heightEnd) * 0.5;
  let moveX;
  let moveY;
  let moveZ;

  if (position.sx != null) {
    moveX = World.spacing * position.sx;
    moveY = World.spacing * position.sy;
    moveZ = World.spacing * position.sz;
  } else {
    moveX = position.x;
    moveY = position.y;
    moveZ = position.z;
  }

  geom.capital.translate(0, heightShaft + heightEnd * 1.5, 0);
  geom.shaft.translate(0, heightShaft * 0.5 + heightEnd, 0);
  geom.base.translate(0, heightEnd * 0.5, 0);
  const merged = mergeGeometries([geom.capital, geom.shaft, geom.base]);
  mesh.surface = new Mesh(merged, mat.surface);

  geom.bvh = mesh.surface.geometry.clone();
  geom.bvh = geom.bvh.toNonIndexed();
  geom.bvh.deleteAttribute('uv'); // mergeGeometries()でattributesの数を揃える必要があるため
  geom.bvh.setIndex(null); // mergeGeometries()でindexの有無をどちらかに揃える必要があるため

  if (name !== '') {
    geom.bvh.name = name;
  }

  if (movable) {
    geom.bvh.userData.movable = true;
  }

  geom.wireframe = new WireframeGeometry(mesh.surface.geometry);

  const vertices = mesh.surface.geometry
    .getAttribute('position')
    .array.slice(0);
  const normals = mesh.surface.geometry.getAttribute('normal').array.slice(0);
  const newVertices = getPointsVertices(vertices, normals);

  geom.points = new BufferGeometry();
  geom.points.setAttribute(
    'position',
    new Float32BufferAttribute(newVertices, 3),
  );

  mesh.wireframe = new LineSegments(geom.wireframe, mat.wireframe);
  mesh.points = new Points(geom.points, mat.points);

  mesh.surface.name = 'surface';
  mesh.wireframe.name = 'wireframe';
  mesh.points.name = 'points';

  const group = new Group();
  group.add(mesh.surface);
  group.add(mesh.wireframe);
  group.add(mesh.points);

  geom.bvh.userData.object = group;

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
