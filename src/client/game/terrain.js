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
  const phi = ((180 - interiorAngle) / 360) * PI * 2;

  const width = radius * sin(PI / radialSegments) * 2;
  const widthSegments = ceil(width / spacing);

  const offsetX = -width / 2;
  const offsetY = radius * cos(phi * 0.5);
  const radialPoint = new Vector2(0, offsetY);
  const center = new Vector2(0, 0);
  const geomList = [];

  geom.wall = new PlaneGeometry(width, height, widthSegments, heightSegments);
  geom.wall.rotateY(inside ? PI : 0);
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
    side: DoubleSide,
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
  merged.computeVertexNormals();
  mesh.surface = new Mesh(merged, mat.surface);

  geom.bvh = mesh.surface.geometry.clone();
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
  const phi = ((180 - interiorAngle) / 360) * PI * 2;

  const offsetX = -radius * cos(phi * 0.5) - depth * 0.5;
  const radialPoint = new Vector2(offsetX, 0);
  const center = new Vector2(0, 0);
  const geomList = [];

  geom.wall = new BoxGeometry(
    width,
    height,
    depth,
    widthSegments,
    heightSegments,
    depthSegments,
  );

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
    incline, // 0 <= theta <= PI / 2
    height,
    heightSegments,
    spacing = World.spacing,
    reverse = false,
    movable = false,

    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 },
  },
  texture,
) => {
  const geom = {};
  const mat = {};
  const mesh = {};

  const dir = reverse ? -1 : 1;
  const interiorAngle = (180 * (radialSegments - 2)) / radialSegments;
  const phi = ((180 - interiorAngle) / 360) * PI * 2;
  const halfPhi = phi * 0.5;

  const horizontalDepth = innerRadius * sin(halfPhi) * 2;
  const depth = horizontalDepth / cos(incline);
  const width = (outerRadius - innerRadius) * cos(halfPhi);
  const depthSegments = ceil(depth / spacing);

  const inclineHeight = depth * sin(incline);

  const steps = floor(height / inclineHeight);

  /*const radialPoint = new Vector2(
    0,
    //-outerRadius * cos(phi * 0.5) - depth * 0.25,
    -(innerRadius * cos(halfPhi) + width * 0.5),
  );*/

  const px = outerRadius * sin(halfPhi);
  const py = outerRadius * cos(halfPhi);

  const p1 = new Vector2(-dir * px, -py);
  const p2 = new Vector2(dir * px, -py);

  const x1 = -innerRadius * sin(halfPhi);
  const y1 = -innerRadius * cos(halfPhi);
  const x2 = x1;
  const y2 = y1 - width;
  const x3 = x1 + horizontalDepth;
  const y3 = y2;
  const x4 = x3;
  const y4 = y1;

  const v = new Vector2();
  const v1 = new Vector2(x1, y1);
  const v2 = new Vector2(x2, y2);
  const v3 = new Vector2(x3, y3);
  const v4 = new Vector2(x4, y4);

  geom.slope = new PlaneGeometry(width, depth, 1, depthSegments);
  geom.slope.rotateY(PI / 2);

  geom.slope.rotateZ(PI / 2 + dir * incline);
  geom.slope.translate(0, inclineHeight / 2, 0);

  geom.slope = geom.slope.toNonIndexed();
  geom.slope.deleteAttribute('uv');
  geom.slope.setIndex(null);

  const landing = new BufferGeometry();

  const center = new Vector2(0, 0);
  const vec = new Vector2(0, y1 - width / 2);

  const geomList = [];

  // 踊り場の最初と最後を作成
  const setRestLanding = (a, b, h, inFront) => {
    const p = inFront ? p1 : p2;
    let rad;

    if (inFront) {
      rad = reverse ? dir * -phi : dir * -phi;
    } else {
      rad = reverse ? dir * phi : dir * phi;
    }


    v.copy(a).rotateAround(center, rad);
    const l = landing.clone();

    let positions;

    if (inFront) {
      positions =
       reverse
         ? [b.x, h, b.y, v.x, h, v.y, p.x, h, p.y]
         : [b.x, h, b.y, p.x, h, p.y, v.x, h, v.y];
    } else {
      positions =
       reverse
         ? [b.x, h, b.y, p.x, h, p.y, v.x, h, v.y]
         : [b.x, h, b.y, v.x, h, v.y, p.x, h, p.y];
    }

    l.setAttribute('position', new Float32BufferAttribute(positions, 3));
    l.computeVertexNormals();
    l.deleteAttribute('uv');
    geomList.push(l);
  };

  let h;

  for (let i = 0; i < steps; i += 1) {
    if (i === 0) {
      if (reverse) {
        setRestLanding(v2, v4, 0, true);
      } else {
        setRestLanding(v3, v1, 0, true);
      }
    }

    const step = steps[i];
    const rotate = -dir * phi * i;
    const slope = geom.slope.clone();

    slope.rotateY(rotate);
    slope.translate(vec.x, inclineHeight * i, vec.y);

    const l1 = landing.clone();
    const l2 = landing.clone();

    let leftVertices;
    let rightVertices;
    let lv;
    let rv;

    if (reverse) {
      h = inclineHeight * (i + 1);
      lv = [v1.x, h, v1.y, v2.x, h, v2.y, p2.x, h, p2.y];
      h = inclineHeight * i;
      rv = [v3.x, h, v3.y, v4.x, h, v4.y, p1.x, h, p1.y];
    } else {
      h = inclineHeight * i;
      rv = [v1.x, h, v1.y, v2.x, h, v2.y, p1.x, h, p1.y];
      h = inclineHeight * (i + 1);
      lv = [v3.x, h, v3.y, v4.x, h, v4.y, p2.x, h, p2.y];
    }

    l1.setAttribute('position', new Float32BufferAttribute(lv, 3));
    l2.setAttribute('position', new Float32BufferAttribute(rv, 3));
    l1.computeVertexNormals();
    l2.computeVertexNormals();

    l1.deleteAttribute('uv');
    l2.deleteAttribute('uv');

    geomList.push(l1, l2, slope);

    if (i === steps - 1) {
      h = inclineHeight * (i + 1);

      if (reverse) {
        setRestLanding(v3, v1, h, false);
      } else {
        setRestLanding(v2, v4, h, false);
      }

      break;
    }

    const rad = dir * phi;
    vec.rotateAround(center, rad);
    v1.rotateAround(center, rad);
    v2.rotateAround(center, rad);
    v3.rotateAround(center, rad);
    v4.rotateAround(center, rad);
    p1.rotateAround(center, rad);
    p2.rotateAround(center, rad);


  }

  geom.surface = mergeGeometries(geomList);

  const vertices = geom.surface.getAttribute('position').array;
  const normals = geom.surface.getAttribute('normal').array;

  const pointsVertices = getPointsVertices(vertices, normals);

  geom.bvh = geom.surface.clone();
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
    color = {
      surface: Ground.color,
      wireframe: Ground.wireColor,
      points: Ground.pointColor,
    },
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

  mat.surface = new MeshBasicMaterial({
    color: color.surface,
    side: DoubleSide,
  });
  mat.wireframe = new LineBasicMaterial({
    color: color.wireframe,
  });

  mat.points = new PointsMaterial({
    color: color.points,
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
