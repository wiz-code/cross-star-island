import {
  BufferGeometry,
  PointsMaterial,
  Float32BufferAttribute,
  NormalBlending,
  Points,
} from 'three';
import { World, Grid } from './settings';

const { floor } = Math;

export const createGrid = ({
  widthSegments = 10,
  heightSegments = 10,
  depthSegments = 10,
  widthSpacing = World.spacing,
  heightSpacing = World.spacing,
  depthSpacing = World.spacing,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
} = {}, texture) => {
  const vertices = [];
  const halfSize = {
    width: floor((widthSegments * widthSpacing) / 2),
    height: floor((heightSegments * heightSpacing) / 2),
    depth: floor((depthSegments * depthSpacing) / 2),
  };

  for (let i = 0, l = widthSegments + 1; i < l; i += 1) {
    for (let j = 0, m = heightSegments + 1; j < m; j += 1) {
      for (let k = 0, n = depthSegments + 1; k < n; k += 1) {
        const x = i * widthSpacing - halfSize.width;
        const y = j * heightSpacing - halfSize.height;
        const z = k * depthSpacing - halfSize.depth;
        vertices.push(x, y, z);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(vertices, 3),
  );
  geometry.computeBoundingSphere();

  const material = new PointsMaterial({
    color: Grid.color,
    size: World.pointSize,
    map: texture.point,
    blending: NormalBlending,
    depthTest: true,
    transparent: true,
    alphaTest: 0.5,
  });

  const grid = new Points(geometry, material);

  if (position.sx != null) {
    grid.position.set(
      position.sx * widthSpacing,
      position.sy * heightSpacing,
      position.sz * depthSpacing,
    );
  } else {
    grid.position.set(position.x, position.y, position.z);
  }

  grid.rotation.set(rotation.x, rotation.y, rotation.z, 'YXZ');

  return grid;
};

export const createFineGrid = ({
  widthSegments = 10,
  heightSegments = 10,
  depthSegments = 10,
  widthSpacing = World.spacing,
  heightSpacing = World.spacing,
  depthSpacing = World.spacing,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
} = {}, texture) => {
  const vertices = [];
  const halfSize = {
    width: floor((widthSegments * widthSpacing) / 2),
    height: floor((heightSegments * heightSpacing) / 2),
    depth: floor((depthSegments * depthSpacing) / 2),
  };

  const width = floor(widthSpacing / 2);
  const height = floor(heightSpacing / 2);
  const depth = floor(depthSpacing / 2);

  for (let i = 0, l = widthSegments * 2 + 1; i < l; i += 1) {
    for (let j = 0, m = heightSegments * 2 + 1; j < m; j += 1) {
      for (let k = 0, n = depthSegments * 2 + 1; k < n; k += 1) {
        if (i % 2 !== 0 || j % 2 !== 0 || k % 2 !== 0) {
          const x = i * width - halfSize.width;
          const y = j * height - halfSize.height;
          const z = k * depth - halfSize.depth;
          vertices.push(x, y, z);
        }
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(vertices, 3),
  );
  geometry.computeBoundingSphere();

  const size = floor(World.pointSize / 2);

  const material = new PointsMaterial({
    color: Grid.color,
    size,
    map: texture.pointThin,
    blending: NormalBlending,
    depthTest: true,
    transparent: true,
    alphaTest: 0.5,
  });

  const grid = new Points(geometry, material);

  if (position.sx != null) {
    grid.position.set(
      position.sx * widthSpacing,
      position.sy * heightSpacing,
      position.sz * depthSpacing,
    );
  } else {
    grid.position.set(position.x, position.y, position.z);
  }

  grid.rotation.set(rotation.x, rotation.y, rotation.z, 'YXZ');

  return grid;
};
