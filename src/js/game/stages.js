import { Vector3, Group, ArrowHelper } from 'three';

import {
  Scene,
  Camera,
  Renderer,
  Stages,
  Light,
  PlayerSettings,
  ResizeDelayTime,
  Grid,
  Ground,
} from './settings';
import { createGrid, createFineGrid } from './grid';
import { createGround } from './ground';

export const createStage = (name) => {
  const { components } = Stages[name];
  const stage = new Group();

  for (let i = 0, l = components.length; i < l; i += 1) {
    const component = components[i];
    const block = new Group();

    if (component.grid != null) {
      const grid = createGrid.apply(null, component.grid);
      const fineGrid = createFineGrid.apply(null, component.grid);
      block.add(grid);
      block.add(fineGrid);
    }

    if (component.ground != null) {
      const ground = createGround.apply(null, component.ground);
      block.add(ground);
    }

    if (component.arrow != null) {
      const direction = component.arrow.direction ?? new THREE.Vector3(0, 0, -1);
      const position = component.arrow.position ?? new THREE.Vector3(0, 0, 0);
      const length = component.arrow.length ?? 1;
      const color = component.arrow.color ?? 0xffffff;
      const arrow = new ArrowHelper(direction, position, length, color, length * 0.4, length * 0.1);
      block.add(arrow);
    }

    stage.add(block);
  }

  return stage;
};

const stages = {
  firstStage() {
    const grid = createGrid(
      20,
      12,
      10,
      80,
      80,
      80
    );
    const fineGrid = createFineGrid(
      20,
      12,
      10,
      80,
      80,
      80
    );

    const ground = createGround(
      20,
      3,
      80,
      80,
      2,
      { x: 0, y: -200, z: 0 },
      { x: 0, y: 0, z: 0.3 }
    );

    const stage = new Group();
    stage.add(grid);
    stage.add(fineGrid);
    stage.add(ground);

    return stage;
  },
};

export default stages;
