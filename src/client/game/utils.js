import { Vector3, Quaternion } from 'three';

import { World } from './settings';

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

export const addOffsetToPosition = (position, offset) => {
  const result = {};

  if (position.sx != null) {
    result.sx = position.sx + offset.sx;
    result.sy = position.sy + offset.sy;
    result.sz = position.sz + offset.sz;
  } else {
    result.x = position.x + offset.x;
    result.y = position.y + offset.y;
    result.z = position.z + offset.z;
  }

  return result;
};

export const leftToRightHandedQuaternion = (x, y, z, w) =>
  new Quaternion(-x, y, -z, w);

export const visibleChildren = (object, bool) => {
  object.traverse((child) => {
    child.visible = bool;
  });
};

export const disposeObject = (object) => {
  if (object?.dispose !== undefined) {
    object.dispose();
  }

  if (object.geometry?.dispose !== undefined) {
    object.geometry.dispose();
  }

  if (object.material?.dispose !== undefined) {
    object.material.dispose();
  }
};
