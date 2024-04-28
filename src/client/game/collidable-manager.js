import { Vector3 } from 'three';

import Publisher from './publisher';
import sprites from './sprites';

const { sqrt } = Math;

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
    this.list = new Set();
  }

  removeAll(key, value) {
    const list = Array.from(this.list.keys());

    for (let i = 0, l = list.length; i < l; i += 1) {
      const collidable = list[i];

      if (collidable[key] === value) {
        this.scene.remove(collidable.object);
        this.list.delete(collidable);
      }
    }
  }

  add(collidable) {
    if (Array.isArray(collidable)) {
      for (let i = 0, l = collidable.length; i < l; i += 1) {
        const object = collidable[i];
        this.scene.add(object.object);
        this.list.add(object);
      }

      return;
    }

    this.scene.add(collidable.object);
    this.list.add(collidable);
  }

  remove(collidable) {
    this.scene.remove(collidable.object);
    this.list.delete(collidable);
  }

  clear() {
    const list = Array.from(this.list.keys());

    for (let i = 0, l = list.length; i < l; i += 1) {
      const collidable = list[i];
      this.scene.remove(collidable.object);
    }

    this.list.clear();
  }

  collisions() {
    const list = Array.from(this.list.keys());
    const len = this.list.size;

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];

      const result = this.worldOctree.sphereIntersect(collidable.collider);

      if (result !== false) {
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

      if (collidable.isAlive()) {
        this.publish('collideWith', collidable);
      }
    }

    for (let i = 0; i < len; i += 1) {
      const a1 = list[i];

      if (a1.isAlive() && a1.type !== 'item') {
        for (let j = i + 1; j < len; j += 1) {
          const a2 = list[j];

          if (a2.isAlive() && a2.type !== 'item') {
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
    const list = Array.from(this.list.keys());
    const len = this.list.size;

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];
      collidable.update(deltaTime, elapsedTime, damping);
    }

    this.collisions();

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];
      collidable.object.position.copy(collidable.collider.center);
      collidable.object.rotation.y = collidable.rotation.phi;
    }
  }
}

export default CollidableManager;
