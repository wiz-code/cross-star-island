import { Vector3, Spherical, Euler } from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';

import { Keys, Actions, States, Characters, Stages } from './data';
import Publisher from './publisher';
import { World, PlayerSettings, Controls, AmmoSettings } from './settings';

const { exp, sqrt, cos, PI } = Math;

const RAD_30 = (30 / 360) * PI * 2;
const COS_30 = cos(RAD_30);
const dampingCoef = PI / 180;
const minRotateAngle = PI / 720;
const minMovement = 0.01;

const addDamping = (component, damping, minValue) => {
  let value = component;

  if (value >= 0) {
    value += damping;

    if (value < minValue) {
      value = 0;
    }
  } else {
    value -= damping;

    if (value >= -minValue) {
      value = 0;
    }
  }

  return value;
};

const characterData = new Map(Characters);

class CharacterManager {
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

  constructor(scene, collidableManager, worldOctree) {
    this.scene = scene;
    this.collidableManager = collidableManager;
    this.worldOctree = worldOctree;
    this.list = new Set();
    this.schedules = new Map();

    this.collideWith = this.collideWith.bind(this);
    this.collidableManager.subscribe('collideWith', this.collideWith);
  }

  add(character, data) {
    if (!this.list.has(character)) {
      if (!character.isFPV()) {
        this.scene.add(character.object);
        this.schedules.set(character, data.schedule);
      }

      this.list.add(character);
    }
  }

  remove(character) {
    if (this.list.has(character)) {
      if (!character.isFPV()) {
        this.scene.remove(character.object);
        this.schedules.delete(character);
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

      if (character.isActive()) {
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

            if (object.type === 'item') {
              object.setActive(false);
              object.data.dispatchers.forEach((dispatcher) => this.collidableManager.publish(dispatcher));
            } else {
              if (!character.isStunning()) {
                character.setStunning(true, World.collisionShock);
              }

              const normal = this.#vecA.subVectors(point, objectCenter).normalize();
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

      if (result) {
        const onGround = result.normal.y > COS_30;
        character.setGrounded(onGround);

        if (!character.isGrounded()) {
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

        if (c1.isActive()) {
          for (let j = i + 1; j < len; j += 1) {
            const c2 = list[j];

            if (c2.isActive) {
              const center = c1.collider.getCenter(this.#vecA);
              const charaCenter = c2.collider.getCenter(this.#vecB);
              const r = c1.data.radius + c2.data.radius;
              const r2 = r * r;

              const colliders = [
                c2.collider.start,
                c2.collider.end,
                charaCenter,
              ];

              for (let j = 0, m = colliders.length; j < m; j += 1) {
                const point = colliders[j];
                const d2 = point.distanceToSquared(center);

                if (d2 < r2) {
                  const normal = this.#vecA.subVectors(point, center).normalize();
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
              }
            }
          }
        }
      }
    }
  }

  update(deltaTime, elapsedTime, damping) {
    const schedules = Array.from(this.schedules.entries());

    for (let i = 0, l = schedules.length; i < l; i += 1) {
      const [character, schedule] = schedules[i];

      if (elapsedTime > schedule.spawnedAt) {
        if (!character.isActive()) {
          character.setActive(true);
        }
      }
    }

    const list = Array.from(this.list.values());
    const len = list.length;

    for (let i = 0; i < len; i += 1) {
      const character = list[i];
      character.update(deltaTime, elapsedTime, damping);
    }

    this.collisions();

    for (let i = 0; i < len; i += 1) {
      const character = list[i];
      character.object.position.copy(character.collider.start);
      character.object.position.y += character.halfHeight;
      character.object.rotation.y = character.rotation.phi;

      if (character.isFPV()) {
        character.camera.rotation.x = character.povRotation.theta + character.deltaY;
        character.camera.rotation.y = character.povRotation.phi + character.rotation.phi;
        character.camera.position.copy(character.collider.end);
      }
    }
  }
}

export default CharacterManager;
