import { Texture, SpriteMaterial, Sprite } from 'three';
import { Screen } from './settings';
import textures from './textures';

const { PI } = Math;

const canvas = {};
const context = {};
const texture = {};

canvas.povIndicator = {};
context.povIndicator = {};
texture.povIndicator = {};

canvas.povIndicator.horizontal = document.createElement('canvas');
context.povIndicator.horizontal =
  canvas.povIndicator.horizontal.getContext('2d');
textures.isoscelesTriangle(context.povIndicator.horizontal, PI);
texture.povIndicator.horizontal = new Texture(canvas.povIndicator.horizontal);
texture.povIndicator.horizontal.needsUpdate = true;

canvas.povIndicator.virtical = document.createElement('canvas');
context.povIndicator.virtical = canvas.povIndicator.virtical.getContext('2d');
textures.isoscelesTriangle(context.povIndicator.virtical, -PI / 2);
texture.povIndicator.virtical = new Texture(canvas.povIndicator.virtical);
texture.povIndicator.virtical.needsUpdate = true;

canvas.povCenterMark = document.createElement('canvas');
context.povCenterMark = canvas.povCenterMark.getContext('2d');
textures.isoscelesTriangle(context.povCenterMark, -PI / 2, true);
texture.povCenterMark = new Texture(canvas.povCenterMark);
texture.povCenterMark.needsUpdate = true;

canvas.sight = document.createElement('canvas');
context.sight = canvas.sight.getContext('2d');
textures.sight(context.sight);
texture.sight = new Texture(canvas.sight);
texture.sight.needsUpdate = true;

canvas.sightLines = document.createElement('canvas');
context.sightLines = canvas.sightLines.getContext('2d');
textures.sightLines(context.sightLines);
texture.sightLines = new Texture(canvas.sightLines);
texture.sightLines.needsUpdate = true;

canvas.direction = document.createElement('canvas');
context.direction = canvas.direction.getContext('2d');
textures.direction(context.direction);
texture.direction = new Texture(canvas.direction);
texture.direction.needsUpdate = true;

export const createSight = () => {
  const material = new SpriteMaterial({
    color: 0xffffff,
    map: texture.sight,
  });

  const sprite = new Sprite(material);
  sprite.scale.set(Screen.sightSize, Screen.sightSize, 0);
  sprite.position.set(0, 0, -10);

  return sprite;
};

export const sightLines = () => {
  const material = new SpriteMaterial({
    color: Screen.sightLinesColor,
    map: texture.sightLines,
  });

  const sprite = new Sprite(material);
  sprite.scale.set(Screen.sightLinesSize, Screen.sightLinesSize, 0);
  sprite.position.set(0, 0, -10);

  return sprite;
};

export const createCenterMark = () => {
  const material = new SpriteMaterial({
    color: 0xffffff,
    map: texture.povCenterMark,
  });

  const sprite = new Sprite(material);
  sprite.scale.set(Screen.sightPovSize * 0.5, Screen.sightPovSize * 0.5, 0);
  sprite.position.setZ(-20);

  return sprite;
};

export const createPovIndicator = () => {
  const sprite = {};

  const material = {};
  material.horizontal = new SpriteMaterial({
    color: 0xffffff,
    map: texture.povIndicator.horizontal,
  });
  material.virtical = new SpriteMaterial({
    color: 0xffffff,
    map: texture.povIndicator.virtical,
  });
  material.direction = new SpriteMaterial({
    color: 0xffffff,
    map: texture.direction,
  });

  /* sprite.horizontal = new Sprite(material.horizontal);
  sprite.horizontal.visible = false;
  sprite.horizontal.scale.set(Screen.sightPovSize, Screen.sightPovSize, 0);
  sprite.horizontal.position.setZ(-10); */

  sprite.virtical = new Sprite(material.virtical);
  sprite.virtical.visible = false;
  sprite.virtical.scale.set(Screen.sightPovSize, Screen.sightPovSize, 0);
  sprite.virtical.position.setZ(-10);

  sprite.horizontal = new Sprite(material.direction);
  sprite.horizontal.visible = false;
  sprite.horizontal.scale.set(128, 128, 0);
  sprite.horizontal.position.setZ(-10);

  return sprite;
};
