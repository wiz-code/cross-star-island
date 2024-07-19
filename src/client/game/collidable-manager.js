import { Box3, Vector3, Sphere, Matrix4 } from 'three';
import { NOT_INTERSECTED, INTERSECTED, CONTAINED } from 'three-mesh-bvh';

import Capsule from './capsule';
import { Game, World } from './settings';
import Publisher from './publisher';
import SweepAndPrune from './sap';
import {
  triangleCapsuleIntersect,
  triangleSphereIntersect,
} from './utils';

const { sqrt, cos, PI } = Math;

const RAD_45 = (45 / 360) * PI * 2;
const COS_45 = cos(RAD_45);
const PASSING_SCORE = 100;

class CollidableManager extends Publisher {
  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  #vecD = new Vector3();

  #vecE = new Vector3();

  #box = new Box3();

  #matrix = new Matrix4();

  #capsule = new Capsule();

  #sphere = new Sphere();

  #center = new Vector3();

  #v1 = new Vector3();

  #v2 = new Vector3();

  #v3 = new Vector3();

  #vec = new Vector3();

  #parent = null;

  #intersected = null;

  #triangleIndexSet = new Set();

  constructor(game, scene, camera, eventManager, movableManager) {
    super();

    this.game = game;
    this.scene = scene;
    this.camera = camera;
    this.eventManager = eventManager;
    this.movableManager = movableManager;
    this.sap = new SweepAndPrune();
    this.list = new Set();
  }

  add(collidable) {
    const box = new Box3();

    if (collidable.type === 'character') {
      if (!collidable.hasControls) {
        this.scene.add(collidable.object);
      }

      collidable.collider.getBoundingBox(box);
    } else {
      this.scene.add(collidable.object);
      collidable.collider.getBoundingBox(box);
    }

    this.list.add(collidable);
    this.sap.addObject(collidable, box);
  }

  remove(collidable) {
    if (this.list.has(collidable)) {
      if (collidable.type === 'character') {
        if (!collidable.hasControls) {
          this.scene.remove(collidable.object);
        }
      } else {
        this.scene.remove(collidable.object);
      }

      this.list.delete(collidable);
      this.sap.removeObject(collidable);
    }
  }

  clearList() {
    this.list.forEach((collidable) => this.remove(collidable));
  }

  setAlive(bool) {
    this.list.forEach((collidable) => collidable.setAlive(bool));
  }

  dispose() {
    this.list.forEach((collidable) => collidable.dispose());
    this.clearList();
    this.clear();
  }

  effect(object, target) {
    switch (object.type) {
      case 'item': {
        object.setAlive(false);

        if (!object.consumable) {
          const time = object.disableTime * 1000;
          setTimeout(() => {
            object.setAlive(true);
          }, time);
        }

        this.eventManager.dispatch('get-item', object.name, target, object);
        break;
      }

      default: {
      }
    }
  }

