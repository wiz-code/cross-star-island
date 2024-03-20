import { Vector3, Group, ArrowHelper } from 'three';

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

    if (component.ground != null) {
      const ground = createGround(component.ground, texture);
      block.add(ground);
    }

    if (component.maze != null) {
      const maze = createMaze(component.maze, texture);
      block.add(maze);
    }

    if (component.cylinder != null) {
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

    stage.add(block);
  }
  return stage;
};

export default createStage;