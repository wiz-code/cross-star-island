class Publisher {
  constructor() {
    this.listeners = new Map();
  }

  publish(eventName, ...args) {
    if (this.listeners.has(eventName)) {
      const list = this.listeners.get(eventName);

      for (let i = 0, l = list.length; i < l; i += 1) {
        const listener = list[i];
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
