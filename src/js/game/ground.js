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
  const geom1 = new THREE.PlaneGeometry(
    width,
    depth,
    Grid.Segments.width - 1,
    Grid.Segments.depth - 1,
  );
  geom1.rotateX(-PI / 2);

  const vertices = geom1.attributes.position.array;
  const pointsVertices = vertices.slice(0);

  for (let i = 0, j = 0, l = vertices.length; i < l; i += 1, j += 3) {
    vertices[j + 1] = data[i] * Ground.heightCoef;
    pointsVertices[j + 1] = vertices[j + 1] + Grid.size / 2;
  }

  const geom2 = new THREE.BufferGeometry();
  geom2.setAttribute('position', new THREE.Float32BufferAttribute(pointsVertices, 3));
  geom2.computeBoundingSphere();

  /* const texture = new THREE.CanvasTexture(generateTexture(data, width, depth));
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.colorSpace = THREE.SRGBColorSpace; */

  const mat1 = new THREE.MeshBasicMaterial({
    color: Ground.color,
  });
  const mat2 = new THREE.MeshBasicMaterial({
    color: Ground.wireframeColor,
    wireframe: true,
    // blending: THREE.AdditiveBlending,
    // transparent: true,
  });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  textures.crossStar(context);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const mat3 = new THREE.PointsMaterial({
    color: Ground.pointsColor,
    size: Grid.size,
    map: texture,
    blending: THREE.NormalBlending,
    alphaTest: 0.5,
  });
  const ground = new THREE.Mesh(geom1, mat1);
  const wireframe = new THREE.Mesh(geom1, mat2);
  const points = new THREE.Points(geom2, mat3);

  const group = new THREE.Group();
  group.add(ground);
  group.add(wireframe);
  group.add(points);

  /* const geometry = new THREE.PlaneGeometry(width, depth, Grid.Segments.width, Grid.Segments.depth);
  const mat1 = new THREE.MeshBasicMaterial({
    color: 0x003823,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
  const mat2 = new THREE.MeshBasicMaterial({
    color: Ground.color,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });

  const ground = new THREE.Mesh(geometry, mat1);
  //ground.position.y = -Grid.Segments.height * Grid.Spacing.height;
  ground.rotation.x = -PI / 2 */

  return group;
};
