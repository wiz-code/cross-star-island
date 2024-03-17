import { Vector3, Quaternion, Euler } from 'three';

import { World, Camera } from './settings';

const { PI } = Math;

export const getVectorPos = (position) => {
  const vector = new Vector3();

  if (position.sx != null) {
    const spacing = position.spacing ?? World.spacing;
    vector.set(
      position.sx * spacing,
      position.sy * spacing,
      position.sz * spacing,
    );
  } else {
    vector.set(position.x, position.y, position.z);
  }

  return vector;
};

export const leftToRightHandedQuaternion = (x, y, z, w) =>
  new Quaternion(-x, y, -z, w);

export const visibleChildren = (object, bool) => {
  object.traverse((child) => {
    child.visible = bool;
  });
};
