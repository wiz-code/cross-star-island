import { BufferGeometry, Mesh, Vector3, Group, ArrowHelper, MeshBasicMaterial } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { World } from './settings';

import { createGrid, createFineGrid } from './grid';
import { createGround, createMaze, createCylinder } from './ground';

const createStage = (stageData, texture) => {
  const { sections } = stageData;
  const stage = new Group();
  const bvhList = [];

  for (let i = 0, l = sections.length; i < l; i += 1) {
    const section = sections[i];
    const block = new Group();
    const bvhs = [];

    if (Array.isArray(section.grid)) {
      for (let j = 0, m = section.grid.length; j < m; j += 1) {
        const data = section.grid[j];
        const grid = createGrid(data, texture);
        const fineGrid = createFineGrid(data, texture);
        block.add(grid);
        block.add(fineGrid);
      }
    } else if (section.grid != null) {
      const grid = createGrid(section.grid, texture);
      const fineGrid = createFineGrid(section.grid, texture);
      block.add(grid);
      block.add(fineGrid);
    }

    if (Array.isArray(section.ground)) {
      for (let j = 0, m = section.ground.length; j < m; j += 1) {
        const data = section.ground[j];
        const { object, bvh } = createGround(data, texture);
        block.add(object);
        bvhs.push(bvh);
      }
    } else if (section.ground != null) {
      const { object, bvh } = createGround(section.ground, texture);
      block.add(object);
      bvhs.push(bvh);
    }

    if (Array.isArray(section.maze)) {
      const { object, bvh } = createMaze(section.maze, texture);
      block.add(object);
      bvhs.push(bvh);
    }

    if (Array.isArray(section.cylinder)) {
      for (let j = 0, m = section.cylinder.length; j < m; j += 1) {
        const data = section.cylinder[j];
        const { object, bvh } = createCylinder(data, texture);
        block.add(object);
        bvhs.push(bvh);
      }
    } else if (section.cylinder != null) {
      const { object, bvh } = createCylinder(section.cylinder, texture);
      block.add(object);
      bvhs.push(bvh);
    }

    if (section.arrow != null) {
      let direction = new Vector3(0, 0, -1);

      if (section.arrow.direction != null) {
        direction = section.arrow.direction.normalize();
      }

      const position = section.arrow.position ?? new Vector3(0, 0, 0);
      const length = section.arrow.length ?? 1;
      const color = section.arrow.color ?? 0xffffff;
      const arrow = new ArrowHelper(
        direction,
        position,
        length,
        color,
        length * 0.6,
        length * 0.2,
      );
      block.add(arrow);
    }

    if (section.offset != null) {
      const { offset } = section;

      if (offset.sx != null) {
        const spacing = offset.spacing ?? World.spacing;
        block.position.set(
          offset.sx * spacing,
          offset.sy * spacing,
          offset.sz * spacing,
        );
        bvhs.forEach((geom) => {
          geom.translate(
            offset.sx * spacing,
            offset.sy * spacing,
            offset.sz * spacing,
          );
        });
      } else {
        block.position.set(offset.x, offset.y, offset.z);
        bvhs.forEach((geom) => {
          geom.translate(
            offset.x,
            offset.y,
            offset.z,
          );
        });
      }
    }

    stage.add(block);
    bvhList.push(...bvhs);
  }

  const merged = mergeGeometries(bvhList);
  const bvhMesh = new Mesh(
    merged,
    new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      wireframe: true,
    })
  );
  bvhMesh.boundsTree = new MeshBVH(merged);

  return { terrain: stage, bvh: bvhMesh };
};

export default createStage;
