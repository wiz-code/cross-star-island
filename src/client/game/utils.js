import { Vector3, Plane, Line3, Ray, Sphere, Quaternion } from 'three';
import { Game, World } from './settings';

const { abs, sqrt } = Math;

export const genId = (() => {
  const id = {};

  const closure = (type = 'id') => {
    if (id[type] == null) {
      id[type] = 0;
    }

    id[type] += 1;

    const typedId = `${type}-${id[type]}`;
    return typedId;
  };

  return closure;
})();

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

export const triangleSphereIntersect = (() => {
  const plane = new Plane();
  const v1 = new Vector3();
  const v2 = new Vector3();
  const v3 = new Vector3();
  const v4 = new Vector3();
  const line = new Line3();

  return (sphere, triangle, pl = null) => {
    const { center, radius } = sphere;

    if (pl == null) {
      triangle.getPlane(plane);
    } else {
      plane.copy(pl);
    }

    let depth = plane.distanceToSphere(sphere);

    if (depth > 0 || depth < -radius) {
      return false;
    }

    plane.projectPoint(center, v1);

    if (triangle.containsPoint(v1)) {
  		return {
        normal: plane.normal.clone(),
        depth: abs(depth),
      };
  	}

    const lines = [
  		[triangle.a, triangle.b],
  		[triangle.b, triangle.c],
  		[triangle.c, triangle.a],
  	];

    const r2 = radius * radius;
    let closest = 0;

  	for (let i = 0, l = lines.length; i < l; i += 1) {
  		line.set(lines[i][0], lines[i][1]);
  		line.closestPointToPoint(center, true, v2);

      v3.subVectors(center, v2);

  		const d = v3.lengthSq();

      if (
        d < r2 &&
        (i === 0 || d < closest)
      ) {
        v4.copy(v3);
        closest = d;
      }
  	}

    depth = radius - sqrt(closest);

    if (depth > 0 || depth < -radius) {
      return false;
    }

    return {
      normal: v4.clone().normalize(),
      depth,
    };
  };
})();

export const triangleCapsuleIntersect = (() => {
  const plane = new Plane();
  const v1 = new Vector3();
  const v2 = new Vector3();
  const v3 = new Vector3();
  const tip = new Vector3();
  const base = new Vector3();
  const line1 = new Line3();
  const line2 = new Line3();
  const capsuleNormal = new Vector3();
  const planeNormal = new Vector3();
  const lineEndOffset = new Vector3();
  const intersection = new Vector3();
  const reference = new Vector3();
  const center = new Vector3();
  const midpoint = new Vector3();
  const ray = new Ray();
  const sphere = new Sphere();

  return (capsule, triangle) => {
    const { start, end, radius } = capsule;
    triangle.getPlane(plane);

    capsuleNormal.subVectors(end, start).normalize();
    planeNormal.copy(plane.normal);
    lineEndOffset.copy(capsuleNormal).multiplyScalar(radius);
    tip.copy(end).add(lineEndOffset);
    base.copy(start).sub(lineEndOffset);
    line1.set(start, end);

    if (planeNormal.dot(capsuleNormal) === 0) {
      let closest = 0;
      const vertices = [triangle.a, triangle.b, triangle.c];

    	for (let i = 0, l = vertices.length; i < l; i += 1) {
        const vertex = vertices[i];
    		line1.closestPointToPoint(vertex, true, center);

        v1.subVectors(center, vertex);
    		const d = v1.lengthSq();

        if (i === 0 || d < closest) {
          closest = d;
        }
    	}

      return triangleSphereIntersect(sphere.set(center, radius), triangle, plane);
    }

    ray.set(base, capsuleNormal);
    ray.intersectPlane(plane, intersection);

    if (triangle.containsPoint(intersection)) {
      line1.closestPointToPoint(intersection, true, center);
      return triangleSphereIntersect(sphere.set(center, radius), triangle, plane);
    } else {
      let closest = 0;
      const lines = [
    		[triangle.a, triangle.b],
    		[triangle.b, triangle.c],
    		[triangle.c, triangle.a],
    	];

    	for (let i = 0, l = lines.length; i < l; i += 1) {
    		line2.set(lines[i][0], lines[i][1]);
    		line2.closestPointToPoint(intersection, true, v1);

        v2.subVectors(intersection, v1);
    		const d = v2.lengthSq();

        if (i === 0 || d < closest) {
          reference.copy(v1);
          closest = d;
        }
    	}
    }

    line1.closestPointToPoint(reference, true, center);
    return triangleSphereIntersect(sphere.set(center, radius), triangle, plane);
  };
})();

export const getCapsuleBoundingBox = (() => {
  const vecMin = new Vector3();
  const vecMax = new Vector3();

  return (collider, box) => {
    vecMin.x = collider.start.x - collider.radius;
    vecMin.y = collider.start.y - collider.radius;
    vecMin.z = collider.start.z - collider.radius;
    vecMax.x = collider.end.x + collider.radius;
    vecMax.y = collider.end.y + collider.radius;
    vecMax.z = collider.end.z + collider.radius;
    box.set(vecMin, vecMax);
    return box;
  };
})();

export const getOffsetPos = (position, offset, count) => {
  const { array } = position;
  const typedOffsetEnd = offset + (count * 3);
  const pos = array.subarray(offset, typedOffsetEnd);
  return pos;
};
