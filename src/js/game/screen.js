import { Texture, SpriteMaterial, Sprite } from 'three';
import { Screen } from './settings';
import textures from './textures';

const { floor } = Math;

export const createSight = (scene) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  textures.sight(context);

  const texture = new Texture(canvas);
  texture.needsUpdate = true;

  const material = new SpriteMaterial({
    color: 0xffffff,
    map: texture,
  });

  const sprite = new Sprite(material);
  sprite.scale.set(64, 64, 0);
  sprite.position.set(0, 0, -10);

  return sprite;
};
