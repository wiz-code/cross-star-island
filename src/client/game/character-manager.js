import { Vector3, Euler } from 'three';

import { World } from './settings';
import Publisher from './publisher';

const { sqrt, cos, PI } = Math;

const RAD_30 = (30 / 360) * PI * 2;
const COS_30 = cos(RAD_30);

class CharacterManager extends Publisher {
  #dir = new Vector3(0, 0, -1);

  #side = new Vector3();

  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  #vecD = new Vector3();

  #vecE = new Vector3();

  #euler = new Euler(0, 0, 0, 'YXZ');

  #yawAxis = new Vector3(0, 1, 0);

  #pitchAxis = new Vector3(1, 0, 0);

  #actions = new Set();

  #states = new Set();

  #urgencyRemainingTime = 0;

  #stunningRemainingTime = 0;

  constructor(scene, collidableManager, eventManager, worldOctree) {
    super();

    this.scene = scene;
    this.collidableManager = collidableManager;
    this.eventManager = eventManager;
    this.worldOctree = worldOctree;
    this.list = new Set();

    this.collideWith = this.collideWith.bind(this);
    this.collidableManager.subscribe('collideWith', this.collideWith);
  }

  add(character) {
    if (!this.list.has(character)) {
      if (!character.isFPV()) {
        this.scene.add(character.object);
      }

      this.list.add(character);
    }
  }

  remove(character) {
    if (this.list.has(character)) {
      if (!character.isFPV()) {
        this.scene.remove(character.object);
      }

      this.list.delete(character);
    }
  }

  clear() {
    this.list.forEach((character) => this.remove(character));
  }

  collideWith(object) {
    const list = Array.from(this.list.keys());

    for (let i = 0, l = list.length; i < l; i += 1) {
      const character = list[i];

      if (character.isAlive()) {
        const center = character.collider.getCenter(this.#vecA);
        const objectCenter = object.collider.center;
        const r = character.collider.radius + object.collider.radius;
        const r2 = r * r;

        const colliders = [
          character.collider.start,
          character.collider.end,
          center,
        ];

        for (let j = 0, m = colliders.length; j < m; j += 1) {
          const point = colliders[j];
          const d2 = point.distanceToSquared(objectCenter);

          if (d2 < r2) {
            if (!object.isBounced()) {
              object.setBounced(true);
            }

            if (character.isFPV() && object.type === 'item') {
              object.setAlive(false);
              this.eventManager.dispatch(
                'get-item',
                object.name,
                character,
                object,
              );

              break;
            } else {
              if (!character.isStunning()) {
                if (globalThis.methods.has('play-sound')) {
                  const playSound = globalThis.methods.get('play-sound');
                  playSound('damage');
                }

                character.setStunning(World.collisionShock);
              }

              const normal = this.#vecA
                .subVectors(point, objectCenter)
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
              objectCenter.addScaledVector(normal, -d);
            }
          }
        }
      }
    }
  }

  collisions() {
    const list = Array.from(this.list.keys());
    const len = list.length;

    for (let i = 0; i < len; i += 1) {
      const character = list[i];

      const result = this.worldOctree.capsuleIntersect(character.collider);
      character.setGrounded(false);

      if (result !== false) {
        const onGround = result.normal.y > COS_30;
        character.setGrounded(onGround);

        if (!onGround) {
          character.velocity.addScaledVector(
            result.normal,
            -result.normal.dot(character.velocity),
          );
        }

        character.collider.translate(
          result.normal.multiplyScalar(result.depth),
        );
      }
    }

    if (len >= 2) {
      for (let i = 0; i < len; i += 1) {
        const c1 = list[i];

        if (c1.isAlive()) {
          for (let j = i + 1; j < len; j += 1) {
            const c2 = list[j];

            if (c2.isAlive()) {
              const center = c1.collider.getCenter(this.#vecA);
              const charaCenter = c2.collider.getCenter(this.#vecB);
              const r = c1.data.radius + c2.data.radius;
              const r2 = r * r;

              let collided = false;
              const colliders = [
                c2.collider.start,
                c2.collider.end,
                charaCenter,
              ];

              for (let k = 0, l = colliders.length; k < l; k += 1) {
                const point = colliders[k];
                const d2 = point.distanceToSquared(center);

                if (d2 < r2) {
                  collided = true;

                  const normal = this.#vecA
                    .subVectors(point, center)
                    .normalize();
                  const v1 = this.#vecB
                    .copy(normal)
                    .multiplyScalar(normal.dot(c2.velocity));
                  const v2 = this.#vecC
                    .copy(normal)
                    .multiplyScalar(normal.dot(c1.velocity));
                  const vec1 = this.#vecD.subVectors(v2, v1);
                  const vec2 = this.#vecE.subVectors(v1, v2);

                  c2.velocity.addScaledVector(vec1, c1.data.weight);
                  c1.velocity.addScaledVector(vec2, c2.data.weight);

                  const d = (r - sqrt(d2)) / 2;
                  c1.collider.translate(normal.multiplyScalar(-d));
                  c2.collider.translate(normal.multiplyScalar(d));
                }

                if (collided) {
                  this.eventManager.dispatch('collision', c1.name, c1, c2);
                  this.eventManager.dispatch('collision', c2.name, c2, c1);
                }
              }
            }
          }
        }
      }
    }
  }

  update(deltaTime, elapsedTime, damping) {
    const list = Array.from(this.list.values());
    const len = list.length;

    for (let i = 0; i < len; i += 1) {
      const character = list[i];
      character.update(deltaTime, elapsedTime, damping);

      if (character.collider.start.y < World.oob) {
        this.eventManager.dispatch('oob', 'teleport-character', character);
      }
    }

    this.collisions();

    for (let i = 0; i < len; i += 1) {
      const character = list[i];
      character.object.position.copy(character.collider.start);
      character.object.position.y += character.halfHeight;
      character.object.rotation.y = character.rotation.phi;

      if (character.isFPV()) {
        character.camera.rotation.x =
          character.povRotation.theta + character.deltaY;
        character.camera.rotation.y =
          character.povRotation.phi + character.rotation.phi;
        character.camera.position.copy(character.collider.end);
      }
    }
  }
}

export default CharacterManager;
