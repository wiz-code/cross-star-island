import {
  IcosahedronGeometry,
  OctahedronGeometry,
  BufferGeometry,
  MeshBasicMaterial,
  MeshNormalMaterial,
  PointsMaterial,
  Mesh,
  Points,
  Group,
  Float32BufferAttribute,
  Texture,
  Sphere,
  Vector3,
  NormalBlending,
} from 'three';

import Publisher from './publisher';
import { World, AmmoSettings } from './settings';
import textures from './textures';

const { exp, sqrt } = Math;

class Ammo extends Publisher {
  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  constructor(scene, camera, worldOctree) {
    super();

    this.scene = scene;
    this.camera = camera;
    this.worldOctree = worldOctree;

    const geom = new IcosahedronGeometry(AmmoSettings.radius, 0);
    const pointsGeom = new OctahedronGeometry(AmmoSettings.radius + 4, 0);
    const pointsVertices = pointsGeom.attributes.position.array.slice(0);

    const bufferGeom = new BufferGeometry();
    bufferGeom.setAttribute(
      'position',
      new Float32BufferAttribute(pointsVertices, 3),
    );
    bufferGeom.computeBoundingSphere();

    const mat = new MeshNormalMaterial();
    const wireMat = new MeshBasicMaterial({
      color: AmmoSettings.wireColor,
      wireframe: true,
    });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    textures.crossStar(context);

    const texture = new Texture(canvas);
    texture.needsUpdate = true;

    const pointsMat = new PointsMaterial({
      color: AmmoSettings.pointColor,
      size: AmmoSettings.pointSize,
      map: texture,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    this.list = [];
    this.index = 0;

    for (let i = 0; i < AmmoSettings.numAmmo; i += 1) {
      const mesh = new Mesh(geom, mat);
      const wireMesh = new Mesh(geom, wireMat);
      const pointsMesh = new Points(bufferGeom, pointsMat);

      const group = new Group();
      group.add(mesh);
      group.add(wireMesh);
      group.add(pointsMesh);
      this.scene.add(group);

      const object = {
        mesh: group,
        collider: new Sphere(
          new Vector3(0, i * -10 - 100, 0),
          AmmoSettings.radius,
        ),
        velocity: new Vector3(),
      };

      this.list.push(object);
    }
  }

  collisions() {
    for (let i = 0, l = this.list.length; i < l; i += 1) {
      const a1 = this.list[i];

      for (let j = i + 1; j < l; j += 1) {
        const a2 = this.list[j];

        const d2 = a1.collider.center.distanceToSquared(a2.collider.center);
        const r = a1.collider.radius + a2.collider.radius;
        const r2 = r * r;

        if (d2 < r2) {
          const normal = this.#vecA
            .subVectors(a1.collider.center, a2.collider.center)
            .normalize();
          const v1 = this.#vecB
            .copy(normal)
            .multiplyScalar(normal.dot(a1.velocity));
          const v2 = this.#vecC
            .copy(normal)
            .multiplyScalar(normal.dot(a2.velocity));

          a1.velocity.add(v2).sub(v1);
          a2.velocity.add(v1).sub(v2);

          const d = (r - sqrt(d2)) / 2;

          a1.collider.center.addScaledVector(normal, d);
          a2.collider.center.addScaledVector(normal, -d);
        }
      }
    }
  }

  update(deltaTime) {
    const len = this.list.length;

    for (let i = 0; i < len; i += 1) {
      const ammo = this.list[i]; // console.log(i, ammo.collider.center)
      ammo.collider.center.addScaledVector(ammo.velocity, deltaTime);
      const result = this.worldOctree.sphereIntersect(ammo.collider);

      if (result) {
        ammo.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(ammo.velocity) * 1.5,
        );
        ammo.collider.center.add(result.normal.multiplyScalar(result.depth));
      } else {
        ammo.velocity.y -= World.gravity * deltaTime * 100;
      }

      const damping = exp(-0.2 * deltaTime) - 1;
      ammo.velocity.addScaledVector(ammo.velocity, damping);
      this.publish('ammoCollision', ammo);
    }

    this.collisions();

    for (let i = 0; i < len; i += 1) {
      const ammo = this.list[i];
      ammo.mesh.rotation.z -= deltaTime * AmmoSettings.rotateSpeed;
      ammo.mesh.position.copy(ammo.collider.center);
    }
  }
}

export default Ammo;
