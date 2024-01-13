class Publisher {
  constructor() {
    this.listeners = new Map();
  }

  publish(eventName, arg = null) {
    if (this.listeners.has(eventName)) {
      const listener = this.listeners.get(eventName);
      listener(arg);
    }
  }

  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, callback);
    }
  }

  unsubscribe(eventName) {
    if (this.listeners.has(eventName)) {
      this.listeners.delete(eventName);
    }
  }
}

export default Publisher;
