import { Vector3 } from 'three';
import { Tween, Group } from '@tweenjs/tween.js';
import { States, Compositions, Stages } from './data';

import { Basepath } from '../common';
import { addOffsetToPosition } from './utils';

const { random } = Math;

const getRandomInclusive = (min, max) => random() * (max - min) + min;
const compositions = new Map(Compositions);
const vec = new Vector3();
const vec2 = new Vector3();
const yawAxis = new Vector3(0, 1, 0);

const clearStage = ({ states, methods }, c1, c2, punishment = false) => {
  const playSound = methods.get('play-sound');
  !punishment && playSound?.('girl-voice-1');
  playSound?.('goal');

  const time = states.get('time');
  const falls = states.get('falls');
  const hits = states.get('hits');
  const pushAway = states.get('push-away');
  const checkpointIndex = states.get('checkpointIndex');
  const clear = methods.get('clear');
  clear?.(time, falls, hits, pushAway, checkpointIndex, punishment);
};

export const handlers = [
  {
    eventName: 'oob',
    targetName: 'teleport-character',
    /* condition(character) {
      return character.hasControls;
    }, */
    handler({ states, methods }, character) {
      if (character.hasControls) {
        const falls = states.get('falls');
        states.set('falls', falls + 1);

        const stageName = states.get('stageName');
        const stageData = methods.get('getStageData')?.(stageName);

        const checkpointIndex = states.get('checkpointIndex');
        const checkpoint = stageData.checkpoints[checkpointIndex];
        const { offset } = stageData.sections[checkpointIndex];

        character.resetCoords();

        const position = addOffsetToPosition(checkpoint.position, offset);
        character.setPosition(position, checkpoint.phi, checkpoint.theta);

        return;
      }

      if (character.name === 'girl-1') {
        clearStage({ states, methods }, character, null, true);
        return;
      }

      const pushAway = states.get('push-away');
      states.set('push-away', pushAway + 1);
    },
  },
  {
    eventName: 'get-item',
    targetName: 'weapon-upgrade',
    handler({ methods }, character) {
      if (character.guns.has(character.gunType)) {
        if (character.hasControls) {
          const playSound = methods.get('play-sound');
          playSound?.('get-item');
        }

        const gun = character.guns.get(character.gunType);
        const { ammoTypes } = gun.data;
        const { name } = gun.currentAmmo;
        const index = ammoTypes.indexOf(name);

        if (index > -1) {
          const ammoType = ammoTypes[index + 1];

          if (ammoType != null) {
            character.setAmmoType(ammoType);
          }
        }
      }
    },
  },
  {
    eventName: 'get-item',
    targetName: 'hyper-dash',
    handler({ states, methods }, character, object) {
      if (character.hasControls) {
        const playSound = methods.get('play-sound');
        playSound?.('fast-move');
      }

      character.velocity.addScaledVector(object.params.velocity, 30);
    },
  },
  {
    eventName: 'get-item',
    targetName: 'hyper-jump',
    handler({ states, methods }, character, object) {
      if (character.hasControls) {
        const playSound = methods.get('play-sound');
        playSound?.('jump');
      }

      character.velocity.addScaledVector(object.params.velocity, 30);
    },
  },
  {
    eventName: 'get-item',
    targetName: 'checkpoint',
    handler({ states, methods }, character) {
      if (character.hasControls) {
        const playSound = methods.get('play-sound');
        playSound?.('get-item');
      }

      const checkpointIndex = states.get('checkpointIndex');
      states.set('checkpointIndex', checkpointIndex + 1);
    },
  },
  {
    eventName: 'collision',
    targetName: 'girl-1',
    once: true,
    handler: clearStage,
  },
];

