import {
  Vector3,
  Spherical,
  Euler,
  CapsuleGeometry,
  ConeGeometry,
  EdgesGeometry,
  SphereGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  LineBasicMaterial,
  PointsMaterial,
  NormalBlending,
  Mesh,
  LineSegments,
  Points,
  Group,
} from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';

import { Keys, Actions, States, Characters } from './data';
import Publisher from './publisher';
import { World, Controls } from './settings';
import { getVectorPos, visibleChildren } from './utils';
import ModelLoader from './model-loader';

const { floor, PI } = Math;

const RAD_30 = (30 / 360) * PI * 2;
const dampingCoef = PI / 180;
const minRotateAngle = PI / 720;

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

let id = 0;

function genId() {
  id += 1;
  return id;
}

const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);

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

  #active = false;

  #pausedDuration = 0;

  #lastTurn = '';

  #turnElapsedTime = 0;

  static createObject(data, texture) {
    const geometry = {};
    const material = {};
    const mesh = {};

    const faceSize = data.radius * 0.7;
    const faceOffset = data.radius * 0.6;

    geometry.body = new CapsuleGeometry(data.radius, data.height, 2, 8);
    geometry.wire = new EdgesGeometry(geometry.body);
    geometry.face = new SphereGeometry(
      faceSize,
      8,
      4,
      undefined,
      undefined,
      undefined,
      PI / 2,
    );
    geometry.faceWire = new EdgesGeometry(geometry.face);
    geometry.face.rotateX(-PI / 2);
    geometry.faceWire.rotateX(-PI / 2);

    const geomSize = data.radius + floor(World.pointSize / 2);

    geometry.points = new ConeGeometry(geomSize, geomSize, 3);
    const vertices = geometry.points.attributes.position.array.slice(0);

    geometry.points = new BufferGeometry();
    geometry.points.setAttribute(
      'position',
      new Float32BufferAttribute(vertices, 3),
    );
    geometry.points.computeBoundingSphere();

    material.body = new MeshBasicMaterial({
      color: data.color,
    });
    material.wire = new LineBasicMaterial({
      color: data.wireColor,
    });
    material.face = new MeshBasicMaterial({
      color: 0xdc143c,
    });
    material.faceWire = new LineBasicMaterial({
      color: 0xdb6e84,
    });

    material.points = new PointsMaterial({
      color: data.pointColor,
      size: World.pointSize,
      map: texture.point,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    mesh.body = new Mesh(geometry.body, material.body);
    mesh.wire = new LineSegments(geometry.wire, material.wire);
    mesh.face = new Mesh(geometry.face, material.face);
    mesh.faceWire = new LineSegments(geometry.faceWire, material.faceWire);
    mesh.face.position.setZ(-faceOffset);
    mesh.faceWire.position.setZ(-faceOffset);
    mesh.face.position.setY(faceOffset);
    mesh.faceWire.position.setY(faceOffset);

    mesh.points1 = new Points(geometry.points, material.points);
    mesh.points2 = new Points(geometry.points, material.points);
    mesh.points2.rotateX(PI);

    mesh.points = new Group();
    mesh.points.name = 'points';
    mesh.points.add(mesh.points1, mesh.points2);
    mesh.points1.position.setY(
      (data.height + data.radius) / 2 + World.pointSize / 4,
    );
    mesh.points2.position.setY(
      (-data.height - data.radius) / 2 - World.pointSize / 4,
    );

    const object = new Group();
    object.add(mesh.body);
    object.add(mesh.wire);
    object.add(mesh.face);
    object.add(mesh.faceWire);
    object.add(mesh.points);

    return object;
  }

  static createPoints(data, texture) {
    const geomSize = data.radius + floor(World.pointSize / 2);

    let geom = new ConeGeometry(geomSize, geomSize, 3);
    const vertices = geom.attributes.position.array.slice(0);

    geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geom.computeBoundingSphere();

    const mat = new PointsMaterial({
      color: data.pointColor,
      size: World.pointSize,
      map: texture.point,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    const mesh1 = new Points(geom, mat);
    const mesh2 = new Points(geom, mat);
    mesh2.rotateX(PI);

    const mesh = new Group();
    mesh.name = 'points';
    mesh.add(mesh1, mesh2);
    mesh1.position.setY((data.height + data.radius) / 2 + World.pointSize / 4);
    mesh2.position.setY((-data.height - data.radius) / 2 - World.pointSize / 4);

    return mesh;
  }

  static defaultParams = [['hp', 100]];

  constructor(name, texture) {
    super();

    const dataMap = new Map(Characters);

    if (!dataMap.has(name)) {
      throw new Error('character data not found');
    }

    this.id = `character-${genId()}`;
    this.name = name;
    this.data = dataMap.get(name);

    this.params = new Map(Character.defaultParams);

    this.rotateComponent = 0;
    this.povRotation = new Spherical();
    this.deltaY = 0;
    this.rotation = new Spherical(); // phi and theta
    this.velocity = new Vector3();
    this.direction = new Vector3(0, 0, -1);

    this.gunType = '';
    this.guns = new Map();
    this.camera = null;
    this.onUpdate = null;
    this.elapsedTime = 0;

    this.model = null; // promise
    this.pose = null; // promise
    this.motions = null; // promise

    this.object = null;

    this.fire = this.fire.bind(this);
    this.input = this.input.bind(this);
    this.setPovRotation = this.setPovRotation.bind(this);

    if (this.data.model != null) {
      const loader = new ModelLoader(this.data.model);
      this.model = this.loadModelData(loader, texture);

      if (Array.isArray(this.data.motions)) {
        const motions = [];

        for (let i = 0, l = this.data.motions.length; i < l; i += 1) {
          const motionName = this.data.motions[i];
          motions.push(this.loadMotionData(motionName));
        }

        this.motions = Promise.all(motions);
      }
    } else {
      this.object = Character.createObject(this.data, texture);
    }

    this.halfHeight = floor(this.data.height / 2);

    this.collider = new Capsule();
    const start = new Vector3(0, this.data.radius, 0);
    const end = start.clone();
    end.y = this.data.height + this.data.radius;
    this.collider.set(start, end, this.data.radius);

    this.setActive(false);
  }

  async loadModelData(loader, texture) {
    try {
      const gltf = await loader.load();
      const { scene } = gltf.userData.vrm;
      scene.scale.setScalar(this.data.modelSize);
      scene.position.y -= this.data.offsetY;
      const points = Character.createPoints(this.data, texture);
      const group = new Group();
      group.add(scene);
      group.add(points);
      this.object = group;
      return gltf;
    } catch (e) {
      return Promise.reject(null);
    }
  }

  async loadPoseData(name) {
    this.pose = await import(`../../../assets/pose/${name}.json`);
    return this.pose;
  }

  async loadMotionData(name) {
    try {
      const loader = new ModelLoader(name, 'vrma');
      const gltf = await loader.load();
      let animations;

      if (gltf.animations.length > 0) {
        animations = gltf.animations;
      } else if (Array.isArray(gltf.userData.vrmAnimations)) {
        animations = gltf.userData.vrmAnimations;
      } else {
        throw new Error('animations not found');
      }

      // 色々と処理

      return gltf;
    } catch (e) {
      return Promise.reject(null);
    }
  }

  isStunning() {
    return this.#stunningRemainingTime > 0;
  }

  setStunning(bool, remainingTime = Controls.stunningDuration) {
    if (bool) {
      this.#states.add(States.stunning);

      if (
        this.#actions.has(Actions.quickTurnLeft) ||
        this.#actions.has(Actions.quickTurnRight)
      ) {
        this.#stunningRemainingTime = remainingTime * 0.5;
      } else {
        this.#stunningRemainingTime = remainingTime;
      }

      return;
    }

    this.#states.delete(States.stunning);
    this.#stunningRemainingTime = 0;
  }

  isActive() {
    return this.#active;
  }

  setActive(bool = true) {
    this.#active = bool;

    if (!this.isFPV()) {
      this.visible(bool);
    }
  }

  setOnUpdate(update) {
    this.onUpdate = update.bind(this);
  }

  isFPV() {
    return this.camera != null;
  }

  setFPV(camera, controls) {
    this.camera = camera;

    this.camera.rotation.x = -RAD_30;
    this.camera.getWorldDirection(this.direction);

    controls.subscribe('fire', this.fire);
    controls.subscribe('input', this.input);
    controls.subscribe('setPovRotation', this.setPovRotation);
  }

  unsetFPV() {
    if (this.isFPV()) {
      this.camera = null;
    }
  }

  setPosition(position, phi = 0, theta = 0) {
    const pos = getVectorPos(position);

    this.rotation.phi = phi;
    this.rotation.theta = theta;
    this.direction.copy(this.#dir.clone().applyAxisAngle(this.#yawAxis, phi));

    this.collider.start.copy(pos);
    this.collider.end.copy(pos);
    this.collider.end.y += this.data.height + this.data.radius;
  }

  isGrounded() {
    return this.#isGrounded;
  }

  setGrounded(bool) {
    this.#isGrounded = bool;
  }

  visible(bool) {
    if (this.object != null) {
      visibleChildren(this.object, bool);
    }
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
  }

  /* rotate(deltaTime, state = States.idle) {
    this.rotateComponent = deltaTime;

    if (state === States.urgency) {
      this.rotateComponent *= this.data.urgencyTurn;
    } else {
      this.rotateComponent *= this.data.turnSpeed;
    }
  } */
  rotate(deltaTime, direction) {
    if (this.#states.has(States.urgency)) {
      this.rotateComponent = this.data.urgencyTurn * deltaTime;
    } else {
      if (this.#lastTurn === direction) {
        this.#turnElapsedTime += deltaTime;

        if (this.#turnElapsedTime > 1) {
          this.#turnElapsedTime = 1;
        }
      } else {
        this.#turnElapsedTime = 0;
        this.#lastTurn = direction;
      }

      const turnSpeed =
        direction === Actions.rotateLeft
          ? this.data.turnSpeed
          : -this.data.turnSpeed;
      this.rotateComponent =
        turnSpeed * deltaTime * easeOutQuad(this.#turnElapsedTime);
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
  }

  setGunType(name) {
    if (!this.data.gunTypes.includes(name)) {
      return;
    }

    this.gunType = name;
  }

  addGun(gun) {
    if (!this.data.gunTypes.includes(gun.name)) {
      return;
    }

    this.guns.set(gun.name, gun);
  }

  setAmmo(ammo) {
    if (this.guns.has(this.gunType)) {
      const gun = this.guns.get(this.gunType);
      gun.setAmmo(ammo);
    }
  }

  fire() {
    if (this.guns.has(this.gunType)) {
      const gun = this.guns.get(this.gunType);
      gun.fire(this);
    }
  }

  dispose() {
    // TODO

    // リスナーを全削除
    this.clear();
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
      this.#actions.clear();
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

  addTweener(tweener, arg) {
    const tween = tweener(this, arg);
    const updater = tween.update.bind(tween);
    this.subscribe('tween', updater);
  }

  update(deltaTime, elapsedTime, damping) {
    if (!this.#active) {
      return;
    }

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
        this.#urgencyRemainingTime = 0;

        this.setStunning(true);
      }

      if (this.#actions.has(Actions.quickMoveForward)) {
        this.moveForward(deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveBackward)) {
        this.moveForward(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickTurnLeft)) {
        this.rotate(deltaTime);
      } else if (this.#actions.has(Actions.quickTurnRight)) {
        this.rotate(-deltaTime);
      } else if (this.#actions.has(Actions.quickMoveLeft)) {
        this.moveSide(-deltaTime, States.urgency);
      } else if (this.#actions.has(Actions.quickMoveRight)) {
        this.moveSide(deltaTime, States.urgency);
      }
    } else {
      if (this.#actions.has(Actions.rotateLeft)) {
        this.rotate(deltaTime, Actions.rotateLeft);
      } else if (this.#actions.has(Actions.rotateRight)) {
        // this.rotate(-deltaTime);
        this.rotate(deltaTime, Actions.rotateRight);
      } else {
        this.#lastTurn = '';
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

    this.velocity.addScaledVector(this.velocity, deltaDamping);
    const deltaPosition = this.#vel
      .copy(this.velocity)
      .multiplyScalar(deltaTime);
    this.collider.translate(deltaPosition);

    if (this.collider.start.y < World.oob) {
      this.publish('oob', this);
    }

    if (this.isStunning()) {
      this.#pausedDuration += deltaTime;
    } else {
      if (this.onUpdate != null) {
        this.onUpdate(deltaTime, elapsedTime);
      }

      if (this.getSubscriberCount() > 0) {
        this.publish('tween', (elapsedTime - this.#pausedDuration) * 1000);
      }
    }
  }
}

export default Character;
