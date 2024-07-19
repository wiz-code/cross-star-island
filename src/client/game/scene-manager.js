import { Color } from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import { Controls, Screen } from './settings';
import {
  createSight,
  sightLines,
  createVerticalFrame,/////////
  createPovIndicator,
  createCenterMark,
} from './screen';

const sightColor = {
  front: new Color(Screen.normalColor),
  pov: new Color(Screen.sightPovColor),
};
const indicatorColor = {
  normal: new Color(Screen.normalColor),
  beyondFov: new Color(Screen.warnColor),
};

const sightLinesColor = {
  normal: new Color(Screen.sightLinesColor),
  wheel: new Color(Screen.sightPovColor),
};

class SceneManager {
  static createIndicators(texture) {
    const povSight = createSight(texture);
    const povSightLines = sightLines(texture);
    const povIndicator = createPovIndicator(texture);
    const centerMark = createCenterMark(texture);
    const verticalFrame = createVerticalFrame(texture);

    return {
      povSight,
      povSightLines,
      povIndicator,
      centerMark,
      verticalFrame,////////
    };
  }

  constructor(container, renderer) {
    this.container = container;
    this.renderer = renderer;
    this.list = new Map();

    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = 'auto';
    this.stats.domElement.style.bottom = 0;

    this.statsEnabled = true;
    this.container.appendChild(this.stats.domElement);
  }

  enableStats(bool = true) {
    this.statsEnabled = bool;

    if (bool) {
      this.container.appendChild(this.stats.domElement);
    } else {
      this.container.removeChild(this.stats.domElement);
    }
  }

  add(name, scene, camera) {
    if (!this.list.has(name)) {
      this.list.set(name, [scene, camera]);
    }
  }

  remove(name) {
    if (this.list.has(name)) {
      this.list.delete(name);
    }
  }

  clear() {
    if (this.list.size > 0) {
      this.list.clear();
    }
  }

  update() {
    this.renderer.clear();

    const list = Array.from(this.list.values());

    for (let i = 0, l = list.length; i < l; i += 1) {
      const params = list[i];
      this.renderer.render(...params);
    }

    if (this.statsEnabled) {
      this.stats.update();
    }
  }
}

export default SceneManager;
