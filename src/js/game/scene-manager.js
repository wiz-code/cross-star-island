import Stats from 'three/addons/libs/stats.module.js';

class SceneManager {
  constructor(container, renderer) {
    this.container = container;
    this.renderer = renderer;
    this.list = new Map();

    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = 'auto';
    this.stats.domElement.style.bottom = 0;

    this.enableStats();
  }

  enableStats(bool = true) {
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

    this.stats.update();
  }
}

export default SceneManager;
