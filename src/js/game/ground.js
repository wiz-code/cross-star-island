import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

import { Grid, Ground } from './settings';
import textures from './textures';

const { random, sin, floor, abs, PI } = Math;

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

const generateTexture = (data, width, height) => {
  const vector3 = new THREE.Vector3(0, 0, 0);
  const sun = new THREE.Vector3(1, 1, 1);
  sun.normalize();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  let context = canvas.getContext('2d');
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);

  let image = context.getImageData(0, 0, canvas.width, canvas.height);
  let imageData = image.data;

  for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j += 1) {
    vector3.x = data[j - 2] - data[j + 2];
    vector3.y = 2;
    vector3.z = data[j - width * 2] - data[j + width * 2];
    vector3.normalize();

    const shade = vector3.dot(sun);

    imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
    imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
    imageData[i + 2] = shade * 96 * (0.5 + data[j] * 0.007);
  }

  context.putImageData(image, 0, 0);

  // Scaled 4x

  const canvasScaled = document.createElement('canvas');
  canvasScaled.width = width * 4;
  canvasScaled.height = height * 4;

  context = canvasScaled.getContext('2d');
  context.scale(4, 4);
  context.drawImage(canvas, 0, 0);

  image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
  imageData = image.data;

  for (let i = 0, l = imageData.length; i < l; i += 4) {
    const v = floor(customRandom() * 5);

    imageData[i] += v;
    imageData[i + 1] += v;
    imageData[i + 2] += v;
  }

  context.putImageData(image, 0, 0);

  return canvasScaled;
};

const createStage = (radius = 100) => {
  const geom = new THREE.CylinderGeometry(radius, radius, 10, 12);

  const pointsGeom = new THREE.CylinderGeometry(
    radius + 2.5,
    radius + 2.5,
    20,
    12,
  );
  const pointsVertices = pointsGeom.attributes.position.array.slice(0);

  const bufferGeom = new THREE.BufferGeometry();
  bufferGeom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(pointsVertices, 3),
  );
  bufferGeom.computeBoundingSphere();

  const mat = new THREE.MeshBasicMaterial({
    color: Ground.Object.color,
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: Ground.wireframeColor,
    wireframe: true,
  });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  textures.crossStar(context);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const pointsMat = new THREE.PointsMaterial({
    color: Ground.Object.pointsColor,
    size: Grid.size,
    map: texture,
    blending: THREE.NormalBlending,
    alphaTest: 0.5,
  });

  const mesh = new THREE.Mesh(geom, mat);
  const wireMesh = new THREE.Mesh(geom, wireMat);
  const pointsMesh = new THREE.Points(bufferGeom, pointsMat);

  const group = new THREE.Group();
  group.add(mesh);
  group.add(wireMesh);
  group.add(pointsMesh);

  return group;
};

const createStone = (size = 1, detail = 0) => {
  const geom = new THREE.OctahedronGeometry(size, detail);
  geom.scale(0.2, 1, 0.2);

  const pointsGeom = new THREE.OctahedronGeometry(size + 4, detail);
  pointsGeom.scale(0.26, 1, 0.26);
  const pointsVertices = pointsGeom.attributes.position.array.slice(0);

  const bufferGeom = new THREE.BufferGeometry();
  bufferGeom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(pointsVertices, 3),
  );
  bufferGeom.computeBoundingSphere();

  const mat = new THREE.MeshBasicMaterial({
    color: Ground.Object.color,
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: Ground.wireframeColor,
    wireframe: true,
  });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  textures.crossStar(context);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const pointsMat = new THREE.PointsMaterial({
    color: Ground.Object.pointsColor,
    size: Grid.size,
    map: texture,
    blending: THREE.NormalBlending,
    alphaTest: 0.5,
  });

  const mesh = new THREE.Mesh(geom, mat);
  const wireMesh = new THREE.Mesh(geom, wireMat);
  const pointsMesh = new THREE.Points(bufferGeom, pointsMat);

  const group = new THREE.Group();
  group.add(mesh);
  group.add(wireMesh);
  group.add(pointsMesh);

  return group;
};

