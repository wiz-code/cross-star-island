class Publisher {
  constructor() {
    this.listeners = new Map();
  }

  publish(eventName, ...args) {
    if (this.listeners.has(eventName)) {
      const list = this.listeners.get(eventName);

      for (const listener of list) {
        listener(...args);
      }
    }
  }

  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    const list = this.listeners.get(eventName);
    list.push(callback);
  }

  unsubscribe(eventName, callback) {
    if (this.listeners.has(eventName)) {
      let list = this.listeners.get(eventName);
      list = list.filter((listener) => listener !== callback);
      this.listeners.set(eventName, list);
    }
  }
}

export default Publisher;
