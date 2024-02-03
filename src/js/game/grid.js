import * as THREE from 'three';
import { Grid } from './settings';
import textures from './textures';

const { floor } = Math;

export const createGrid = (
  widthSegments = 10,
  heightSegments = 10,
  depthSegments = 10,
  widthSpacing = 80,
  heightSpacing = 80,
  depthSpacing = 80,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 }
) => {
  const vertices = [];
  const halfSize = {
    width: floor((widthSegments * widthSpacing) / 2),
    height: floor((heightSegments * heightSpacing) / 2),
    depth: floor((depthSegments * depthSpacing) / 2),
  };

  for (let i = 0, l = widthSegments; i < l; i += 1) {
    for (let j = 0, m = heightSegments; j < m; j += 1) {
      for (let k = 0, n = depthSegments; k < n; k += 1) {
        const x = i * widthSpacing - halfSize.width;
        const y = j * heightSpacing - halfSize.height;
        const z = k * depthSpacing - halfSize.depth;
        vertices.push(x, y, z);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.computeBoundingSphere();

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  textures.crossStar(context);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.PointsMaterial({
    color: Grid.color,
    size: Grid.size,
    map: texture,
    blending: THREE.NormalBlending,
    depthTest: true,
    transparent: true,
    alphaTest: 0.5,
  });

  const grid = new THREE.Points(geometry, material);
  grid.position.set(position.x, position.y, position.z);
  grid.rotation.set(rotation.x, rotation.y, rotation.z, 'YXZ');

  return grid;
};

export const createFineGrid = (
  widthSegments = 10,
  heightSegments = 10,
  depthSegments = 10,
  widthSpacing = 80,
  heightSpacing = 80,
  depthSpacing = 80,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 }
) => {
  const vertices = [];
  const halfSize = {
    width: floor((widthSegments * widthSpacing) / 2),
    height: floor((heightSegments * heightSpacing) / 2),
    depth: floor((depthSegments * depthSpacing) / 2),
  };

  const width = floor(widthSpacing / 2);
  const height = floor(heightSpacing / 2);
  const depth = floor(depthSpacing / 2);

  for (let i = 0, l = widthSegments * 2 - 1; i < l; i += 1) {
    for (let j = 0, m = heightSegments * 2 - 1; j < m; j += 1) {
      for (let k = 0, n = depthSegments * 2 - 1; k < n; k += 1) {
        if (
          i % 2 !== 0 ||
          j % 2 !== 0 ||
          k % 2 !== 0
        ) {
          const x = i * width - halfSize.width;
          const y = j * height - halfSize.height;
          const z = k * depth - halfSize.depth;
          vertices.push(x, y, z);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.computeBoundingSphere();

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  textures.crossStarThin(context);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const size = floor(Grid.size / 2);

  const material = new THREE.PointsMaterial({
    color: Grid.color,
    size,
    map: texture,
    blending: THREE.NormalBlending,
    depthTest: true,
    transparent: true,
    alphaTest: 0.5,
  });

  const grid = new THREE.Points(geometry, material);

  return grid;
};
