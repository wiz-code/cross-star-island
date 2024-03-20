import { Vector3, Group, ArrowHelper } from 'three';

import { World } from './settings';
import { Stages } from './data';

import { createGrid, createFineGrid } from './grid';
import { createGround, createMaze, createCylinder } from './ground';

const data = new Map(Stages);

const createStage = (name, texture) => {
  const { components } = data.get(name);
  const stage = new Group();

  for (let i = 0, l = components.length; i < l; i += 1) {
    const component = components[i];
    const block = new Group();

    if (component.grid != null) {
      const grid = createGrid(component.grid, texture);
      const fineGrid = createFineGrid(component.grid, texture);
      block.add(grid);
      block.add(fineGrid);
    }

    if (Array.isArray(component.ground)) {
      for (let j = 0, m = component.ground.length; j < m; j += 1) {
        const data = component.ground[j];
        const ground = createGround(data, texture);
        block.add(ground);
      }
    } else if (component.ground != null) {
      const ground = createGround(component.ground, texture);
      block.add(ground);
    }

    if (Array.isArray(component.maze)) {
      for (let j = 0, m = component.maze.length; j < m; j += 1) {
        const data = component.maze[j];
        const maze = createMaze(data, texture);
        block.add(maze);
      }
    } else if (component.maze != null) {
      const maze = createMaze(component.maze, texture);
      block.add(maze);
    }

    if (Array.isArray(component.cylinder)) {
      for (let j = 0, m = component.cylinder.length; j < m; j += 1) {
        const data = component.cylinder[j];
        const cylinder = createCylinder(data, texture);
        block.add(cylinder);
      }
    } else if (component.cylinder != null) {
      const sylinder = createCylinder(component.cylinder, texture);
      block.add(sylinder);
    }

    if (component.arrow != null) {
      let direction = new Vector3(0, 0, -1);

      if (component.arrow.direction != null) {
        direction = component.arrow.direction.normalize();
      }

      const position = component.arrow.position ?? new Vector3(0, 0, 0);
      const length = component.arrow.length ?? 1;
      const color = component.arrow.color ?? 0xffffff;
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

    if (component.offset != null) {
      const { offset } = component;

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
