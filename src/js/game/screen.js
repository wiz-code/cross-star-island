import { Texture, SpriteMaterial, Sprite } from 'three';
import { Screen } from './settings';
import textures from './textures';

const { PI, floor } = Math;

const canvas = {};
const context = {};
const texture = {};

canvas.povIndicator = {};
context.povIndicator = {};
texture.povIndicator = {};

canvas.povIndicator.horizontal = document.createElement('canvas');
context.povIndicator.horizontal = canvas.povIndicator.horizontal.getContext('2d');
textures.isoscelesTriangle(context.povIndicator.horizontal, PI);
texture.povIndicator.horizontal = new Texture(canvas.povIndicator.horizontal);
texture.povIndicator.horizontal.needsUpdate = true;

canvas.povIndicator.virtical = document.createElement('canvas');
context.povIndicator.virtical = canvas.povIndicator.virtical.getContext('2d');
textures.isoscelesTriangle(context.povIndicator.virtical, -PI / 2);
texture.povIndicator.virtical = new Texture(canvas.povIndicator.virtical);
texture.povIndicator.virtical.needsUpdate = true;

canvas.povCenterMark = {};
context.povCenterMark = {};
texture.povCenterMark = {};

canvas.povCenterMark.horizontal = document.createElement('canvas');
context.povCenterMark.horizontal = canvas.povCenterMark.horizontal.getContext('2d');
textures.isoscelesTriangle(context.povCenterMark.horizontal, PI, true);
texture.povCenterMark.horizontal = new Texture(canvas.povCenterMark.horizontal);
texture.povCenterMark.horizontal.needsUpdate = true;

canvas.povCenterMark.virtical = document.createElement('canvas');
context.povCenterMark.virtical = canvas.povCenterMark.virtical.getContext('2d');
textures.isoscelesTriangle(context.povCenterMark.virtical, -PI / 2, true);
texture.povCenterMark.virtical = new Texture(canvas.povCenterMark.virtical);
texture.povCenterMark.virtical.needsUpdate = true;

canvas.sight = document.createElement('canvas');
context.sight = canvas.sight.getContext('2d');
textures.sight(context.sight);
texture.sight = new Texture(canvas.sight);
texture.sight.needsUpdate = true;

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

export const createCenterMark = () => {
  const material = {};

  material.horizontal = new SpriteMaterial({
    color: 0xffffff,
    map: texture.povCenterMark.horizontal,
  });

  material.virtical = new SpriteMaterial({
    color: 0xffffff,
    map: texture.povCenterMark.virtical,
  });

  const sprite = {};

  sprite.horizontal = new Sprite(material.horizontal);
  sprite.horizontal.scale.set(Screen.sightPovSize * 0.5, Screen.sightPovSize * 0.5, 0);
  sprite.horizontal.position.setZ(-20);

  sprite.virtical = new Sprite(material.virtical);
  sprite.virtical.scale.set(Screen.sightPovSize * 0.5, Screen.sightPovSize * 0.5, 0);
  sprite.virtical.position.setZ(-20);

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

  sprite.horizontal = new Sprite(material.horizontal);
  sprite.horizontal.visible = false;
  sprite.horizontal.scale.set(Screen.sightPovSize, Screen.sightPovSize, 0);
  sprite.horizontal.position.setZ(-10);

  sprite.virtical = new Sprite(material.virtical);
  sprite.virtical.visible = false;
  sprite.virtical.scale.set(Screen.sightPovSize, Screen.sightPovSize, 0);
  sprite.virtical.position.setZ(-10);

  return sprite;
};
