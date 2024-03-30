import { States } from './data';
import Publisher from './publisher';

class EventManager extends Publisher {
  #updaterCache = new Map();

  constructor(states) {
    super();

    this.states = states;
    this.schedules = new Map();
    this.events = new Map();
    this.tweens = new Map();
    this.updaters = new Map();
  }

  addHandler(eventName, targetName, handler, condition = null, once = false) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Map());
    }

    const targets = this.events.get(eventName);

    targets.set(targetName, [handler, condition, once]);
  }

  removeHandler(eventName, targetName, handler, condition = null) {
    if (this.events.has(eventName)) {
      const targets = this.events.get(eventName);

      if (targets.has(targetName)) {
        const [hdlr, cond] = targets.get(targetName);

        if (handler === hdlr && condition === cond) {
          targets.delete(targetName);
        }
      }
    }
  }

  addUpdater(object, state, updater, args) {
    if (!this.updaters.has(object)) {
      this.updaters.set(object, new Map());
    }

    const updaters = this.updaters.get(object);

    if (!updaters.has(state)) {
      updaters.set(state, new Set());
    }

    const updaterSet = updaters.get(state);
    const params = args ?? [];
    const boundUpdater = updater.bind(object, ...params);
    updaterSet.add(boundUpdater);
    this.#updaterCache.set(updater, boundUpdater);
  }

  removeUpdater(object, state, updater) {
    if (this.updaters.has(object)) {
      const updaters = this.updaters.get(object);

      if (updaters.has(state)) {
        const updaterSet = updaters.get(state);

        if (this.#updaterCache.has(updater)) {
          const boundUpdater = this.#updaterCache.get(updater);

          if (updaterSet.has(boundUpdater)){
            updaterSet.delete(boundUpdater);
            this.#updaterCache.delete(updater);
          }
        }
      }
    }
  }

  addTween(object, state, tweener, args) {
    const params = args ?? [];
    const tween = tweener(object, ...params);
    const updater = tween.update.bind(tween);

    if (!this.tweens.has(object)) {
      this.tweens.set(object, new Map());
    }

    const tweens = this.tweens.get(object);

    if (!tweens.has(state)) {
      tweens.set(state, new Set());
    }

    const tweenSet = tweens.get(state);
    tweenSet.add(updater);
  }

  removeTween(object, state, updater) {
    if (this.tweens.has(object)) {
      const tweens = this.tweens.get(object);

      if (tweens.has(state)) {
        const tweenset = tweens.get(state);

        if (tweenset.has(updater)){
          tweenset.delete(updater);
        }
      }
    }
  }

  clear() {}

  dispatch(eventName, targetName, ...args) {
    if (this.events.has(eventName)) {
      const targets = this.events.get(eventName);

      if (targets.has(targetName)) {
        const [handler, condition, once] = targets.get(targetName);

        if (condition != null && !condition(this.states, ...args)) {
          return;
        }

        handler(this.states, ...args);

        if (once) {
          this.removeHandler(eventName, targetName, handler, condition);
        }
      }
    }
  }

  update(deltaTime, elapsedTime) {
    this.updaters.forEach((updaterMap, object) => {
      updaterMap.forEach((updaterSet, state) => {
        switch (state) {
          case States.alive: {
            updaterSet.forEach((updater) => updater(deltaTime, elapsedTime));
            break;
          }

          default: {
            //
          }
        }
      });
    });

    this.tweens.forEach((tweenMap, object) => {
      tweenMap.forEach((tweenSet, state) => {
        switch (state) {
          case States.alive: {
            tweenSet.forEach((updater) => updater(elapsedTime * 1000));
            break;
          }

          default: {
            //
          }
        }
      });
    });
  }
}

export default EventManager;

// イベント種類
// oob, キャラ接触, アイテム取得

// イベント登録・解除

// イベント状態　待機・準備・開始・終了
