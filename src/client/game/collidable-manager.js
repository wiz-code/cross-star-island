import { Box3, Vector3, Sphere, Matrix4, Line3 } from 'three';
import { NOT_INTERSECTED, INTERSECTED, CONTAINED } from 'three-mesh-bvh';

import Capsule from './capsule';
import { Game, World } from './settings';
import Publisher from './publisher';
import SweepAndPrune from './sap';
import {
  triangleCapsuleIntersect,
  triangleSphereIntersect,
  getCollisionParams,
  lineToLineClosestPoints,
} from './utils';

const { sqrt, cos, PI } = Math;

const RAD_45 = (45 / 360) * PI * 2;
const COS_45 = cos(RAD_45);
const PASSING_SCORE = 100;
//const fallingSpeedToSquared = World.fallingDeathSpeed ** 2;

class CollidableManager extends Publisher {
  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  #vecD = new Vector3();

  #vecE = new Vector3();

  #vecF = new Vector3();

  #box = new Box3();

  #matrix = new Matrix4();

  #capsule = new Capsule();

  #sphere = new Sphere();

  #center = new Vector3();

  #v1 = new Vector3();

  #v2 = new Vector3();

  #v3 = new Vector3();

  #vec = new Vector3();

  #c1 = new Vector3();

  #c2 = new Vector3();

  #boxCenter = new Vector3();

  #parent = null;

  #intersected = null;

  #triangleIndexSet = new Set();

  #l1 = new Line3();

  #l2 = new Line3();

  #t1 = new Vector3();

