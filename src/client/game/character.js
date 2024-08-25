import {
  Vector3,
  Spherical,
  Euler,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
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
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import Capsule from './capsule';
import { Keys, Actions, States, Characters } from './data';
import Entity from './entity';
import { World, Controls } from './settings';
import { getVectorPos, visibleChildren } from './utils';
import ModelLoader from './model-loader';

const { floor, sign, PI } = Math;

const RAD30 = (30 / 360) * PI * 2;
const dampingCoef = PI / 180;
const minRotateAngle = PI / 720;
const arrowColor = 0x2CBBCE;

const addDamping = (component, damping, minValue) => {
  let value = component;

  if (value >= 0) {
    value -= damping;

    if (value < minValue) {
      value = 0;
    }
  } else {
    value += damping;

    if (value >= -minValue) {
      value = 0;
    }
  }

  return value;
};

const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);
const easeInQuad = (x) => x * x;

class Character extends Entity {
  #vel = new Vector3(0, 0, 0);

  #forward = new Vector3();

  #sideA = new Vector3();

  #sideB = new Vector3();

  #sideC = new Vector3();

  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  #vecD = new Vector3();

  #vecE = new Vector3();

  #euler = new Euler(0, 0, 0, 'YXZ');

  #yawAxis = new Vector3(0, 1, 0);

  #pitchAxis = new Vector3(1, 0, 0);

  #isGrounded = false;

  #inputs = new Map();

  #states = new Set();

  #stunningElapsedTime = 0;

  #stunningDuration = 0;

  #pausedDuration = 0;

  #urgencyAction = -1;

  #urgencyElapsedTime = 0;

  #urgencyDuration = 0;

  #momentum = 0;

  #turnElapsedTime = 0;

  #rotateComponent = 0;

  #fallingDistance = 0;

  #initDir = new Vector3(0, 0, -1);

