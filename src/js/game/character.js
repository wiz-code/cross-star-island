import {
  Vector3,
  Spherical,
  Euler,
  CapsuleGeometry,
  ConeGeometry,
  WireframeGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  LineBasicMaterial,
  PointsMaterial,
  NormalBlending,
  Texture,
  Mesh,
  LineSegments,
  Points,
  Group,
} from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';

import { Keys, Actions, States, Characters, Stages } from './data';
import Publisher from './publisher';
import { World, PlayerSettings, Controls, AmmoSettings } from './settings';
import textures from './textures';

const { floor, exp, sqrt, cos, PI } = Math;

const RAD_30 = (30 / 360) * PI * 2;
const COS_30 = cos(RAD_30);
const dampingCoef = PI / 180;
const minRotateAngle = PI / 720;
const minMovement = 0.01;

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
textures.crossStar(context);

const texture = new Texture(canvas);
texture.needsUpdate = true;

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

class Character extends Publisher {
  #dir = new Vector3(0, 0, -1);

  #vel = new Vector3(0, 0, 0);

  #forward = new Vector3();

  #side = new Vector3();

  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  #vecD = new Vector3();

  #vecE = new Vector3();

  #euler = new Euler(0, 0, 0, 'YXZ');

  #yawAxis = new Vector3(0, 1, 0);

  #pitchAxis = new Vector3(1, 0, 0);

  #isGrounded = false;

  #actions = new Set();

  #states = new Set();

  #urgencyRemainingTime = 0;

  #stunningRemainingTime = 0;

  #elapsedTime = 0;

  #test = 0; /// ///////

