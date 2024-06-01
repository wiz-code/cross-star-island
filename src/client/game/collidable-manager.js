import { Vector3 } from 'three';

import { World } from './settings';
import Publisher from './publisher';

const { sqrt, cos, PI } = Math;

const RAD_30 = (30 / 360) * PI * 2;
const COS_30 = cos(RAD_30);

class CollidableManager extends Publisher {
  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  #vecD = new Vector3();

  #vecE = new Vector3();

  constructor(game, scene, eventManager, worldOctree) {
    super();

    this.game = game;
    this.scene = scene;
    this.eventManager = eventManager;
    this.worldOctree = worldOctree;
    this.list = new Set();
  }

  add(collidable) {
    if (collidable.type !== 'character' || !collidable.hasControls) {
      this.scene.add(collidable.object);
    }

    this.list.add(collidable);
  }

  remove(collidable) {
    if (this.list.has(collidable)) {
      if (collidable.type !== 'character' || !collidable.hasControls) {
        this.scene.remove(collidable.object);
      }

      this.list.delete(collidable);
    }
  }

  clearList() {
    this.list.forEach((collidable) => this.remove(collidable));
  }

  dispose() {
    this.list.forEach((collidable) => collidable.dispose());
    this.clearList();
    this.clear();
  }

  effect(object, target) {//////////////
    switch (object.type) {
      case 'item': {
        object.setAlive(false);

        if (!object.consumable) {
          const time = object.disableTime * 1000;
          setTimeout(() => {
            object.setAlive(true);
          }, time);
        }

        this.eventManager.dispatch(
          'get-item',
          object.name,
          target,
          object,
        );
        break;
      }

      default: {}
    }
  }

  collisions() {
    const list = Array.from(this.list.keys());
    const len = this.list.size;

    const playSound = this.game.methods.get('play-sound');
    const { states } = this.game;

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];

      let result;

      if (collidable.type === 'character') {
        const result = this.worldOctree.capsuleIntersect(collidable.collider);
        collidable.setGrounded(false);

        if (result !== false) {
          const onGround = result.normal.y > COS_30;
          collidable.setGrounded(onGround);

          if (!onGround) {
            collidable.velocity.addScaledVector(
              result.normal,
              -result.normal.dot(collidable.velocity),
            );
          }

          collidable.collider.translate(
            result.normal.multiplyScalar(result.depth),
          );
        }
      } else {
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
      }
    }

    for (let i = 0; i < len; i += 1) {
      const a1 = list[i];

      if (a1.isAlive()) {
        for (let j = i + 1; j < len; j += 1) {
          const a2 = list[j];

          if (a2.isAlive()) {
            if (a1.type === 'character' && a2.type === 'character') {
              const a1Center = a1.collider.getCenter(this.#vecA);
              const a2Center = a2.collider.getCenter(this.#vecB);
              const r = a1.data.radius + a2.data.radius;
              const r2 = r * r;

              let collided = false;
              const colliders = [
                a2.collider.start,
                a2.collider.end,
                a2Center,
              ];

              for (let k = 0, l = colliders.length; k < l; k += 1) {
                const point = colliders[k];
                const d2 = point.distanceToSquared(a1Center);

                if (d2 < r2) {
                  collided = true;

                  const normal = this.#vecA
                    .subVectors(point, a1Center)
                    .normalize();
                  const v1 = this.#vecB
                    .copy(normal)
                    .multiplyScalar(normal.dot(a2.velocity));
                  const v2 = this.#vecC
                    .copy(normal)
                    .multiplyScalar(normal.dot(a1.velocity));
                  const vec1 = this.#vecD.subVectors(v2, v1);
                  const vec2 = this.#vecE.subVectors(v1, v2);

                  a2.velocity.addScaledVector(vec1, a1.data.weight);
                  a1.velocity.addScaledVector(vec2, a2.data.weight);

                  const d = (r - sqrt(d2)) / 2;
                  a1.collider.translate(normal.multiplyScalar(-d));
                  a2.collider.translate(normal.multiplyScalar(d));
                }

                if (collided) {
                  this.eventManager.dispatch('collision', a1.name, a1, a2);
                  this.eventManager.dispatch('collision', a2.name, a2, a1);
                }
              }
            } else if (a1.type === 'character' || a2.type === 'character') {
              let character, object;

              if (a1.type === 'character') {
                character = a1;
                object = a2;
              } else if (a2.type === 'character') {
                character = a2;
                object = a1;
              }

              const cCenter = character.collider.getCenter(this.#vecA);
              const oCenter = object.collider.center;
              const r = character.collider.radius + object.collider.radius;
              const r2 = r * r;

              const colliders = [
                character.collider.start,
                character.collider.end,
                cCenter,
              ];

              for (let j = 0, m = colliders.length; j < m; j += 1) {
                const point = colliders[j];
                const d2 = point.distanceToSquared(oCenter);

                if (d2 < r2) {
                  if (!object.isBounced()) {
                    object.setBounced(true);
                  }

                  if (object.type === 'item') {
                    if (character.hasControls) {
                      this.effect(object, character);
                      break;
                    }
                  } else {
                    playSound?.('damage');

                    if (object.type === 'ammo' && !character.hasControls) {
                      const hits = states.get('hits');
                      states.set('hits', hits + 1);
                    }

                    character.setStunning(World.collisionShock);

                    const normal = this.#vecA
                      .subVectors(point, oCenter)
                      .normalize();
                    const v1 = this.#vecB
                      .copy(normal)
                      .multiplyScalar(normal.dot(character.velocity));
                    const v2 = this.#vecC
                      .copy(normal)
                      .multiplyScalar(normal.dot(object.velocity));
                    const vec1 = this.#vecD.subVectors(v2, v1);
                    const vec2 = this.#vecE.subVectors(v1, v2);

                    character.velocity.addScaledVector(vec1, object.data.weight);
                    object.velocity.addScaledVector(vec2, character.data.weight);

                    const d = (r - sqrt(d2)) / 2;
                    oCenter.addScaledVector(normal, -d);
                  }
                }
              }
            } else {
              if (a1.type === 'item' || a2.type === 'item') {
                continue;
              }

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
  }

  update(deltaTime, elapsedTime, damping) {
    const list = Array.from(this.list.keys());
    const len = this.list.size;

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];

      if (collidable.isAlive()) {
        collidable.update(deltaTime, elapsedTime, damping);

        if (
          collidable.type === 'character' &&
          collidable.collider.start.y < World.oob
        ) {
          if (!collidable.hasControls) {
            collidable.setAlive(false);
          }

          this.eventManager.dispatch('oob', 'teleport-character', collidable);
        }
      }
    }

    this.collisions();

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];
      collidable.updatePos();
      //collidable.object.position.copy(collidable.collider.center);
    }
  }
}

export default CollidableManager;
