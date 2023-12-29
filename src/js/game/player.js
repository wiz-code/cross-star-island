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
  }

  /*getForwardVector() {
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
	}*/

  collisions() {
		const result = this.worldOctree.capsuleIntersect(this.collider);
    this.controls.setOnGround(false);

		if (result) {
			const onGround = result.normal.y > 0;
      this.controls.setOnGround(onGround);

			if (!onGround) {
				this.controls.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.controls.velocity)
        );
			}

			this.collider.translate(result.normal.multiplyScalar(result.depth));
		}
  }

  update(deltaTime) {
    const { euler, velocity } = this.controls;
    this.camera.quaternion.setFromEuler(euler);
		this.collider.translate(velocity);
		this.collisions();
		this.camera.position.copy(this.collider.end);
	}
}

export default Player;
