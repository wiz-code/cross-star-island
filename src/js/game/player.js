import * as THREE from 'three';
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';

import { Actions, States } from './data';
import Publisher from './publisher';
import Ammo from './ammo';
import { World, PlayerSettings, Controls, AmmoSettings } from './settings';

const { abs, exp, sqrt, PI } = Math;

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

class Player extends Publisher {
  #dir = new THREE.Vector3();

  #side = new THREE.Vector3();

  #vecA = new THREE.Vector3();

  #vecB = new THREE.Vector3();

  #vecC = new THREE.Vector3();

  #virticalVector = new THREE.Vector3(0, 1, 0);

  #test = 0;////////////

  constructor(camera, ammo, worldOctree) {
    super();

    this.camera = camera;
    this.worldOctree = worldOctree;

    this.ammo = ammo;

    this.onGround = false;
    this.position = new THREE.Vector3(); // 位置情報の保持はcolliderが実質兼ねているので現状不使用
    this.forwardComponent = 0;
    this.sideComponent = 0;
    this.rotateComponent = 0;
    this.povCoords = new THREE.Spherical();
    this.spherical = new THREE.Spherical();
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.camera.getWorldDirection(this.direction);

    this.fire = this.fire.bind(this);
    this.ammoCollision = this.ammoCollision.bind(this);
    this.ammo.subscribe('ammoCollision', this.ammoCollision);

    const start = new THREE.Vector3(
      PlayerSettings.Position.x,
      PlayerSettings.Position.y,
      PlayerSettings.Position.z,
    );
    const end = new THREE.Vector3(
      PlayerSettings.Position.x,
      PlayerSettings.Position.y + PlayerSettings.height,
      PlayerSettings.Position.z,
    );
    this.collider = new Capsule(start, end, PlayerSettings.radius);
  }

  jump(deltaTime) {
    if (this.onGround) {
      this.velocity.y = PlayerSettings.jumpPower * deltaTime * 50;
    }
  }

  moveForward(deltaTime, state = States.idle) {
    let delta;

    if (this.onGround) {
      delta = deltaTime * PlayerSettings.speed;

      if (
        state === States.sprint &&
        deltaTime >= 0
      ) {
        delta *= PlayerSettings.sprint;
      } else if (state === States.urgency) {
        delta *= PlayerSettings.urgencyMove;
      }
    } else {
      delta = deltaTime * PlayerSettings.airSpeed;
    }

    this.forwardComponent = delta;

    //const direction = this.direction.clone().multiplyScalar(delta);
    //this.velocity.add(direction);
  }

  /*rotate(deltaTime, state = States.idle) {
    let delta = deltaTime * PlayerSettings.turnSpeed * 0.1;

    if (state === States.urgency) {
      delta *= PlayerSettings.urgencyTurn;
    }

    this.direction.applyAxisAngle(this.#virticalVector, delta);
    this.spherical.phi += delta;
    this.direction.normalize();
  }*/
  rotate(deltaTime, state = States.idle) {
    let delta;

    if (state === States.urgency) {
      delta = deltaTime * PlayerSettings.urgencyTurn;
    } else {
      delta = deltaTime * PlayerSettings.turnSpeed;
    }

    //this.direction.applyAxisAngle(this.#virticalVector, delta);
    //this.spherical.phi += delta;
    this.rotateComponent = delta;
    //this.direction.normalize();
  }

  moveSide(deltaTime, state = States.idle) {
    let delta = deltaTime * 0.5;

    if (this.onGround) {
      delta *= PlayerSettings.speed;

      if (state === States.urgency) {
        delta *= PlayerSettings.urgencyMove;
      }
    } else {
      delta = deltaTime * PlayerSettings.airSpeed;
    }

    this.sideComponent = delta;

    /*const direction = this.#side.crossVectors(this.direction, this.#virticalVector);
    direction.normalize();
    this.velocity.add(direction.multiplyScalar(delta));*/
  }

  setPovCoords(povCoords) {
    this.povCoords = povCoords;
  }

  fire() {
    const ammo = this.ammo.list[this.ammo.index];
    ammo.createdAt = performance.now();
    this.camera.getWorldDirection(this.#dir);

    ammo.collider.center
      .copy(this.collider.end)
      .addScaledVector(this.#dir, this.collider.radius * 1.5);

    ammo.velocity.copy(this.#dir).multiplyScalar(AmmoSettings.speed);
    ammo.velocity.addScaledVector(this.velocity, 2);
    this.ammo.index = (this.ammo.index + 1) % this.ammo.list.length;
  }

  ammoCollision(ammo) {
    const center = this.#vecA
      .addVectors(this.collider.start, this.collider.end)
      .multiplyScalar(0.5);
    const ammoCenter = ammo.collider.center;
//console.log(ammo.collider.center, this.collider.end)
    const r = this.collider.radius + ammo.collider.radius;
    const r2 = r * r;

    const colliders = [this.collider.start, this.collider.end, center];

    for (let i = 0, l = colliders.length; i < l; i += 1) {
      const point = colliders[i];
      const d2 = point.distanceToSquared(ammoCenter);

      if (d2 < r2) {//console.log('collision')
        const normal = this.#vecA.subVectors(point, ammoCenter).normalize();
        const v1 = this.#vecB.copy(normal).multiplyScalar(normal.dot(this.velocity));
        const v2 = this.#vecC
          .copy(normal)
          .multiplyScalar(normal.dot(ammo.velocity));

        this.velocity.add(v2).sub(v1);
        ammo.velocity.add(v1).sub(v2);

        const d = (r - sqrt(d2)) / 2;
        ammoCenter.addScaledVector(normal, -d);
      }
    }
  }

  collisions() {
    const result = this.worldOctree.capsuleIntersect(this.collider);
    this.onGround = false;

    if (result) {
      const onGround = result.normal.y > 0;
      this.onGround = onGround;

      if (!this.onGround) {
        this.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.velocity),
        );
      }

      this.collider.translate(result.normal.multiplyScalar(result.depth));
    }
  }

  update(deltaTime) {
    const resistance = this.onGround
      ? World.resistance
      : World.airResistance;
    const damping = exp(-resistance * deltaTime) - 1;

    if (!this.onGround) {
      this.velocity.y -= World.gravity * deltaTime;
    }

    if (this.rotateComponent !== 0) {
      this.direction.applyAxisAngle(this.#virticalVector, this.rotateComponent);
      this.direction.normalize();

      this.spherical.phi += this.rotateComponent;

      this.rotateComponent = addDamping(this.rotateComponent, dampingCoef * damping, minRotateAngle);
    }

    if (this.forwardComponent !== 0) {
      const direction = this.direction.clone().multiplyScalar(this.forwardComponent);
      this.velocity.add(direction);

      this.forwardComponent = addDamping(this.forwardComponent, damping, minMovement);
    }

    if (this.sideComponent !== 0) {
      const direction = this.#side.crossVectors(this.direction, this.#virticalVector);
      direction.normalize();
      this.velocity.add(direction.multiplyScalar(this.sideComponent));
    
      this.sideComponent = addDamping(this.sideComponent, damping, minMovement);
    }

    this.velocity.addScaledVector(this.velocity, damping);

    this.camera.rotation.x = this.povCoords.theta;
    this.camera.rotation.y = this.povCoords.phi + this.spherical.phi;

    this.collider.translate(this.velocity);
    this.camera.position.copy(this.collider.end);
    this.collisions();
  }
}

export default Player;
