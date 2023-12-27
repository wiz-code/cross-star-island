import * as THREE from 'three';
import { Grid } from './settings';
import textures from './textures';

const { floor } = Math;

export const createGrid = () => {
  const vertices = [];
  const halfSize = {
    width: floor((Grid.Segments.width * Grid.Spacing.width) / 2),
    height: floor((Grid.Segments.height * Grid.Spacing.height) / 2),
    depth: floor((Grid.Segments.depth * Grid.Spacing.depth) / 2),
  };

  for (let i = 0, l = Grid.Segments.width; i < l; i += 1) {
    for (let j = 0, m = Grid.Segments.height; j < m; j += 1) {
      for (let k = 0, n = Grid.Segments.depth; k < n; k += 1) {
        const x = i * Grid.Spacing.width - halfSize.width;
        const y = j * Grid.Spacing.height - halfSize.height;
        const z = k * Grid.Spacing.depth - halfSize.depth;
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

  return grid;
};
