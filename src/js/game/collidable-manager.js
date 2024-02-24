import {
  Texture,
  Sphere,
  Vector3,
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
    this.schedules = new Map();
  }

  // type = 'ammo', 'obstacle'
  add(type, collidable, data = null) {
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
    this.schedules.set(collidable, data.spawnedAt);
  }

  remove(type, collidable) {
    this.scene.remove(collidable.object);

    let list = this.list.get(type);
    list = list.filter((object) => object !== collidable);
    this.list.set(type, list);
  }

  clear(type = null) {
    if (type == null) {
      this.list.clear();
      return;
    }

    this.list.delete(type);
  }

  collisions() {
    const list = Array.from(this.list.values()).flat();
    const len = list.length;

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];

      const result = this.worldOctree.sphereIntersect(collidable.collider);

      if (result) {
        if (!collidable.isBounced()) {
          collidable.setBounced(true);
        }

        collidable.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(collidable.velocity) * 1.5,
        );
        collidable.collider.center.add(
          result.normal.multiplyScalar(result.depth),
        );
      }

      if (collidable.isActive()) {
        this.publish('collideWith', collidable);
      }
    }

    for (let i = 0; i < len; i += 1) {
      const a1 = list[i];

      if (a1.isActive()) {
        for (let j = i + 1; j < len; j += 1) {
          const a2 = list[j];

          if (a2.isActive()) {
            const d2 = a1.collider.center.distanceToSquared(a2.collider.center);
            const r = a1.data.radius + a2.data.radius;
            const r2 = r * r;

            if (d2 < r2) {
              if (!a1.isBounced()) {
                a1.setBounced(true);
              }

              if (!a2.isBounced()) {
                a2.setBounced(true);
              }

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

              a1.velocity.addScaledVector(vec1, a2.data.weight);
              a2.velocity.addScaledVector(vec2, a1.data.weight);

              const d = (r - sqrt(d2)) / 2;

              a1.collider.center.addScaledVector(normal, d);
              a2.collider.center.addScaledVector(normal, -d);
            }
          }
        }
      }
    }
  }

  update(deltaTime, elapsedTime, damping) {
    const schedules = Array.from(this.schedules.entries());

    for (let i = 0, l = schedules.length; i < l; i += 1) {
      const [object, spawnedAt] = schedules[i];

      if (elapsedTime > spawnedAt) {
        if (!object.isActive()) {
          object.setActive(true);
        }
      }
    }

    const list = Array.from(this.list.values()).flat();
    const len = list.length;

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];
      // オブジェクト固有の挙動をupdate()に記述する
      collidable.update(deltaTime, elapsedTime, damping);
    }

    this.collisions();

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];
      collidable.object.position.copy(collidable.collider.center);
    }
  }
}

export default CollidableManager;
