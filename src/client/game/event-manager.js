import { States } from './data';
import Publisher from './publisher';

class EventManager extends Publisher {
  #prevTime = 0;

  constructor(game) {
    super();

    this.game = game;
    this.schedules = new Map();
    this.events = new Map();
    this.tweens = new Map();
    this.updaters = new Map();
  }

  addSchedule(object, schedule) {
    this.schedules.set(object, schedule);
  }

  removeSchedule(object) {
    if (this.schedules.has(object)) {
      this.schedules.delete(object);
    }
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

  addUpdater(object, state, updater) {
    if (!this.updaters.has(object)) {
      this.updaters.set(object, new Map());
    }

    const updaters = this.updaters.get(object);

    if (!updaters.has(state)) {
      updaters.set(state, new Set());
    }

    const updaterSet = updaters.get(state);
    updaterSet.add(updater);
  }

  removeUpdater(object, state, updater) {
    if (this.updaters.has(object)) {
      const updaters = this.updaters.get(object);

      if (updaters.has(state)) {
        const updaterSet = updaters.get(state);
        updaterSet.delete(updater);
      }
    }
  }

  addTween(object, state, tweener, args) {
    const params = args ?? [];
    const tween = tweener(this.game, object, ...params);
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

        if (tweenset.has(updater)) {
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

        if (condition != null && !condition(...args)) {
          return;
        }

        handler(this.game, ...args);

        if (once) {
          this.removeHandler(eventName, targetName, handler, condition);
        }
      }
    }
  }

  update(elapsedTime) {
    const deltaTime = elapsedTime - this.#prevTime;
    this.#prevTime = elapsedTime;

    const schedules = Array.from(this.schedules.entries());

    for (let i = 0, l = schedules.length; i < l; i += 1) {
      const [object, schedule] = schedules[i];

      if (schedule.spawnTime != null && elapsedTime > schedule.spawnTime) {
        object.setAlive(true);
        this.schedules.delete(object);
      }
    }

    this.updaters.forEach((updaterMap, target) => {
      target.getStates().forEach((state) => {
        const updaterSet = updaterMap.get(state);
        updaterSet.forEach((updater) =>
          updater(this.game, target, deltaTime, elapsedTime),
        );
      });
    });

    this.tweens.forEach((tweenMap, target) => {
      target.getStates().forEach((state) => {
        const tweenSet = tweenMap.get(state);
        tweenSet.forEach((tween) => tween(elapsedTime * 1000));
      });
    });
  }
}

export default EventManager;
