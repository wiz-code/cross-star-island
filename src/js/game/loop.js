class Loop {
  constructor(callback, object = null) {
    this.id = 0;
    this.disabled = false;
    this.callback = callback.bind(object);
    this.loop = this.loop.bind(this);
  }

  enable() {
    this.disabled = true;
  }

  disable() {
    this.disabled = false;
  }

  loop() {
    if (!this.disabled) {
      this.id = requestAnimationFrame(this.loop);
      this.callback();
    }
  }

  isActive() {
    return this.id !== 0;
  }

  start() {
    if (this.id === 0) {
      this.id = requestAnimationFrame(this.loop);
    }
  }

  stop() {
    if (this.id !== 0) {
      clearTimeout(this.id);
      this.id = 0;
    }
  }
}

export default Loop;
