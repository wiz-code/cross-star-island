import { Box3, Vector3, Plane, Line3, Ray, Sphere, Quaternion } from 'three';
import { Game, World } from './settings';
import Capsule from './capsule';

const { abs, sqrt, min, max } = Math;
const EPS = 1e-10;

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

export const lineToLineClosestPoints = (() => {
  const l1 = new Line3();
  const l2 = new Line3();
  const p1 = new Vector3();
  const p2 = new Vector3();
  const p3 = new Vector3();

  return (line1, line2, target1, target2) => {
  	const r = p1.copy(line1.end).sub(line1.start);
  	const s = p2.copy(line2.end).sub(line2.start);
  	const w = p3.copy(line2.start ).sub(line1.start);

  	const a = r.dot(s), b = r.dot(r), c = s.dot(s), d = s.dot(w), e = r.dot(w);

  	let t1, t2;
  	const divisor = b * c - a * a;

  	if (abs(divisor) < EPS) {
  		const d1 = -d / c;
  		const d2 = (a - d) / c;

  		if (abs(d1 - 0.5) < abs(d2 - 0.5)) {
  			t1 = 0;
  			t2 = d1;
  		} else {
  			t1 = 1;
  			t2 = d2;
  		}
  	} else {
  		t1 = (d * a + e * c) / divisor;
  		t2 = (t1 * a - d) / c;
  	}

  	t2 = max(0, min(1, t2));
  	t1 = max(0, min( 1, t1));

  	if (target1) {
  		target1.copy(r).multiplyScalar(t1).add(line1.start);
  	}

  	if (target2) {
  		target2.copy(s).multiplyScalar(t2).add(line2.start);
  	}
  };
})();

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

      if (d < r2 && (i === 0 || d < closest)) {
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
  const base = new Vector3();
  const line1 = new Line3();
  const line2 = new Line3();
  const planeNormal = new Vector3();
  const lineEndOffset = new Vector3();
  const intersection = new Vector3();
  const reference = new Vector3();
  const center = new Vector3();
  const midpoint = new Vector3();
  const ray = new Ray();
  const sphere = new Sphere();

  return (capsule, triangle) => {
    const { start, end, radius, normal } = capsule;
    triangle.getPlane(plane);

    planeNormal.copy(plane.normal);
    lineEndOffset.copy(normal).multiplyScalar(radius);
    base.copy(start).sub(lineEndOffset);
    line1.set(start, end);

    if (planeNormal.dot(normal) === 0) {
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

      return triangleSphereIntersect(
        sphere.set(center, radius),
        triangle,
        plane,
      );
    }

    ray.set(base, normal);
    ray.intersectPlane(plane, intersection);

    if (triangle.containsPoint(intersection)) {
      line1.closestPointToPoint(intersection, true, center);
      return triangleSphereIntersect(
        sphere.set(center, radius),
        triangle,
        plane,
      );
    }
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

    line1.closestPointToPoint(reference, true, center);
    return triangleSphereIntersect(sphere.set(center, radius), triangle, plane);
  };
})();

export const getOffsetPos = (position, offset, count) => {
  const { array } = position;
  const typedOffsetEnd = offset + count * 3;
  const pos = array.subarray(offset, typedOffsetEnd);
  return pos;
};

export const getPointsVertices = (vertices, normals) => {
  const newVertices = [];
  const vertexMap = new Map();

  for (let i = 0, l = vertices.length; i < l; i += 3) {
    const vx1 = vertices[i];
    const vy1 = vertices[i + 1];
    const vz1 = vertices[i + 2];

    const key = `${vx1}:${vy1}:${vz1}`;

    if (!vertexMap.has(key)) {
      vertexMap.set(key, new Set());
    }

    const vset = vertexMap.get(key);
    vset.add(i);
  }

  const vertexList = Array.from(vertexMap.entries());
  const normalMap = new Map();

  for (let i = 0, l = vertexList.length; i < l; i += 1) {
    const [key, vertexSet] = vertexList[i];
    const indices = Array.from(vertexSet.keys());

    if (!normalMap.has(key)) {
      normalMap.set(key, new Vector3());
    }

    const vec = normalMap.get(key);

    let x = 0;
    let y = 0;
    let z = 0;

    for (let j = 0, m = indices.length; j < m; j += 1) {
      const index = indices[j];

      const nx = normals[index];
      const ny = normals[index + 1];
      const nz = normals[index + 2];

      x += nx;
      y += ny;
      z += nz;
    }

    vec.set(x, y, z).normalize();
  }

  for (let i = 0, l = vertices.length; i < l; i += 3) {
    const vx1 = vertices[i];
    const vy1 = vertices[i + 1];
    const vz1 = vertices[i + 2];

    const vertex = new Vector3(vx1, vy1, vz1);

    const key = `${vx1}:${vy1}:${vz1}`;
    const normal = normalMap.get(key);

    vertex.add(normal);
    newVertices.push(vertex.x, vertex.y, vertex.z);
  }

  return newVertices;
};

const getCollider = () => {};
const translateCollider = () => {};

export const getCollisionParams = (object, vec) => {
  let center;
  let radius;

  if (object.collider instanceof Capsule) {
    center = object.collider.getCenter(vec);
    ({ radius } = object.collider);
  } else if (object.collider instanceof Sphere) {
    ({ center } = object.collider);
    ({ radius } = object.collider);
  } else if (object.collider instanceof Box3) {
    center = object.collider.getCenter(vec);
    ({ radius } = object.data);
  }

  return { center, radius };
};

const easeInSine = (x) => 1 - cos((x * PI) / 2);
const easeInQuad = (x) => x ** 2;
const easeInCubic = (x) => x ** 3;
const easeInQuart = (x) => x ** 4;
const easeInExpo = (x) => (x === 0 ? 0 : 2 ** (10 * x - 10));
const easeOutQuad = (x) => 1 - (1 - x) ** 2;
const easeInOutQuad = (x) => (x < 0.5 ? 2 * x ** 2 : 1 - (-2 * x + 2) ** 2 / 2);
