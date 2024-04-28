import { Vector3, Group, ArrowHelper } from 'three';

import { World } from './settings';
import { Stages } from './data';

import { createGrid, createFineGrid } from './grid';
import { createGround, createMaze, createCylinder } from './ground';

const createStage = (index, texture) => {
  const { sections } = Stages[index];
  const stage = new Group();

  for (let i = 0, l = sections.length; i < l; i += 1) {
    const section = sections[i];
    const block = new Group();

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
        const ground = createGround(data, texture);
        block.add(ground);
      }
    } else if (section.ground != null) {
      const ground = createGround(section.ground, texture);
      block.add(ground);
    }

    if (Array.isArray(section.maze)) {
      const maze = createMaze(section.maze, texture);
      block.add(maze);
      /*for (let j = 0, m = section.maze.length; j < m; j += 1) {
        const data = section.maze[j];
        const maze = createMaze(data, texture);
        block.add(maze);
      }*/
    } else if (section.maze != null) {
      const maze = createMaze([section.maze], texture);
      block.add(maze);
    }

    if (Array.isArray(section.cylinder)) {
      for (let j = 0, m = section.cylinder.length; j < m; j += 1) {
        const data = section.cylinder[j];
        const cylinder = createCylinder(data, texture);
        block.add(cylinder);
      }
    } else if (section.cylinder != null) {
      const sylinder = createCylinder(section.cylinder, texture);
      block.add(sylinder);
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
      } else {
        block.position.set(offset.x, offset.y, offset.z);
      }
    }

    stage.add(block);
  }
  return stage;
};

export default createStage;
