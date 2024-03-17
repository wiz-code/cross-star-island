import { Texture } from 'three';
import { Screen } from './settings';
import sprites from './sprites';

const { PI } = Math;

const textureMap = new Map([
  ['point', ['crossStar']],
  ['pointThin', ['crossStarThin']],
  ['virticalIndicator', ['isoscelesTriangle', -PI / 2]],
  ['directionIndicator', ['direction']],
  ['centerMark', ['isoscelesTriangle', -PI / 2, true]],
  ['sight', ['sight']],
  ['sightLines', ['sightLines']],
]);

class TextureManager {
  constructor() {
    this.canvasMap = new Map();
    this.contextMap = new Map();
    this.textureMap = new Map();

    const entries = textureMap.entries();

    for (const [name, params] of entries) {
      const [spriteName, ...args] = params;
      this.create(name, spriteName, args);
    }
  }

  create(name, spriteName, args) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    sprites[spriteName](context, ...args);
    const texture = new Texture(canvas);
    texture.needsUpdate = true;

    this.canvasMap.set(name, canvas);
    this.contextMap.set(name, context);
    this.textureMap.set(name, texture);
  }

  toObject() {
    const entries = Array.from(this.textureMap.entries());
    const textureObject = Object.fromEntries(entries);
    return textureObject;
  }

  dispose(name) {
    this.canvasMap.delete(name);
    this.contextMap.delete(name);
    const texture = this.textureMap.get(name);
    texture.dispose();
    this.textureMap.delete(name);
  }

  disposeAll() {
    const keys = this.textureMap.keys();

    for (const key of keys) {
      this.dispose(key);
    }
  }
}

export default TextureManager;
