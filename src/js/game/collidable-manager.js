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
import { Tweens } from './data';
import Publisher from './publisher';
import textures from './textures';

const { exp, sqrt, PI } = Math;

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
textures.crossStar(context);

const texture = new Texture(canvas);
texture.needsUpdate = true;

class CollidableManager extends Publisher {
  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  #vecD = new Vector3();

  #vecE = new Vector3();

  constructor(scene, worldOctree) {
    super();

    this.scene = scene;
    this.worldOctree = worldOctree;
    this.list = new Map();
  }

  // type = 'ammo', 'obstacle'
  add(type, collidable) {
    if (type === 'ammo') {
      const { name, list } = collidable;

      for (let i = 0, l = list.length; i < l; i += 1) {
        const bullet = list[i];
        this.scene.add(bullet.object);
      }

      this.list.set(name, list);

      return;
    }

    this.scene.add(collidable.object);

    if (!this.list.has(type)) {
      this.list.set(type, []);
    }

    const list = this.list.get(type);
    list.push(collidable);
  }

  remove(type, collidable) {
    this.scene.remove(collidable.object);

    let list = this.list.get(type);
    list = list.filter((object) => object !== collidable);
    this.list.set(type, list);
  }

  collisions() {
    const list = Array.from(this.list.values()).flat();

    for (let i = 0, l = list.length; i < l; i += 1) {
      const a1 = list[i];

      for (let j = i + 1; j < l; j += 1) {
        const a2 = list[j];

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

          const vec1 = this.#vecD.subVectors(v2, v1);
          const vec2 = this.#vecE.subVectors(v1, v2);

          a1.velocity.addScaledVector(vec1, a2.weight);
          a2.velocity.addScaledVector(vec2, a1.weight);
          // a1.velocity.add(v2).sub(v1);
          // a2.velocity.add(v1).sub(v2);

          const d = (r - sqrt(d2)) / 2;

          a1.collider.center.addScaledVector(normal, d);
          a2.collider.center.addScaledVector(normal, -d);
        }
      }
    }
    /* for (const list of this.list) {
      for (let i = 0, l = list.length; i < l; i += 1) {
        const a1 = list[i];

        for (let j = i + 1; j < l; j += 1) {
          const a2 = list[j];

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
    } */
  }

  update(deltaTime, damping) {
    const list = Array.from(this.list.values()).flat();

    for (let i = 0, l = list.length; i < l; i += 1) {
      const collidable = list[i];
      collidable.collider.center.addScaledVector(
        collidable.velocity,
        deltaTime,
      );
      const result = this.worldOctree.sphereIntersect(collidable.collider);

      if (result) {
        collidable.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(collidable.velocity) * 1.5,
        );
        collidable.collider.center.add(
          result.normal.multiplyScalar(result.depth),
        );
      } else {
        collidable.velocity.y -= World.gravity * deltaTime /* * 100 */;
      }

      collidable.object.position.copy(collidable.collider.center);

      collidable.velocity.addScaledVector(
        collidable.velocity,
        damping[collidable.type],
      );

      this.publish('collideWith', collidable);
    }

    this.collisions();

    for (let i = 0, l = list.length; i < l; i += 1) {
      const collidable = list[i];
      // オブジェクト固有の挙動をupdate()に記述する
      collidable.update(deltaTime);
    }
  }
}

export default CollidableManager;
