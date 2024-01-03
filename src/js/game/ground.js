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

  /*const texture = new THREE.CanvasTexture(generateTexture(data, width, depth));
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
  const stoneGeom = new THREE.OctahedronGeometry(60);

  const stonePointsGeom = new THREE.OctahedronGeometry(64);
  const stonePointsVertices = stonePointsGeom.attributes.position.array.slice(0);

  geom.stonePoints = new THREE.BufferGeometry();
  geom.stonePoints.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(stonePointsVertices, 3),
  );
  geom.stonePoints.computeBoundingSphere();

  const stoneMat = new THREE.MeshBasicMaterial({
    color: Ground.Object.color,
  });
  const stoneWireMat = new THREE.MeshBasicMaterial({
    color: Ground.wireframeColor,
    wireframe: true,
  });

  canvas.stone = document.createElement('canvas');
  context.stone = canvas.stone.getContext('2d');
  textures.crossStar(context.stone);

  texture.stone = new THREE.Texture(canvas.stone);
  texture.stone.needsUpdate = true;

  const stonePointsMat = new THREE.PointsMaterial({
    color: Ground.Object.pointsColor,
    size: Grid.size,
    map: texture.stone,
    blending: THREE.NormalBlending,
    alphaTest: 0.5,
  });

  geom.stones.push(new THREE.Mesh(stoneGeom, stoneMat));
  geom.stones.push(new THREE.Mesh(stoneGeom, stoneWireMat));
  geom.stones.push(new THREE.Points(geom.stonePoints, stonePointsMat));

  geom.stones.forEach((ms) => {
    ms.position.setX(10);
    ms.position.setY(40);
    ms.position.setZ(-400);
    group.ground.add(ms);
  });
  //ground.position.y = -Grid.Segments.height * Grid.Spacing.height;
  //ground.rotation.x = -PI / 2

  return group.ground;
};
