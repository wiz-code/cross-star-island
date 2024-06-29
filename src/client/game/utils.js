import { Vector3, Plane, Line3, Ray, Quaternion } from 'three';
import { Game, World } from './settings';

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

  return (sphere, triangle, hasControls) => {
    triangle.getPlane(plane);

    let depth = plane.distanceToSphere(sphere);

    if (depth > 0 || depth < -sphere.radius) {
      return false;
    }

    plane.projectPoint(sphere.center, v1);

    if (triangle.containsPoint(v1)) {
  		return {
        normal: plane.normal.clone(),
        depth: Math.abs(depth),
      };
  	}

    const lines = [
  		[triangle.a, triangle.b],
  		[triangle.b, triangle.c],
  		[triangle.c, triangle.a],
  	];

    const r2 = sphere.radius * sphere.radius;
    let closest = 0;

  	for (let i = 0, l = lines.length; i < l; i += 1) {
  		line.set(lines[i][0], lines[i][1]);
  		line.closestPointToPoint(sphere.center, true, v2);

      v3.subVectors(sphere.center, v2);

  		const d = v3.lengthSq();

      if (
        d < r2 &&
        (i === 0 || d < closest)
      ) {
        v4.copy(v3);
        closest = d;
      }
  	}

    depth = sphere.radius - Math.sqrt(closest);

    if (depth > 0 || depth < -sphere.radius) {
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
  const ray = new Ray();

  return (capsule, triangle) => {
    triangle.getPlane(plane);

    capsuleNormal.subVectors(capsule.end, capsule.start).normalize();
    planeNormal.copy(plane.normal);
    lineEndOffset.copy(capsuleNormal).multiplyScalar(capsule.radius);
    tip.copy(capsule.end).add(lineEndOffset);
    base.copy(capsule.start).sub(lineEndOffset);
    line1.set(capsule.start, capsule.end);

    if (planeNormal.dot(capsuleNormal) === 0) {
      line1.closestPointToPoint(triangle.a, true, center);

      const depth = plane.distanceToPoint(center) - capsule.radius;

      if (depth > 0 || depth < -capsule.radius) {
        return false;
      }

      return {
        normal: planeNormal.clone(),
        depth: Math.abs(depth),
      };
    }

    ray.set(base, capsuleNormal);
    ray.intersectPlane(plane, intersection);

    if (triangle.containsPoint(intersection)) {
      line1.closestPointToPoint(intersection, true, center);
      const depth = plane.distanceToPoint(center) - capsule.radius;

      if (depth > 0 || depth < -capsule.radius) {
        return false;
      }

      return {
        normal: planeNormal.clone(),
        depth: Math.abs(depth),
      };
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

    v3.subVectors(center, reference);
    const depth = v3.length() - capsule.radius;

    if (depth > 0 || depth < -capsule.radius) {
      return false;
    }

    return {
      normal: v3.clone().normalize(),
      depth: Math.abs(depth),
    };
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
    box.min.copy(vecMin);
    box.max.copy(vecMax);
    return box;
  };
})();