export const Tweeners = [
  [
    'spawn-stone-1',
    (game, target, arg) => {
      const time = arg ?? 0;
      const range = 1.8;

      const stageName = game.states.get('stageName');
      const stageData = game.methods.get('getStageData')?.(stageName);
      const { offset } = stageData.sections[target.params.section];

      const group = new Group();
      const tween = new Tween(target.collider.center, group);
      tween
        .onEveryStart(() => {
          const randomNum = getRandomInclusive(-range, range);
          const initPos = { ...target.params.position };
          initPos.sx += randomNum;
          const position = addOffsetToPosition(initPos, offset);
          target.setPosition(position);
          target.velocity.copy(new Vector3(0, 0, 0));
        })
        .delay(8000)
        .repeat(Infinity)
        .start(time);

      return group;
    },
  ],
  [
    'spawn-stone-2',
    (game, target, ...args) => {
      const [time = 0, duration = 10000, delay = 0] = args ?? [];

      const stageName = game.states.get('stageName');
      const stageData = game.methods.get('getStageData')?.(stageName);
      const { offset } = stageData.sections[target.params.section];

      const param = { progress: 0 };

      const group = new Group();
      const tween = new Tween(param, group);
      tween
        .to({ progress: 1 }, duration)
        .onEveryStart(() => {
          target.enableCollider(true);
          target.visible(true);

          const position = addOffsetToPosition(target.params.position, offset);
          target.setPosition(position);
          target.velocity.copy(new Vector3(0, 0, 0));
        })
        .onRepeat(({ progress }) => {
          if (progress === 1) {
            target.enableCollider(false);
            target.visible(false);
          }
        })
        .delay(delay)
        .repeat(Infinity)
        .start(time);

      return group;
    },
  ],
  [
    'avoidance-1',
    (game, target, ...args) => {
      const [time = 0, direction = 'x-axis', to = -20, duration = 2000] = args;
      const object = { value: 0 };
      let prev = 0;

      const update = ({ value }) => {
        const delta = value - prev;

        if (direction === 'x-axis') {
          vec2.set(delta, 0, 0);
        } else if (direction === 'z-axis') {
          vec2.set(0, 0, delta);
        }

        target.collider.translate(vec2);
        prev = value;
      };

      const group = new Group();
      const tween1 = new Tween(object, group)
        .to({ value: to }, duration)
        .onUpdate(update);
      const tween2 = new Tween(object, group)
        .to({ value: -to }, duration * 2)
        .onUpdate(update);
      const tween3 = new Tween(object, group)
        .to({ value: 0 }, duration)
        .onUpdate(update);

      tween1.chain(tween2).start(time);
      tween2.chain(tween3);
      tween3.chain(tween1);

      return group;
    },
  ],
  [
    'swing-motion-1',
    (game, target, ...args) => {
      const [time = 0, direction = 'x-axis', to = -20, duration = 5000] = args;
      const { object: mesh, offset, count } = target;
      const position = target.geometry.getAttribute('position');
      const object = { value: 0 };

      let prev = 0;

      const update = ({ value }) => {
        const delta = value - prev;

        for (let i = 0; i < count; i += 1) {
          const index = offset + i;

          if (direction === 'x-axis') {
            const posX = position.getX(index);
            position.setX(index, posX + delta);
          } else if (direction === 'y-axis') {
            const posY = position.getY(index);
            position.setY(index, posY + delta);
          } else {
            const posZ = position.getZ(index);
            position.setZ(index, posZ + delta);
          }
        }

        prev = value;
        position.needsUpdate = true;

        if (direction === 'y-axis') {
          mesh.translateY(delta);
        } else if (direction === 'x-axis') {
          mesh.translateX(delta);
        } else {
          mesh.translateZ(delta);
        }
      };

      const group = new Group();
      const tween1 = new Tween(object, group)
        .to({ value: to }, duration)
        .onUpdate(update);
      const tween2 = new Tween(object, group)
        .to({ value: -to }, duration * 2)
        .onUpdate(update);
      const tween3 = new Tween(object, group)
        .to({ value: 0 }, duration)
        .onUpdate(update);

      tween1.chain(tween2).start(time);
      tween2.chain(tween3);
      tween3.chain(tween1);

      return group;
    },
  ],
];

export const Updaters = [
  [
    'rolling-stone-1',
    (game, target, deltaTime, elapsedTime) => {
      const { params: { sideDir } } = target;
      sideDir.crossVectors(target.velocity, yawAxis).normalize();
      target.object.setRotationFromAxisAngle(sideDir, -elapsedTime * target.data.rotateSpeed);
    },
  ],
  [
    'item-ring-1',
    (game, target, deltaTime) => {
      const rotateSpeed = deltaTime * target.data.rotateSpeed;

      target.object.rotation.y -= rotateSpeed;
      target.object.rotation.z -= rotateSpeed * 2;
    },
    /* {
      state: States.alive,
      update(game, target, deltaTime) {
        const rotateSpeed = deltaTime * target.data.rotateSpeed;

        target.object.rotation.y -= rotateSpeed;
        target.object.rotation.z -= rotateSpeed * 2;
      },
    }, */
  ],
  [
    'item-ring-2',
    (game, target, deltaTime) => {
      const rotateSpeed = deltaTime * target.data.rotateSpeed;

      if (target.object != null) {
        const points = target.object.getObjectByName('points');
        points.rotation.y -= deltaTime * target.data.rotateSpeed;
      }
    },
    /* {
      state: States.alive,
      update(game, target, deltaTime) {
        const rotateSpeed = deltaTime * target.data.rotateSpeed;

        if (target.object != null) {
          const points = target.object.getObjectByName('points');
          points.rotation.y -= deltaTime * target.data.rotateSpeed;
        }
      },
    }, */
  ],
  [
    'bullet-fire-1',
    (game, target, deltaTime) => {
      target.params.elapsedTime += deltaTime;

      if (target.params.elapsedTime > target.params.fireInterval) {
        target.params.elapsedTime = 0;
        target.fire();
      }
    },
  ],
  [
    'bullet-fire-2',
    (game, target, deltaTime, elapsedTime) => {
      const { params } = target;
      const { canFire, currentTime, burstDuration, burstInterval } = params;
      //target.params.elapsedTime += deltaTime;

      if (canFire) {
        const interval = elapsedTime - currentTime;

        if (burstDuration > interval) {
          target.fire();
        } else {
          params.canFire = false;
          params.currentTime = elapsedTime;
        }
      } else {
        const interval = elapsedTime - currentTime;

        if (interval > burstInterval) {
          params.canFire = true;
          params.currentTime = elapsedTime;
        }
      }
    },
  ],
  [
    'rotation-1',
    (game, target, deltaTime) => {
      if (target.object != null) {
        target.rotation.phi += deltaTime * target.data.rotateSpeed * 0.5;
      }
    },
  ],
  [
    'satellite-points',
    (game, target, deltaTime) => {
      if (target.object != null) {
        const points = target.object.getObjectByName('points');
        points.rotation.y -= deltaTime * target.data.rotateSpeed;
      }
    },
    /* {
      state: States.alive,
      update(game, target, deltaTime) {
        if (target.object != null) {
          const points = target.object.getObjectByName('points');
          points.rotation.y -= deltaTime * target.data.rotateSpeed;
        }
      },
    }, */
  ],
];
