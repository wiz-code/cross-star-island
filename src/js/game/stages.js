import { Group } from 'three';

import {
  Scene,
  Camera,
  Renderer,
  Light,
  PlayerSettings,
  ResizeDelayTime,
  Grid,
  Ground,
} from './settings';
import { createGrid } from './grid';
import { createGround } from './ground';

const stages = {
  firstStage: () => {
    const grid = createGrid(
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
    stage.add(ground);

    return stage;
  },
};

export default stages;
