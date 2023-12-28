import * as THREE from 'three';
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';

import { FirstPersonControls } from './controls';
import { World, PlayerSettings, Controls } from './settings';

const { exp } = Math;

class Player {
  constructor(camera, controls, worldOctree) {
    this.camera = camera;
    this.controls = controls;
    this.worldOctree = worldOctree;
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
    this.collider = new Capsule(
      start,
      end,
      PlayerSettings.radius
    );
    this.velocity = new THREE.Vector3();
		this.direction = new THREE.Vector3();

		this.onFloor = false;
  }

  getForwardVector() {
		this.camera.getWorldDirection(this.direction);
		this.direction.y = 0;
		this.direction.normalize();

		return this.direction;
	}

  getSideVector() {
		this.camera.getWorldDirection(this.direction);
		this.direction.y = 0;
		this.direction.normalize();
		this.direction.cross(this.camera.up);

		return this.direction;
	}

  collisions() {
		const result = this.worldOctree.capsuleIntersect(this.collider);
    this.onFloor = false;

		if (result) {
			this.onFloor = result.normal.y > 0;

			if (!this.onFloor) {
				this.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.velocity)
        );
			}

			this.collider.translate(result.normal.multiplyScalar(result.depth));
		}
  }

  update(deltaTime) {
    // gives a bit of air control
    const speedDelta = deltaTime * (this.onFloor ? Controls.movementSpeed : Controls.airSpeed);

    if (this.controls.moveForward) {
      this.velocity.add(this.getForwardVector().multiplyScalar(speedDelta));
    }

    if (this.controls.moveBackward) {
      this.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
    }

    if (this.controls.moveLeft) {
      this.velocity.add(this.getSideVector().multiplyScalar(-speedDelta));
    }

    if (this.controls.moveRight) {
      this.velocity.add(this.getSideVector().multiplyScalar(speedDelta));
    }

    if (this.onFloor && this.controls.isJumping) {
      this.velocity.y = PlayerSettings.jumpPower;
    }

    const resistance = this.onFloor ? Controls.groundResistance : Controls.airResistance;
    let damping = exp(-resistance * deltaTime) - 1;

		if (!this.onFloor) {
			this.velocity.y -= World.gravity * deltaTime;
		}

		this.velocity.addScaledVector(this.velocity, damping);

		this.collider.translate(this.velocity.clone());
		this.collisions();
		this.camera.position.copy(this.collider.end);
	}
}

export default Player;
