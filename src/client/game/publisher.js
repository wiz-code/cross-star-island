class Publisher {
  constructor() {
    this.listeners = new Map();
  }

  getSubscriberCount(eventName) {
    if (this.listeners.has(eventName)) {
      const listeners = this.listeners.get(eventName);
      return listeners.size;
    }

    return 0;
  }

  publish(eventName, ...args) {
    if (this.listeners.has(eventName)) {
      const listeners = this.listeners.get(eventName);
      listeners.forEach((listener) => listener(...args));
    }
  }

  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const listeners = this.listeners.get(eventName);
    listeners.add(callback);
  }

  unsubscribe(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const listeners = this.listeners.get(eventName);
      listeners.delete(callback);
    }
  }

  clear(eventName) {
    if (this.listeners.has(eventName)) {
      const listeners = this.listeners.get(eventName);
      listeners.clear();
    }
  }
}

export default Publisher;
