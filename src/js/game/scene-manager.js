class SceneManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.list = new Map();
    this.current = null;
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
    //for (const params of this.list) {
    for (let i = 0, l = list.length; i < l; i += 1) {
      const params = list[i];
      this.renderer.render(...params);
    }
  }
}

export default SceneManager;
