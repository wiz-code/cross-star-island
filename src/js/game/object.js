import * as THREE from 'three';

import { Grid, Ground } from './settings';
import textures from './textures';

const { random, sin, floor, abs, PI } = Math;

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