  static createObject(data) {
    const geom = new CapsuleGeometry(data.radius, data.height, 2, 8);
    const wireframeGeom = new WireframeGeometry(geom);

    const geomSize = data.radius + floor(data.pointSize / 2);
    //const pointsGeom = new CapsuleGeometry(geomSize, data.height, 1, 3);
    const pointsGeom = new ConeGeometry(geomSize, geomSize, 3);
    const pointsVertices = pointsGeom.attributes.position.array.slice(0);

    const bufferGeom = new BufferGeometry();
    bufferGeom.setAttribute(
      'position',
      new Float32BufferAttribute(pointsVertices, 3),
    );
    bufferGeom.computeBoundingSphere();

    const mat = new MeshBasicMaterial({
      color: data.color,
    });
    const wireframeMat = new LineBasicMaterial({
      color: data.wireColor,
    });

    const pointsMat = new PointsMaterial({
      color: data.pointColor,
      size: data.pointSize,
      map: texture,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    const mesh = new Mesh(geom, mat);
    const wireMesh = new LineSegments(wireframeGeom, wireframeMat);
    ////

    const pointsMesh1 = new Points(bufferGeom, pointsMat);
    const pointsMesh2 = new Points(bufferGeom, pointsMat);
    pointsMesh2.rotateX(PI);

    const pointsMesh = new Group();
    pointsMesh.add(pointsMesh1, pointsMesh2);
    pointsMesh1.position.setY((data.height + data.radius) / 2 + data.pointSize / 4);
    pointsMesh2.position.setY((-data.height - data.radius) / 2 - data.pointSize / 4);

    const object = new Group();
    object.add(mesh);
    object.add(wireMesh);
    object.add(pointsMesh);

    return object;
  }

  static defaultParams = [
    ['hp', 100],
  ];

  constructor(id, name/*, ammos*/) {
    super();

    const dataMap = new Map(Characters);

    if (!dataMap.has(name)) {
      throw new Error('character data not found');
    }

    this.id = id;
    //this.ammos = ammos;
    this.data = dataMap.get(name);

    this.params = new Map(Character.defaultParams);

    this.ammoType = this.data.ammoTypes[0];///////
    // this.forwardComponent = 0;
    // this.sideComponent = 0;
    this.rotateComponent = 0;
    this.povRotation = new Spherical();
    this.deltaY = 0;
    this.rotation = new Spherical(); // phi and theta
    this.velocity = new Vector3();
    this.direction = new Vector3(0, 0, -1);

    this.gun = null;
    this.camera = null;
    this.onUpdate = null;

    this.object = Character.createObject(this.data);
    this.halfHeight = floor(this.data.height / 2);

    this.collider = new Capsule();
    const start = new Vector3(0, this.data.radius, 0);
    const end = start.clone();
    end.y = this.data.height + this.data.radius;
    this.collider.set(start, end, this.data.radius);
  }

  setOnUpdate(update) {
    this.onUpdate = update.bind(this);
  }

  isFPV() {
    return this.camera != null;
  }

  setFPV(camera) {
    this.camera = camera;

    this.camera.rotation.x = -RAD_30;
    this.camera.getWorldDirection(this.direction);
  }

  unsetFPV() {
    if (this.isFPV()) {
      this.camera = null;
    }
  }

  setPosition(position, direction) {
    if (this.isFPV()) {
      this.camera.rotation.y = direction;
    }

    this.rotation.phi = direction;
    this.direction.copy(this.#dir.clone().applyAxisAngle(this.#yawAxis, direction));
    //this.camera.getWorldDirection(this.direction);

    this.collider.start.copy(position);
    this.collider.end.copy(position);
    this.collider.end.y += this.data.height;

    this.object.position.copy(this.collider.start);
    this.object.position.y += this.halfHeight;
    this.object.rotation.y = direction;
  }

  isGrounded() {
    return this.#isGrounded;
  }

  setGrounded(bool) {
    this.#isGrounded = bool;
  }

  jump() {
    this.velocity.y = this.data.jumpPower;
  }

  moveForward(deltaTime, state = States.idle) {
    let multiplier = deltaTime;

    if (this.#isGrounded) {
      multiplier *= this.data.speed;

      if (state === States.sprint && deltaTime >= 0) {
        multiplier *= this.data.sprint;
      } else if (state === States.urgency) {
        multiplier *= this.data.urgencyMove;
      }
    } else {
      multiplier *= this.data.airSpeed;
    }

    const direction = this.#forward
      .copy(this.direction)
      .multiplyScalar(multiplier);
    this.velocity.add(direction);
    /* this.forwardComponent = deltaTime;

    if (this.#isGrounded) {
      this.forwardComponent *= this.data.speed;

      if (state === States.sprint && deltaTime >= 0) {
        this.forwardComponent *= this.data.sprint;
      } else if (state === States.urgency) {
        this.forwardComponent *= this.data.urgencyMove;
      }
    } else {
      this.forwardComponent *= this.data.airSpeed;
    } */
  }

  rotate(deltaTime, state = States.idle) {
    this.rotateComponent = deltaTime;

    if (state === States.urgency) {
      this.rotateComponent *= this.data.urgencyTurn;
    } else {
      this.rotateComponent *= this.data.turnSpeed;
    }
  }

  moveSide(deltaTime, state = States.idle) {
    let multiplier = deltaTime;

    if (this.#isGrounded) {
      multiplier *= this.data.speed;

      if (state === States.urgency) {
        multiplier *= this.data.urgencyMove;
      }
    } else {
      multiplier *= this.data.airSpeed;
    }

    const direction = this.#side.crossVectors(this.direction, this.#yawAxis);
    direction.normalize();
    this.velocity.add(direction.multiplyScalar(multiplier));
    /* this.sideComponent = deltaTime * 0.7;

    if (this.#isGrounded) {
      this.sideComponent *= this.data.speed;

      if (state === States.urgency) {
        this.sideComponent *= this.data.urgencyMove;
      }
    } else {
      this.sideComponent *= this.data.airSpeed;
    } */
  }

  setGun(gun) {
    if (!this.data.gunTypes.includes(gun.name)) {
      return;
    }

    this.gun = gun;
  }

  setAmmo(ammo) {
    if (this.gun != null) {
      this.gun.setAmmo(ammo);
    }
  }

  fire() {
    if (this.gun != null) {
      this.gun.fire(this);
    }
    /*const ammo = this.ammos.get(this.ammoType);
    const bullet = ammo.list[ammo.index];

    bullet.setActive(true);

    this.#euler.x = this.povRotation.theta + this.rotation.theta + this.deltaY;
    this.#euler.y = this.povRotation.phi + this.rotation.phi;
    const dir = this.#dir.clone().applyEuler(this.#euler);
    bullet.object.rotation.copy(this.#euler);

    bullet.collider.center
      .copy(this.collider.end)
      .addScaledVector(dir, this.data.radius + bullet.data.radius);

    bullet.velocity.copy(dir).multiplyScalar(bullet.data.speed);
    bullet.velocity.addScaledVector(this.velocity, 2);

    ammo.index = (ammo.index + 1) % ammo.list.length;*/
  }

  setPovRotation(povRotation, deltaY) {
    this.deltaY = deltaY;
    this.povRotation.copy(povRotation);
  }

  input(keys, lastKey, mashed) {
    // 入力操作の処理

    // update()で一度だけアクションを発動する
    // 緊急行動中はisGroundedがfalseでもジャンプ可にする
    if (keys.has(Keys.Space) && this.#isGrounded) {
      this.#actions.add(Actions.jump);
    }

    // Cキー押し下げ時、追加で対応のキーを押していると緊急回避状態へ移行
    // ジャンプ中は緊急行動のコマンド受け付けは停止
    if (mashed) {
      if (!this.#isGrounded) {
        return;
      }

      this.#states.add(States.urgency);
    }

    // 緊急回避中は一部アクションを制限、スタン中はすべてのアクションを更新しない
    if (this.#states.has(States.urgency)) {
      if (Keys[lastKey] === Keys.KeyW) {
        this.#actions.add(Actions.quickMoveForward);
      } else if (Keys[lastKey] === Keys.KeyA) {
        this.#actions.add(Actions.quickTurnLeft);
      } else if (Keys[lastKey] === Keys.KeyS) {
        this.#actions.add(Actions.quickMoveBackward);
      } else if (Keys[lastKey] === Keys.KeyD) {
        this.#actions.add(Actions.quickTurnRight);
      } else if (Keys[lastKey] === Keys.KeyQ) {
        this.#actions.add(Actions.quickMoveLeft);
      } else if (Keys[lastKey] === Keys.KeyE) {
        this.#actions.add(Actions.quickMoveRight);
      }

      return;
    }
    if (this.#states.has(States.stunning)) {
      return;
    }

    if (keys.has(Keys.shift)) {
      this.#states.add(States.sprint);
    } else {
      this.#states.delete(States.sprint);
    }

    // 前進と後退
    if (keys.has(Keys.KeyW) && !keys.has(Keys.KeyS)) {
      this.#actions.add(Actions.moveForward);
    } else if (keys.has(Keys.KeyS) && !keys.has(Keys.KeyW)) {
      this.#actions.add(Actions.moveBackward);
    }

    if (!keys.has(Keys.KeyW)) {
      this.#actions.delete(Actions.moveForward);
    }

    if (!keys.has(Keys.KeyS)) {
      this.#actions.delete(Actions.moveBackward);
    }

    // 左右回転
    if (keys.has(Keys.KeyA) && !keys.has(Keys.KeyD)) {
      this.#actions.add(Actions.rotateLeft);
    } else if (keys.has(Keys.KeyD) && !keys.has(Keys.KeyA)) {
      this.#actions.add(Actions.rotateRight);
    }

    if (!keys.has(Keys.KeyA)) {
      this.#actions.delete(Actions.rotateLeft);
    }

    if (!keys.has(Keys.KeyD)) {
      this.#actions.delete(Actions.rotateRight);
    }

    // 左右平行移動
    if (keys.has(Keys.KeyQ) && !keys.has(Keys.KeyE)) {
      this.#actions.add(Actions.moveLeft);
    } else if (keys.has(Keys.KeyE) && !keys.has(Keys.KeyQ)) {
      this.#actions.add(Actions.moveRight);
    }

    if (!keys.has(Keys.KeyQ)) {
      this.#actions.delete(Actions.moveLeft);
    }

    if (!keys.has(Keys.KeyE)) {
      this.#actions.delete(Actions.moveRight);
    }
  }

  collideWith(character) {
    const center = this.collider.getCenter(this.#vecA);
    const charaCenter = character.collider.getCenter(this.#vecB);
    const r = this.data.radius + character.data.radius;
    const r2 = r * r;

    const colliders = [
      character.collider.start,
      character.collider.end,
      charaCenter,
    ];

    for (let j = 0, m = colliders.length; j < m; j += 1) {
      const point = colliders[j];
      const d2 = point.distanceToSquared(center);

      if (d2 < r2) {
        const normal = this.#vecA.subVectors(point, center).normalize();
        const v1 = this.#vecB
          .copy(normal)
          .multiplyScalar(normal.dot(character.velocity));
        const v2 = this.#vecC
          .copy(normal)
          .multiplyScalar(normal.dot(this.velocity));
        const vec1 = this.#vecD.subVectors(v2, v1);
        const vec2 = this.#vecE.subVectors(v1, v2);

        character.velocity.addScaledVector(vec1, this.data.weight);
        this.velocity.addScaledVector(vec2, character.data.weight);

        const d = (r - sqrt(d2)) / 2;
        const deltaPosition = normal.multiplyScalar(-d);
        this.collider.translate(deltaPosition);
      }
    }
  }

  getElapsedTime() {
    return this.#elapsedTime;
  }

  resetTime() {
    this.#elapsedTime = 0;
  }

  update(deltaTime, damping) {
    this.#elapsedTime += deltaTime;

    // 自機の動き制御
    if (this.#stunningRemainingTime > 0) {
      this.#stunningRemainingTime -= deltaTime;

      if (this.#stunningRemainingTime <= 0) {
        this.#states.delete(States.stunning);
        this.#stunningRemainingTime = 0;
      }
    } else if (
      this.#states.has(States.urgency) &&
      this.#urgencyRemainingTime === 0 &&
      this.#isGrounded
    ) {
      this.#urgencyRemainingTime = Controls.urgencyDuration;
    }

    if (this.#actions.has(Actions.jump)) {
      this.#actions.delete(Actions.jump);
      this.jump();
    }

    if (this.#urgencyRemainingTime > 0) {
      this.#urgencyRemainingTime -= deltaTime;

      if (this.#urgencyRemainingTime <= 0) {
        this.#actions.clear();
        this.#states.delete(States.urgency);
        this.#states.add(States.stunning);
        this.#urgencyRemainingTime = 0;

        let duratiion = Controls.stunningDuration;

        if (
          this.#actions.has(Actions.quickTurnLeft) ||
          this.#actions.has(Actions.quickTurnRight)
        ) {
          duratiion *= 0.5;
        }

        this.#stunningRemainingTime = duratiion;
      }

      if (this.#actions.has(Actions.quickMoveForward)) {
        this.moveForward(deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveBackward)) {
        this.moveForward(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickTurnLeft)) {
        this.rotate(deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickTurnRight)) {
        this.rotate(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveLeft)) {
        this.moveSide(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveRight)) {
        this.moveSide(deltaTime, States.urgency);
      }
    } else {
      if (this.#actions.has(Actions.rotateLeft)) {
        this.rotate(deltaTime);
      } else if (this.#actions.has(Actions.rotateRight)) {
        this.rotate(-deltaTime);
      }

      if (this.#actions.has(Actions.moveForward)) {
        if (this.#states.has(States.sprint)) {
          this.moveForward(deltaTime, States.sprint);
        } else {
          this.moveForward(deltaTime);
        }
      } else if (this.#actions.has(Actions.moveBackward)) {
        this.moveForward(-deltaTime);
      }

      if (this.#actions.has(Actions.moveLeft)) {
        this.moveSide(-deltaTime);
      } else if (this.#actions.has(Actions.moveRight)) {
        this.moveSide(deltaTime);
      }
    }

    // 移動の減衰処理
    const deltaDamping = this.#isGrounded ? damping.ground : damping.air;

    if (!this.#isGrounded) {
      this.velocity.y -= World.gravity * deltaTime;
    }

    if (this.rotateComponent !== 0) {
      this.direction.applyAxisAngle(this.#yawAxis, this.rotateComponent);
      // this.direction.normalize();

      this.rotation.phi += this.rotateComponent;

      if (this.isFPV()) {
        this.publish('onChangeRotateComponent', this.rotateComponent);
      }

      this.rotateComponent = addDamping(
        this.rotateComponent,
        dampingCoef * damping.spin,
        minRotateAngle,
      );
    }

    /* if (this.forwardComponent !== 0) {
      const direction = this.direction
        .clone()
        .multiplyScalar(this.forwardComponent);
      this.velocity.add(direction);

      this.forwardComponent = addDamping(
        this.forwardComponent,
        damping,
        minMovement,
      );
    } */

    /* if (this.sideComponent !== 0) {
      const direction = this.#side.crossVectors(this.direction, this.#yawAxis);
      direction.normalize();
      this.velocity.add(direction.multiplyScalar(this.sideComponent));

      this.sideComponent = addDamping(this.sideComponent, damping, minMovement);
    } */

    this.velocity.addScaledVector(this.velocity, deltaDamping);
    const deltaPosition = this.#vel
      .copy(this.velocity)
      .multiplyScalar(deltaTime);
    this.collider.translate(deltaPosition);
    this.object.position.copy(this.collider.start);
    this.object.position.y += this.halfHeight;
    this.object.rotation.y = this.rotation.phi;

    if (this.isFPV()) {
      this.camera.rotation.x = this.povRotation.theta + this.deltaY;
      this.camera.rotation.y = this.povRotation.phi + this.rotation.phi;
      this.camera.position.copy(this.collider.end);
    }

    if (this.onUpdate != null) {
      this.onUpdate(deltaTime);
    }
  }
}

export default Character;