export const createWalls = () => {
  const width = (Grid.Segments.width - 2) * Grid.Spacing.width;
  const depth = (Grid.Segments.depth - 2) * Grid.Spacing.depth;
  const height = Grid.Spacing.height * Ground.wallHeightSize + 1;

  const walls = [];

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  textures.crossStar(context);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  for (let i = 0; i < 4; i += 1) {
    let geom;
    let data;

    if (i % 2 === 0) {
      data = generateHeight(width, height);
      geom = new THREE.PlaneGeometry(
        width,
        height,
        Grid.Segments.width - 1,
        Ground.wallHeightSize,
      );
    } else {
      data = generateHeight(depth, height);
      geom = new THREE.PlaneGeometry(
        depth,
        height,
        Grid.Segments.depth - 1,
        Ground.wallHeightSize,
      );
    }

    const vertices = geom.attributes.position.array;
    const pointsVertices = vertices.slice(0);

    for (let j = 0, k = 0, l = vertices.length; j < l; j += 1, k += 3) {
      vertices[k + 2] = (data[j] * Ground.heightCoef) / 2;
      pointsVertices[k + 2] = vertices[k + 2] + Grid.size / 2;
    }

    const geomPoints = new THREE.BufferGeometry();
    geomPoints.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(pointsVertices, 3),
    );
    geomPoints.computeBoundingSphere();

    const mat = new THREE.MeshBasicMaterial({
      color: Ground.wallColor,
    });
    const matWire = new THREE.MeshBasicMaterial({
      color: Ground.wireframeColor,
      wireframe: true,
    });

    const matPoints = new THREE.PointsMaterial({
      color: Ground.pointsColor,
      size: Grid.size,
      map: texture,
      blending: THREE.NormalBlending,
      alphaTest: 0.5,
    });

    const mesh = new THREE.Mesh(geom, mat);
    const meshWire = new THREE.Mesh(geom, matWire);
    const meshPoints = new THREE.Points(geomPoints, matPoints);

    const group = new THREE.Group();
    group.add(mesh);
    group.add(meshWire);
    group.add(meshPoints);

    group.position.setY((Grid.Spacing.height * Ground.wallHeightSize) / 2);

    if (i % 2 === 0) {
      if (i === 0) {
        group.position.setZ(-depth / 2 + 50);
      } else {
        group.rotation.y = PI;
        group.position.setZ(depth / 2 - 50);
      }
    } else if (i === 1) {
      group.rotation.y = PI / 2;
      group.position.setX(-width / 2 + 50);
    } else {
      group.rotation.y = -PI / 2;
      group.position.setX(width / 2 - 50);
    }

    walls.push(group);
  }

  return walls;
};

export const createGround = () => {
  const width = Grid.Segments.width * Grid.Spacing.width;
  const depth = Grid.Segments.depth * Grid.Spacing.depth;

  const data = generateHeight(width, depth);

  const geom = {};
  const mat = {};
  const mesh = {};
  const group = {};

  geom.ground = new THREE.PlaneGeometry(
    width,
    depth,
    Grid.Segments.width - 1,
    Grid.Segments.depth - 1,
  );
  geom.ground.rotateX(-PI / 2);

  const vertices = geom.ground.attributes.position.array;
  const pointsVertices = vertices.slice(0);

  for (let i = 0, j = 0, l = vertices.length; i < l; i += 1, j += 3) {
    vertices[j + 1] = data[i] * Ground.heightCoef;
    pointsVertices[j + 1] = vertices[j + 1] + Grid.size / 2;
  }

  geom.groundPoints = new THREE.BufferGeometry();
  geom.groundPoints.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(pointsVertices, 3),
  );
  geom.groundPoints.computeBoundingSphere();

  /* const texture = new THREE.CanvasTexture(generateTexture(data, width, depth));
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.colorSpace = THREE.SRGBColorSpace; */

  mat.ground = new THREE.MeshBasicMaterial({
    color: Ground.color,
  });
  mat.groundWire = new THREE.MeshBasicMaterial({
    color: Ground.wireframeColor,
    wireframe: true,
  });

  const canvas = {};
  const context = {};
  const texture = {};

  canvas.ground = document.createElement('canvas');
  context.ground = canvas.ground.getContext('2d');
  textures.crossStar(context.ground);

  texture.ground = new THREE.Texture(canvas.ground);
  texture.ground.needsUpdate = true;

  mat.groundPoints = new THREE.PointsMaterial({
    color: Ground.pointsColor,
    size: Grid.size,
    map: texture.ground,
    blending: THREE.NormalBlending,
    alphaTest: 0.5,
  });

  mesh.ground = new THREE.Mesh(geom.ground, mat.ground);
  mesh.wireframe = new THREE.Mesh(geom.ground, mat.groundWire);
  mesh.points = new THREE.Points(geom.groundPoints, mat.groundPoints);

  group.ground = new THREE.Group();
  group.ground.add(mesh.ground);
  group.ground.add(mesh.wireframe);
  group.ground.add(mesh.points);

  geom.stones = [];
  const stone = createStone(60);
  geom.stones.push(stone);

  geom.stones.forEach((ms) => {
    ms.rotation.y = PI / 10;
    ms.position.set(80, 100, -300);
    group.ground.add(ms);
  });

  const stage = createStage();
  stage.position.set(200, 150, -100);
  group.ground.add(stage);

  const walls = createWalls();
  walls.forEach((wall) => group.ground.add(wall));
  // ground.position.y = -Grid.Segments.height * Grid.Spacing.height;
  // ground.rotation.x = -PI / 2

  return group.ground;
};