  collisions() {
    const list = Array.from(this.list.keys());

    const playSound = this.game.methods.get('play-sound');
    const { states } = this.game;
    const {
      refitSet,
      geometry,
      boundsTree,
      list: movableList,
    } = this.movableManager;

    for (let i = 0, l = this.list.size; i < l; i += 1) {
      const collidable = list[i];
      const { type, collider, velocity } = collidable;
      this.#parent = null;
      this.#intersected = null;
      this.#triangleIndexSet.clear();

      if (collider instanceof Capsule) {
        let result = false;

        this.#capsule.copy(collider);
        this.#capsule.getCenter(this.#center);
        collider.getBoundingBox(this.#box);

        boundsTree.shapecast({
          boundsTraverseOrder: (box) => {
            return box
              .clampPoint(this.#center, this.#vec)
              .distanceToSquared(this.#center);
            // return box.distanceToPoint(this.#center);
          },
          intersectsBounds: (box, isLeaf, score, depth, nodeIndex) => {
            if (box.intersectsBox(this.#box)) {
              return INTERSECTED;
            }

            return NOT_INTERSECTED;
          },
          intersectsTriangle: (triangle, triangleIndex) => {
            const collision = triangleCapsuleIntersect(this.#capsule, triangle);

            if (collision !== false) {
              if (this.#intersected != null) {
                this.#triangleIndexSet.add(triangleIndex);
              }

              result = true;
              this.#capsule.translate(
                collision.normal.multiplyScalar(collision.depth),
              );
            }

            return false;
          },
          intersectsRange: (offset, count, contained, depth, nodeIndex) => {
            for (let j = 0; j < count; j += 1) {
              const i1 = (offset + j) * 3;
              const vertexIndex = geometry.index.getX(i1);

              for (const movable of movableList.values()) {
                const offsetEnd = movable.offset + movable.count;

                if (movable.offset <= vertexIndex && vertexIndex <= offsetEnd) {
                  this.#intersected = movable;
                  refitSet.add(nodeIndex);
                }
              }
            }
          },
        });

        if (result) {
          this.#v3.copy(
            this.#capsule.getCenter(this.#v1).sub(collider.getCenter(this.#v2)),
          );
          const depth = this.#v3.length();
          result = { normal: this.#v3.clone().normalize(), depth };
        }

        collidable.setGrounded(false);

        if (result !== false) {
          const onGround = result.normal.y > COS_45;
          collidable.setGrounded(onGround);

          if (!onGround) {
            velocity.addScaledVector(
              result.normal,
              -result.normal.dot(velocity),
            );
          }

          if (this.#triangleIndexSet.size > 0) {
            for (const index of this.#triangleIndexSet) {
              const vindex = geometry.index.getX(index * 3);

              if (
                this.#intersected.offset <= vindex &&
                vindex <= this.#intersected.offset + this.#intersected.count
              ) {
                this.#parent = this.#intersected;
                collider.translate(this.#parent.velocity);
                break;
              }
            }
          }

          if (result.depth >= Game.EPS) {
            collider.translate(result.normal.multiplyScalar(result.depth));
          }
        }
      } else if (collider instanceof Sphere) {
        let result = false;
        this.#sphere.copy(collider);
        collider.getBoundingBox(this.#box);

        boundsTree.shapecast({
          boundsTraverseOrder: (box) => {
            return box
              .clampPoint(this.#center, this.#vec)
              .distanceToSquared(this.#center);
            // return box.distanceToPoint(this.#sphere.center);
          },
          intersectsBounds: (box, isLeaf, score) => {
            if (box.intersectsBox(this.#box)) {
              return INTERSECTED;
            }

            return NOT_INTERSECTED;
          },
          intersectsTriangle: (triangle) => {
            const collision = triangleSphereIntersect(this.#sphere, triangle);

            if (collision !== false) {
              result = true;
              this.#sphere.center.add(
                collision.normal.multiplyScalar(collision.depth),
              );
            }

            return false;
          },
        });

        if (result) {
          this.#v3.copy(
            this.#v1.copy(this.#sphere.center).sub(collider.center),
          );
          const depth = this.#v3.length();

          result = { normal: this.#v3.clone().normalize(), depth };
        }

        if (result !== false) {
          if (!collidable.isBounced()) {
            collidable.setBounced(true);
          }

          velocity.addScaledVector(
            result.normal,
            -result.normal.dot(velocity) * 1.5,
          );
          collider.center.add(result.normal.multiplyScalar(result.depth));
        }
      }

      this.sap.updateObject(collidable);
    }

    this.sap.update();

    for (const [a1, a2] of this.sap.pairs) {
      if (a1.isAlive() && a2.isAlive()) {
        if (a1.type === 'character' && a2.type === 'character') {
          const a1Center = a1.collider.getCenter(this.#vecA);
          const a2Center = a2.collider.getCenter(this.#vecB);
          const r = a1.data.radius + a2.data.radius;
          const r2 = r * r;

          let collided = false;
          const colliders = [a2.collider.start, a2.collider.end, a2Center];

          for (let i = 0, l = colliders.length; i < l; i += 1) {
            const point = colliders[i];
            const d2 = point.distanceToSquared(a1Center);

            if (d2 < r2) {
              collided = true;

              const normal = this.#vecA.subVectors(point, a1Center).normalize();
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
          let character;
          let object;

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

          for (let i = 0, l = colliders.length; i < l; i += 1) {
            const point = colliders[i];
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
  }

  updatePos() {
    const list = Array.from(this.list.keys());
    const len = this.list.size;

    for (let i = 0; i < len; i += 1) {
      const collidable = list[i];

      if (collidable.isAlive()) {
        if (collidable.collider instanceof Capsule) {
          const { object } = collidable;

          object.position.copy(collidable.collider.start);
          object.position.y += collidable.halfHeight;
          object.rotation.y = collidable.rotation.phi; /// //////

          if (collidable.hasControls) {
            this.camera.position.copy(collidable.collider.end);
          }
        } else if (collidable.collider instanceof Sphere) {
          collidable.object.position.copy(collidable.collider.center);
        }
      }
    }
  }
}

export default CollidableManager;