  #arrowDir = new Vector3();

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
      color: data.faceColor,
    });
    material.faceWire = new LineBasicMaterial({
      color: data.faceWireColor,
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

  static createArrow(data) {
    const geometry = {};
    const material = {};
    const mesh = {};

    const scale = 0.8;
    const arrowHeadRadius = scale * data.radius * 0.08;
    const arrowBodyRadius = scale * data.radius * 0.04;
    const arrowHeadLength = scale * data.height * 0.3;
    const arrowBodyLength = scale * data.height * 0.6;


    geometry.arrowHead = new ConeGeometry(arrowHeadRadius, arrowHeadLength, 32);
    geometry.arrowBody = new CylinderGeometry(
      arrowBodyRadius,
      arrowBodyRadius,
      arrowBodyLength,
      32
    );
    geometry.arrowHead.rotateX(PI * -0.5);
    geometry.arrowBody.rotateX(PI * -0.5);
    geometry.arrowHead.translate(0, 0, ((arrowHeadLength + arrowBodyLength) / -2));

    geometry.arrow = mergeGeometries([geometry.arrowHead, geometry.arrowBody]);
    geometry.arrow.center();

    material.arrow = new MeshBasicMaterial({
      color: arrowColor,
      transparent: true,
      opacity: 0.5,
    });
    mesh.arrow = new Mesh(geometry.arrow, material.arrow);
    mesh.arrow.name = 'arrow';

    return mesh.arrow;
  }

  static createPoints(data, texture) {
    const geomSize = data.radius + 0.5;

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

  constructor(game, name, ctype, useVRM = true, texture) {
    super(name, 'character');

    this.game = game;

    const dataMap = new Map(Characters);

    if (!dataMap.has(ctype)) {
      throw new Error('character data not found');
    }

    this.data = dataMap.get(ctype);
    this.useVRM = useVRM; /// //////////

    this.rotation = new Spherical(); // phi and theta
    this.povRotation = new Spherical();
    this.velocity = new Vector3();
    this.direction = this.#initDir.clone();

    this.gunType = '';
    this.guns = new Map();
    this.elapsedTime = 0;

    this.hasControls = false;
    this.arrow = Character.createArrow(this.data);

    this.model = null; // promise
    this.pose = null; // promise
    this.motions = null; // promise

    // this.object = null;

    // this.fire = this.fire.bind(this);
    this.input = this.input.bind(this);
    this.setPovRot = this.setPovRot.bind(this);

    if (useVRM && this.data.model != null) {
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

      scene.traverse((obj) => {
        obj.frustumCulled = false;
      });

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
    return this.#states.has(States.stunning);
  }

  setStunning(duration) {
    if (!this.#states.has(States.stunning)) {
      this.#states.add(States.stunning);
      this.#stunningElapsedTime = 0;
      this.#stunningDuration = duration;
    }
  }

  hasState(state) {
    return this.#states.has(state);
  }

  setAlive(bool = true) {
    super.setAlive(bool);

    if (this.useVRM || this.hasControls) {
      return;
    }

    super.enableCollider(bool);
    super.visible(bool);
  }

  setControls(controls) {
    this.hasControls = true;

    controls.subscribe('input', this.input);
    controls.subscribe('setPovRot', this.setPovRot);

    this.subscribe('onRotate', controls.onRotate);
    this.subscribe('setCharacterRot', controls.setCharacterRot);
    this.subscribe('onUnsetControls', controls.onUnsetControls);
  }

  unsetControls() {
    this.hasControls = false;

    this.publish('onUnsetControls');
    this.clear('onRotate');
    this.clear('setCharacterRot');
    this.clear('onUnsetControls');
  }

  setPosition(position, phi = 0, theta = 0) {
    const pos = getVectorPos(position);

    this.rotation.phi = phi;
    this.rotation.theta = theta;

    this.direction.copy(this.#initDir).applyAxisAngle(this.#yawAxis, phi);
    this.publish('setCharacterRot', this.rotation);

    this.collider.start.copy(pos);
    this.collider.start.y += this.data.radius;
    this.collider.end.copy(pos);
    this.collider.end.y += this.data.height + this.data.radius;
  }

  setPovRot(rot, offset) {
    this.povRotation.phi = rot.phi;
    this.povRotation.theta = rot.theta + offset;
  }

  isGrounded() {
    return this.#isGrounded;
  }

  setGrounded(bool) {
    this.#isGrounded = bool;
  }

  resetCoords() {
    this.rotation.phi = 0;
    this.rotation.theta = 0;
    this.velocity.set(0, 0, 0);
    this.direction.copy(this.#initDir);
    this.#fallingDistance = 0;
  }

  getFallingDistance() {
    return this.#fallingDistance;
  }

  jump(value = 1) {
    if (this.hasControls && this.game.methods.has('play-sound')) {
      const playSound = this.game.methods.get('play-sound');
      playSound('jump');
    }

    this.velocity.y = this.data.jumpPower * value;
  }

  moveForward(deltaTime, state = States.alive, value = 1) {
    let multiplier = deltaTime;

    if (this.#isGrounded) {
      if (state === States.sprint && deltaTime >= 0) {
        multiplier *= this.data.speed * this.data.sprint * value;
      } else if (state === States.urgency) {
        multiplier *= this.data.speed * this.data.urgencyMove;
      } else {
        multiplier *= this.data.speed * value;
      }
    } else {
      multiplier *= this.data.airSpeed * value;
    }

    this.#forward.copy(this.direction);
    const side = this.#sideA.crossVectors(this.direction, this.#yawAxis);
    this.#forward.applyAxisAngle(side, sign(-deltaTime) * RAD30);
    this.velocity.add(this.#forward.multiplyScalar(multiplier));
  }

  rotate(deltaTime, direction, value = 1) {
    const { urgencyTurn, turnLagTime } = Controls;
    const { turnSpeed } = this.data;

    if (this.#states.has(States.urgency)) {
      const t0 = (this.#urgencyElapsedTime - deltaTime) / this.#urgencyDuration;
      const t1 = this.#urgencyElapsedTime / this.#urgencyDuration;
      const r0 = direction * urgencyTurn * easeOutQuad(t0);
      const r1 = direction * urgencyTurn * easeOutQuad(t1);

      this.#rotateComponent = r1 - r0;
    } else {
      if (this.#momentum === direction) {
        this.#turnElapsedTime += deltaTime;
      } else {
        this.#turnElapsedTime = deltaTime;
        this.#momentum = direction;
      }

      if (this.#turnElapsedTime > turnLagTime) {
        this.#turnElapsedTime = turnLagTime;
      }

      const progress = this.#turnElapsedTime / turnLagTime;
      const speed = this.#momentum * turnSpeed * value;
      this.#rotateComponent = speed * deltaTime * easeOutQuad(progress);
    }
  }

  moveSide(deltaTime, state = States.idle) {
    let multiplier = deltaTime;

    if (this.#isGrounded) {
      multiplier *= this.data.speed;

      if (state === States.urgency) {
        multiplier *= this.data.urgencyMove * 0.6;
      }
    } else {
      multiplier *= this.data.airSpeed;
    }

    const direction = this.#sideB.crossVectors(this.direction, this.#yawAxis);
    direction.applyAxisAngle(this.direction, sign(deltaTime) * RAD30);
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

  setAmmoType(ammoType) {
    if (this.guns.has(this.gunType)) {
      const gun = this.guns.get(this.gunType);
      gun.setAmmoType(ammoType);
    }
  }

  fire() {
    if (this.guns.has(this.gunType)) {
      const gun = this.guns.get(this.gunType);
      gun.fire(this);
    }
  }

  input(inputs, urgencyAction) {
    // 入力操作の処理
    this.#inputs = inputs;

    if (this.#states.has(States.stunning)) {
      return;
    }

    if (!this.#states.has(States.urgency)) {
      if (urgencyAction !== -1) {
        this.#urgencyAction = urgencyAction;

        this.#states.add(States.urgency);
        this.#urgencyElapsedTime = 0;

        if (
          this.#urgencyAction === Actions.quickTurnLeft ||
          this.#urgencyAction === Actions.quickTurnRight
        ) {
          this.#urgencyDuration = Controls.urgencyTurnDuration;
        } else {
          this.#urgencyDuration = Controls.urgencyDuration;
        }

        if (this.hasControls && this.game.methods.has('play-sound')) {
          const playSound = this.game.methods.get('play-sound');
          playSound('dash');
        }
      }
    }
  }

  /* addTweener(tweener, arg) {
    const tween = tweener(this, arg);
    const updater = tween.update.bind(tween);
    this.subscribe('tween', updater);
  } */

  /* updatePos() {
    this.object.position.copy(this.collider.start);
    this.object.position.y += this.halfHeight;
    this.object.rotation.y = this.rotation.phi;

    if (this.hasControls) {
      this.camera.position.copy(this.collider.end);
    }
  } */

  update(deltaTime, elapsedTime, damping) {
    // 自機の動き制御
    if (this.#states.has(States.stunning)) {
      this.#stunningElapsedTime += deltaTime;
      this.#inputs.clear();

      if (this.#stunningDuration <= this.#stunningElapsedTime) {
        this.#states.delete(States.stunning);
        this.#stunningElapsedTime = 0;
        this.#stunningDuration = 0;
      }
    }

    if (this.#inputs.has(Actions.jump) && this.#isGrounded) {
      const value = this.#inputs.get(Actions.jump);
      this.jump(value);
      this.#inputs.delete(Actions.jump);
    }

    if (this.#inputs.has(Actions.trigger)) {
      const value = this.#inputs.get(Actions.trigger);
      this.fire(value);
      this.#inputs.delete(Actions.trigger);
    }

    if (this.#states.has(States.urgency)) {
      this.#urgencyElapsedTime += deltaTime;

      if (this.#urgencyDuration > this.#urgencyElapsedTime) {
        if (this.#urgencyAction === Actions.quickMoveForward) {
          this.moveForward(deltaTime, States.urgency);
        } else if (this.#urgencyAction === Actions.quickMoveBackward) {
          this.moveForward(-deltaTime, States.urgency);
        } else if (this.#urgencyAction === Actions.quickTurnLeft) {
          this.rotate(deltaTime, 1);
        } else if (this.#urgencyAction === Actions.quickTurnRight) {
          this.rotate(deltaTime, -1);
        } else if (this.#urgencyAction === Actions.quickMoveLeft) {
          this.moveSide(-deltaTime, States.urgency);
        } else if (this.#urgencyAction === Actions.quickMoveRight) {
          this.moveSide(deltaTime, States.urgency);
        }
      } else {
        this.#states.add(States.stunning);
        this.#stunningElapsedTime = 0;

        if (
          this.#urgencyAction === Actions.quickTurnLeft ||
          this.#urgencyAction === Actions.quickTurnRight
        ) {
          this.#stunningDuration = Controls.stunningTurnDuration;
        } else {
          this.#stunningDuration = Controls.stunningDuration;
        }

        this.#states.delete(States.urgency);
        this.#urgencyElapsedTime = 0;
        this.#urgencyDuration = 0;
        this.#urgencyAction = -1;
      }
    } else {
      if (this.#inputs.has(Actions.rotateLeft)) {
        const value = this.#inputs.get(Actions.rotateLeft);
        this.rotate(deltaTime, 1, value);
      } else if (this.#inputs.has(Actions.rotateRight)) {
        const value = this.#inputs.get(Actions.rotateRight);
        this.rotate(deltaTime, -1, value);
      } else {
        this.#momentum = 0;
      }

      if (this.#inputs.has(Actions.splint)) {
        this.moveForward(deltaTime, States.sprint);
      } else if (this.#inputs.has(Actions.moveForward)) {
        const value = this.#inputs.get(Actions.moveForward);
        this.moveForward(deltaTime, States.alive, value);
      } else if (this.#inputs.has(Actions.moveBackward)) {
        const value = this.#inputs.get(Actions.moveBackward);
        this.moveForward(-deltaTime, States.alive, value);
      }

      if (this.#inputs.has(Actions.moveLeft)) {
        this.moveSide(-deltaTime);
      } else if (this.#inputs.has(Actions.moveRight)) {
        this.moveSide(deltaTime);
      }
    }

    // 移動の減衰処理
    const deltaDamping = this.#isGrounded ? damping.ground : damping.air;

    if (!this.#isGrounded) {
      const falling = World.gravity * deltaTime;
      this.velocity.y -= falling;

      if (this.velocity.y < 0) {
        this.#fallingDistance += falling;
      }
    } else {
      this.#fallingDistance = 0;
    }

    if (this.#rotateComponent !== 0) {
      this.direction.applyAxisAngle(this.#yawAxis, this.#rotateComponent);

      this.rotation.phi += this.#rotateComponent;

      if (this.hasControls) {
        this.publish('onRotate', this.rotation.phi, this.#rotateComponent);
      }

      if (!this.#states.has(States.urgency)) {
        this.#rotateComponent = addDamping(
          this.#rotateComponent,
          dampingCoef * damping.spin,
          minRotateAngle,
        );
      }
    }

    this.velocity.addScaledVector(this.velocity, deltaDamping);
    const deltaPosition = this.#vel
      .copy(this.velocity)
      .multiplyScalar(deltaTime);
    this.collider.translate(deltaPosition);

    if (this.hasControls) {
      if (this.povRotation.phi === 0 && this.povRotation.theta === 0) {
        if (this.arrow.visible) {
          this.arrow.visible = false;
        }
      } else {
        if (!this.arrow.visible) {
          this.arrow.visible = true;
        }

        if (this.povRotation.phi !== 0 && this.povRotation.theta !== 0) {}

        this.arrow.position.copy(this.collider.end);

        this.#arrowDir.copy(this.direction)
          .applyAxisAngle(this.#yawAxis, this.povRotation.phi);

        const side = this.#sideC.crossVectors(this.#arrowDir, this.#yawAxis);
        this.#arrowDir.applyAxisAngle(side, this.povRotation.theta);

        this.arrow.position.addScaledVector(this.#arrowDir, this.data.height + 1);
        this.arrow.position.y -= 1;
        this.arrow.rotation.y = this.rotation.phi;
      }
    }
  }
}

export default Character;
