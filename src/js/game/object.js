import {
  IcosahedronGeometry,
  OctahedronGeometry,
  BufferGeometry,
  WireframeGeometry,
  MeshBasicMaterial,
  MeshNormalMaterial,
  LineBasicMaterial,
  PointsMaterial,
  Mesh,
  LineSegments,
  Points,
  Group,
  Float32BufferAttribute,
  Texture,
  Sphere,
  Vector3,
  NormalBlending,
} from 'three';

import { World, Grid, ObjectSettings } from './settings';
import Publisher from './publisher';
import textures from './textures';

const { exp, sqrt, PI } = Math;

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
textures.crossStar(context);

const texture = new Texture(canvas);
texture.needsUpdate = true;

class CollisionObject extends Publisher {
  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  constructor(scene, worldOctree) {
    super();

    this.scene = scene;
    this.worldOctree = worldOctree;
    this.list = [];
  }

  add(collisionObject) {
    this.scene.add(collisionObject.object);
    this.list.push(collisionObject);
  }

  remove(object) {}

  collisions() {
    for (let i = 0, l = this.list.length; i < l; i += 1) {
      const a1 = this.list[i];

      for (let j = i + 1; j < l; j += 1) {
        const a2 = this.list[j];

        const d2 = a1.collider.center.distanceToSquared(a2.collider.center);
        const r = a1.collider.radius + a2.collider.radius;
        const r2 = r * r;

        if (d2 < r2) {
          const normal = this.#vecA
            .subVectors(a1.collider.center, a2.collider.center)
            .normalize();
          const v1 = this.#vecB
            .copy(normal)
            .multiplyScalar(normal.dot(a1.velocity));
          const v2 = this.#vecC
            .copy(normal)
            .multiplyScalar(normal.dot(a2.velocity));

          a1.velocity.add(v2).sub(v1);
          a2.velocity.add(v1).sub(v2);

          const d = (r - sqrt(d2)) / 2;

          a1.collider.center.addScaledVector(normal, d);
          a2.collider.center.addScaledVector(normal, -d);
        }
      }
    }
  }

  update(deltaTime) {
    const len = this.list.length;

    for (let i = 0; i < len; i += 1) {
      const collisionObject = this.list[i];
      collisionObject.collider.center.addScaledVector(
        collisionObject.velocity,
        deltaTime,
      );
      const result = this.worldOctree.sphereIntersect(collisionObject.collider);

      if (result) {
        collisionObject.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(collisionObject.velocity) * 1.5,
        );
        collisionObject.collider.center.add(
          result.normal.multiplyScalar(result.depth),
        );
      } else {
        collisionObject.velocity.y -= World.gravity * deltaTime * 100;
      }

      const damping = exp(-0.2 * deltaTime) - 1;
      collisionObject.velocity.addScaledVector(
        collisionObject.velocity,
        damping,
      );
      this.publish('collideWith', collisionObject);
    }

    this.collisions();

    for (let i = 0; i < len; i += 1) {
      const collisionObject = this.list[i];
      // オブジェクト固有の挙動をupdate()に記述するようにしたい
      collisionObject.update();

      // collisionObject.object.rotation.x +=
      // deltaTime * ObjectSettings.rotateSpeed;
      collisionObject.object.rotation.z -=
        deltaTime * ObjectSettings.rotateSpeed;
      collisionObject.object.position.copy(collisionObject.collider.center);
    }
  }

  static createStone(size = 1, detail = 0, weight = 1) {
    const geom = new IcosahedronGeometry(size, detail);
    const wireframeGeom = new WireframeGeometry(geom);

    const pointsGeom = new OctahedronGeometry(size + 4, detail);
    const pointsVertices = pointsGeom.attributes.position.array.slice(0);

    const bufferGeom = new BufferGeometry();
    bufferGeom.setAttribute(
      'position',
      new Float32BufferAttribute(pointsVertices, 3),
    );
    bufferGeom.computeBoundingSphere();

    const mat = new MeshBasicMaterial({
      color: ObjectSettings.color,
    });
    const wireframeMat = new LineBasicMaterial({
      color: ObjectSettings.wireframeColor,
    });

    const pointsMat = new PointsMaterial({
      color: ObjectSettings.pointsColor,
      size: Grid.size,
      map: texture,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    const mesh = new Mesh(geom, mat);
    const wireMesh = new LineSegments(wireframeGeom, wireframeMat);
    const pointsMesh = new Points(bufferGeom, pointsMat);

    const object = new Group();
    object.add(mesh);
    object.add(wireMesh);
    object.add(pointsMesh);

    const collisionObject = {
      object,
      collider: new Sphere(new Vector3(), size),
      velocity: new Vector3(),
      weight,
      update() {},
    };

    return collisionObject;
  }
}

export default CollisionObject;
