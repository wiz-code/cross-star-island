import { Vector3 } from 'three';
import { Tween, Group } from '@tweenjs/tween.js';
import { States, Compositions, Stages } from './data';

import { Basepath } from '../common';
import { addOffsetToPosition } from './utils';

const { random } = Math;

const getRandomInclusive = (min, max) => random() * (max - min) + min;
const compositions = new Map(Compositions);
const vec = new Vector3();

export const handlers = [
  {
    eventName: 'oob',
    targetName: 'teleport-character',
    /*condition(character) {
      return character.hasControls;
    },*/
    handler({ states, methods }, character) {
      if (character.hasControls) {
        const falls = states.get('falls');
        states.set('falls', falls + 1);

        const stageName = states.get('stageName');
        const stageData = methods.get('getStageData')?.(stageName);

        const checkpointIndex = states.get('checkpointIndex');
        const checkpoint = stageData.checkpoints[checkpointIndex];
        const { offset } = stageData.sections[checkpointIndex];
        const position = addOffsetToPosition(checkpoint.position, offset);

        character.velocity.copy(new Vector3());
        character.setPosition(
          position,
          checkpoint.phi,
          checkpoint.theta,
        );

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
    handler({ states, methods }, c1, c2) {
      const playSound = methods.get('play-sound');
      playSound?.('girl-voice-1');
      playSound?.('goal');

      const time = states.get('time');
      const falls = states.get('falls');
      const hits = states.get('hits');
      const pushAway = states.get('push-away');
      const checkpointIndex = states.get('checkpointIndex');
      const clear = methods.get('clear');
      clear?.(time, falls, hits, pushAway, checkpointIndex);
    },
  },
];

export const Tweeners = [
  [
    'rolling-stone-1',
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
    'avoidance-1',
    (game, target, arg) => {
      const time = arg ?? 0;
      let initX = 0;
      let prevZ = 0;
      const offset = { z: 0 };
      const update = ({ z }) => {
        let diffX = 0;
        const x = target.collider.start.x;
        const diffZ = z - prevZ;

        if (initX !== 0) {
          diffX = initX - x;
        }

        vec.set(diffX, 0, diffZ);
        target.collider.translate(vec);

        prevZ = z;
      };

      const group = new Group();
      const tween1 = new Tween(offset, group)
        .to({ z: -7.5 }, 1000)
        .onUpdate(update)
        .onStart(() => {
          initX = target.collider.start.x;
        });
      const tween2 = new Tween(offset, group)
        .to({ z: 0 }, 1000)
        .onUpdate(update);

      tween1.chain(tween2).start(time);
      tween2.chain(tween1);

      return group;
    },
  ],
];

export const Updaters = [
  [
    'rolling-stone-1',
    {
      state: States.alive,
      update(game, target, deltaTime) {
        target.object.rotation.x -= deltaTime * target.data.rotateSpeed;
      },
    },
  ],
  [
    'item-ring-1',
    {
      state: States.alive,
      update(game, target, deltaTime) {
        const rotateSpeed = deltaTime * target.data.rotateSpeed;

        target.object.rotation.y -= rotateSpeed;
        target.object.rotation.z -= rotateSpeed * 2;
      },
    },
  ],
  [
    'item-ring-2',
    {
      state: States.alive,
      update(game, target, deltaTime) {
        const rotateSpeed = deltaTime * target.data.rotateSpeed;

        if (target.object != null) {
          const points = target.object.getObjectByName('points');
          points.rotation.y -= deltaTime * target.data.rotateSpeed;
        }
      },
    },
  ],
  [
    'bullet-fire-1',
    {
      state: States.alive,
      update(game, target, deltaTime) {
        target.params.elapsedTime += deltaTime;

        if (target.params.elapsedTime > target.params.fireInterval) {
          target.params.elapsedTime = 0;
          target.fire();
        }
      },
    },
  ],
  [
    'satellite-points',
    {
      state: States.alive,
      update(game, target, deltaTime) {
        if (target.object != null) {
          const points = target.object.getObjectByName('points');
          points.rotation.y -= deltaTime * target.data.rotateSpeed;
        }
      },
    },
  ],
];