  #t2 = new Vector3();

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
    } else if (collidable.collider instanceof Sphere) {
      this.scene.add(collidable.object);
      collidable.collider.getBoundingBox(box);
    } else if (collidable.collider instanceof Box3) {
      this.scene.add(collidable.object);
      box.copy(collidable.collider);
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

      if (!collidable.isAlive()) {
        continue;
      }

      const { type, collider, velocity } = collidable;
      this.#parent = null;
      this.#intersected = null;
      this.#triangleIndexSet.clear();

      let result = false;

      if (collider instanceof Capsule) {
        //collidable.setGrounded(false);

        collider.getCenter(this.#center);
        collider.getBoundingBox(this.#box);
        this.#capsule.copy(collider);

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
      } else {
        if (collider instanceof Sphere) {
          this.#center.copy(collider.center);
          this.#sphere.copy(collider);
          this.#sphere.getBoundingBox(this.#box);
        } else if (collider instanceof Box3) {
          this.#box.copy(collider);
          collider.getCenter(this.#center);
          this.#sphere.set(this.#center, collidable.data.radius);
        }

        boundsTree.shapecast({
          boundsTraverseOrder: (box) => {
            return box.clampPoint(this.#center, this.#vec).distanceToSquared(this.#center);
            // return box.distanceToPoint(center);
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
      }

      if (result) {
        if (collider instanceof Capsule) {
          this.#capsule.getCenter(this.#v1).sub(this.#center);
        } else {
          this.#v1.copy(this.#sphere.center).sub(this.#center);
        }

        const depth = this.#v1.length();
        result = { normal: this.#v1.clone().normalize(), depth };
      }

      if (result !== false) {
        let fallingDistance = 0;

        if (type === 'character') {
          fallingDistance = collidable.getFallingDistance();
        }

        if (fallingDistance >= World.fallingDeathDistance) {
          this.eventManager.dispatch('oob', 'falling-death', collidable);
        } else {
          if (collider instanceof Capsule) {
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
          } else {
            collidable.addBounceCount();

            velocity.addScaledVector(
              result.normal,
              -result.normal.dot(velocity) * 1.5,
            );

            if (collider instanceof Sphere) {
              collider.center.add(result.normal.multiplyScalar(result.depth));
            } else if (collider instanceof Box3) {
              collider.translate(result.normal.multiplyScalar(result.depth));
            }
          }
        }
      } else {
        if (type === 'character') {
          collidable.setGrounded(false);
        }
      }

      this.sap.updateObject(collidable);
    }

    this.sap.update();

    for (const [a1, a2] of this.sap.pairs) {
      if (
        (a1.isAlive() && a1.colliderEnabled) &&
        (a2.isAlive() && a2.colliderEnabled)
      ) {
        if (a1.collider instanceof Capsule && a2.collider instanceof Capsule) {
          //const { center: c1, radius: r1 } = getCollisionParams(a1, this.#c1);
          //const { center: c2, radius: r2 } = getCollisionParams(a2, this.#c2);

          //const r = r1 + r2;
          //const rr = r * r;

          let collided = false;
          //const colliders = [a2.collider.start, a2.collider.end, c2];

          ////////////
          const la1 = this.#l1.set(a1.collider.start, a1.collider.end);
          const la2 = this.#l2.set(a2.collider.start, a2.collider.end);
          lineToLineClosestPoints(la1, la2, this.#t1, this.#t2);
          this.#vecA.subVectors(this.#t1, this.#t2);
          const len = this.#vecA.length();
          const normal = this.#vecA.normalize();
          const depth = a1.collider.radius + a2.collider.radius - len;

          if (depth > 0) {
            collided = true;

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

            a1.collider.translate(normal.multiplyScalar(depth));
            a2.collider.translate(normal.multiplyScalar(-depth));
          }
          ///////////

          /*for (let i = 0, l = colliders.length; i < l; i += 1) {
            const point = colliders[i];
            const d2 = point.distanceToSquared(c1);

            if (d2 < rr) {
              collided = true;

              const normal = this.#vecA.subVectors(point, c1).normalize();
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
          }*/

          if (
            collided &&
            a1.type === 'character' && a2.type === 'character'
          ) {
            this.eventManager.dispatch('collision', a1.name, a1, a2);
            this.eventManager.dispatch('collision', a2.name, a2, a1);
          }
        } else if (
          a1.collider instanceof Capsule ||
          a2.collider instanceof Capsule
        ) {
          const params1 = getCollisionParams(a1, this.#c1);
          const params2 = getCollisionParams(a2, this.#c2);

          let capsule;
          let other;

          if (a1.collider instanceof Capsule) {
            capsule = {
              object: a1,
              velocity: a1.velocity,
              data: a1.data,
              center: params1.center,
              radius: params1.radius,
              //colliders: [a1.collider.start, params1.center, a1.collider.end],//////
              segment: this.#l1.set(a1.collider.start, a1.collider.end),
            };
            other = {
              object: a2,
              velocity: a2.velocity,
              data: a2.data,
              center: params2.center,
              radius: params2.radius,
            };
          } else {
            capsule = {
              object: a2,
              velocity: a2.velocity,
              data: a2.data,
              center: params2.center,
              radius: params2.radius,
              //colliders: [a2.collider.start, params2.center, a2.collider.end],//////////
              segment: this.#l1.set(a2.collider.start, a2.collider.end),
            };
            other = {
              object: a1,
              velocity: a1.velocity,
              data: a1.data,
              center: params1.center,
              radius: params1.radius,
            };
          }

          let collided = false;
          //const r = capsule.radius + other.radius;
          //const rr = r * r;

          ///////////////
          capsule.segment.closestPointToPoint(other.center, true, this.#t1);
          this.#vecA.subVectors(this.#t1, other.center);
          const len = this.#vecA.length();
          const normal = this.#vecA.normalize();
          const depth = capsule.radius + other.radius - len;

          if (depth > 0) {
            collided = true;

            if (a1.type !== 'item' && a2.type !== 'item') {
              const v1 = this.#vecB
                .copy(normal)
                .multiplyScalar(normal.dot(capsule.velocity));
              const v2 = this.#vecC
                .copy(normal)
                .multiplyScalar(normal.dot(other.velocity));
              const vec1 = this.#vecD.subVectors(v2, v1);
              const vec2 = this.#vecE.subVectors(v1, v2);

              capsule.velocity.addScaledVector(vec1, other.data.weight);
              other.velocity.addScaledVector(vec2, capsule.data.weight);

              const diff = this.#vecF.copy(normal).multiplyScalar(depth);

              capsule.object.collider.translate(diff);

              if (other.collider instanceof Sphere) {
                other.center.addScaledVector(normal, -depth);
              } else if (other.collider instanceof Box3) {
                this.collider.translate(diff.negate());
              }
            }
          }
          ////////////////

          /*for (let i = 0, l = capsule.colliders.length; i < l; i += 1) {
            const point = capsule.colliders[i];
            const d2 = point.distanceToSquared(other.center);

            if (d2 < rr) {
              collided = true;

              if (a1.type === 'item' || a2.type === 'item') {
                break;
              }

              const normal = this.#vecA
                .subVectors(point, other.center)
                .normalize();
              const v1 = this.#vecB
                .copy(normal)
                .multiplyScalar(normal.dot(capsule.velocity));
              const v2 = this.#vecC
                .copy(normal)
                .multiplyScalar(normal.dot(other.velocity));
              const vec1 = this.#vecD.subVectors(v2, v1);
              const vec2 = this.#vecE.subVectors(v1, v2);

              capsule.velocity.addScaledVector(vec1, other.data.weight);
              other.velocity.addScaledVector(vec2, capsule.data.weight);

              const d = (r - sqrt(d2)) / 2;

              if (other.collider instanceof Sphere) {
                other.center.addScaledVector(normal, -d);
              } else if (other.collider instanceof Box3) {
                this.#vecF.copy(normal).multiplyScalar(-d);
                this.collider.translate(this.#vecF);
              }
            }
          }*/

          if (collided) {
            other.object.addBounceCount();

            if (
              other.object.type === 'item' &&
              capsule.object.type === 'character'
            ) {
              if (capsule.object.hasControls) {
                this.effect(other.object, capsule.object);
              }
            } else {
              if (
                capsule.object.type === 'character' &&
                other.object.type === 'ammo'
              ) {
                playSound?.('damage');
                capsule.object.setStunning(World.collisionShock);

                other.object.colliderEnabled = false;

                if (!capsule.object.hasControls) {
                  const hits = states.get('hits');
                  states.set('hits', hits + 1);
                }
              }
            }
          }
        } else {
          const { center: c1, radius: r1 } = getCollisionParams(a1, this.#c1);
          const { center: c2, radius: r2 } = getCollisionParams(a2, this.#c2);

          if (a1.type === 'item' || a2.type === 'item') {
            continue;
          }

          const d2 = c1.distanceToSquared(c2);
          const r = r1 + r2;
          const rr = r * r;

          if (d2 < rr) {
            const normal = this.#vecA.subVectors(c1, c2).normalize();
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

            if (a1.collider instanceof Sphere) {
              a1.collider.center.addScaledVector(normal, d);
            } else if (a1.collider instanceof Box3) {
              this.#vecF.copy(normal).multiplyScalar(d);
              a1.collider.translate(this.#vecF);
            }

            if (a2.collider instanceof Sphere) {
              a2.collider.center.addScaledVector(normal, -d);
            } else if (a2.collider instanceof Box3) {
              this.#vecF.copy(normal).multiplyScalar(-d);
              a2.collider.translate(this.#vecF);
            }

            a1.addBounceCount();
            a2.addBounceCount();
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

        if (collidable.type === 'character') {
          //const velocityToSquared = collidable.velocity.y < 0 ? collidable.velocity.y ** 2 : 0;
//collidable.hasControls && console.log(velocityToSquared, fallingSpeedToSquared)
          if (collidable.collider.start.y < World.oob/* ||
            velocityToSquared >= fallingSpeedToSquared
          */) {
            this.eventManager.dispatch('oob', 'falling-death', collidable);
          }
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
          object.rotation.y = collidable.rotation.phi;

          if (collidable.hasControls) {
            this.camera.position.copy(collidable.collider.end);
          }
        } else if (collidable.collider instanceof Sphere) {
          collidable.object.position.copy(collidable.collider.center);
        } else if (collidable.collider instanceof Box3) {
          collidable.collider.getCenter(this.#boxCenter);
          collidable.object.position.copy(this.#boxCenter);
        }
      }
    }
  }
}

export default CollidableManager;
