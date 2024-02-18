import { Vector3, Spherical, Euler } from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';

import { Keys, Actions, States, Characters, Stages } from './data';
import Publisher from './publisher';
import Player from './player';
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

  #euler = new Euler(0, 0, 0, 'YXZ');

  #yawAxis = new Vector3(0, 1, 0);

  #pitchAxis = new Vector3(1, 0, 0);

  #actions = new Set();

  #states = new Set();

  #urgencyRemainingTime = 0;

  #stunningRemainingTime = 0;

  constructor(scene, collidableManager, worldOctree) {
    this.scene = scene;
    this.worldOctree = worldOctree;
    this.collidableManager = collidableManager;
    this.list = new Map();

    this.collideWith = this.collideWith.bind(this);
    this.collidableManager.subscribe('collideWith', this.collideWith);
  }

  add(character) {
    if (!this.list.has(character.name)) {
      if (!character instanceof Player) {
        this.scene.add(character.object);
      }

      this.list.set(character.name, character);
    }
  }

  remove(character) {
    if (this.list.has(character.name)) {
      this.scene.remove(character.object);
      this.list.delete(character.name);
    }
  }

  collideWith(object) {
    const list = Array.from(this.list.values());

    for (let i = 0, l = list.length; i < l; i += 1) {
      const character = list[i];
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
          const normal = this.#vecA.subVectors(point, objectCenter).normalize();
          const v1 = this.#vecB
            .copy(normal)
            .multiplyScalar(normal.dot(character.velocity));
          const v2 = this.#vecC
            .copy(normal)
            .multiplyScalar(normal.dot(object.velocity));
          const vec1 = this.#vecB.subVectors(v2, v1);
          const vec2 = this.#vecC.subVectors(v1, v2);

          character.velocity.addScaledVector(vec1, object.weight);
          object.velocity.addScaledVector(vec2, character.data.weight);
          //character.velocity.add(v2).sub(v1);
          //object.velocity.add(v1).sub(v2);

          const d = (r - sqrt(d2)) / 2;
          objectCenter.addScaledVector(normal, -d);
        }
      }
    }
  }

  collisions() {
    const list = Array.from(this.list.values());

    for (let i = 0, l = list.length; i < l; i += 1) {
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
  }

  update(deltaTime, damping) {
    const list = Array.from(this.list.values());

    for (let i = 0, l = list.length; i < l; i += 1) {
      const character = list[i];
      character.update(deltaTime, damping);
    }

    this.collisions();
  }
}

export default CharacterManager;
