import { AudioLoader, Audio, AudioListener } from 'three';

import { Sounds } from './data';
import { Url } from './settings';

class SoundManager {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.list = new Map();
    this.data = new Map(Sounds);
    this.listener = new AudioListener();
    this.loader = new AudioLoader();

    this.camera.add(this.listener);
  }

  loadFile(name) {
    const file = this.data.get(name);
    const url = `${Url.sounds}${file}`;

    const promise = new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (buffer) => resolve([name, buffer]),
        (xhr) => {},
        (e) => reject(e),
      );
    });

    return promise;
  }

  loadSounds(data = this.data) {
    const map = new Map(data);
    const keys = Array.from(map.keys());
    const promises = [];

    for (let i = 0, l = keys.length; i < l; i += 1) {
      const key = keys[i];
      const promise = this.loadFile(key);
      promises.push(promise);
    }

    return Promise.allSettled(promises).then((results) => {
      for (let i = 0, l = results.length; i < l; i += 1) {
        const { status, value } = results[i];

        if (status === 'fulfilled') {
          const [name, buffer] = value;
          const sound = new Audio(this.listener);
          sound.setBuffer(buffer);

          this.list.set(name, sound);
        }
      }
    });
  }

  playSound(key, options = {}) {
    if (this.list.has(key)) {
      const sound = this.list.get(key);

      if (typeof options.loop === 'boolean') {
        sound.setLoop(options.loop);
      } else if (typeof options.volume === 'number') {
        sound.setVolume(options.volume);
      }

      const delay = options.delay ?? 0;

      if (sound.isPlaying) {
        sound.stop();
      }

      sound.play(delay);
    }
  }
}

export default SoundManager;
