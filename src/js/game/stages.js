import { Vector3, Group } from 'three';

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

    const grid = createGrid.apply(null, component.grid);
    const fineGrid = createFineGrid.apply(null, component.grid);
    const ground = createGround.apply(null, component.ground);

    const block = new Group();
    block.add(grid);
    block.add(fineGrid);
    block.add(ground);

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
