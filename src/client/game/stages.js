import {
  BufferGeometry,
  Mesh,
  Box3,
  Vector3,
  Group,
  ArrowHelper,
  MeshBasicMaterial,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH, MeshBVHHelper } from 'three-mesh-bvh';
import { World } from './settings';

import { createGrid, createFineGrid } from './grid';
import {
  createGround,
  createMaze,
  createCylinder,
  createColumn,
} from './ground';

const createStage = (stageData, texture) => {
  const { sections } = stageData;
  const stage = new Group();
  const bvhList = [];
  const movableBVH = new Map();
  let totalCount = 0;

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

    if (Array.isArray(section.column)) {
      for (let j = 0, m = section.column.length; j < m; j += 1) {
        const data = section.column[j];
        const { object, bvh } = createColumn(data, texture);
        block.add(object);
        bvhs.push(bvh);
      }
    } else if (section.column != null) {
      const { object, bvh } = createColumn(section.column, texture);
      block.add(object);
      bvhs.push(bvh);
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
          geom.translate(offset.x, offset.y, offset.z);
        });
      }
    }

    bvhs.forEach((bvh) => {
      const name = bvh.name !== '' ? bvh.name : bvh.id;
      const { count } = bvh.getAttribute('position');

      if (bvh.userData.movable) {
        const data = {
          object: bvh.userData.object,
          offset: totalCount,
          count,
        };
        movableBVH.set(name, data);
      }

      totalCount += count;
    });

    stage.add(block);
    bvhList.push(...bvhs);
  }

  const merged = mergeGeometries(bvhList);
  merged.userData.movableBVH = movableBVH;

  const bvhMesh = new Mesh(
    merged,
    new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      wireframe: true,
    }),
  );
  bvhMesh.boundsTree = new MeshBVH(merged);

  const helper = new MeshBVHHelper(bvhMesh.boundsTree, 8);

  return { terrain: stage, bvh: bvhMesh, helper };
};

export default createStage;
