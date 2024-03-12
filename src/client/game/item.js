import {
  TorusGeometry,
  RingGeometry,
  EdgesGeometry,
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
  Sphere,
  Vector3,
  Texture,
} from 'three';

import { World } from './settings';
import Collidable from './collidable';
import { Items } from './data';
import textures from './textures';

const { floor } = Math;
const itemData = new Map(Items);

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
textures.crossStar(context);

const texture = new Texture(canvas);
texture.needsUpdate = true;

class Item extends Collidable {
  #active = false;

  #elapsedTime = 0;

  static createRing(data) {
    const halfValue = {
      radialSegments: floor(data.radialSegments / 2),
      tubularSegments: floor(data.tubularSegments / 2),
    };
    const geom = new TorusGeometry(
      data.radius,
      data.tube,
      data.radialSegments,
      data.tubularSegments,
    );
    const wireGeom = new EdgesGeometry(geom);
    let pointsGeom = new RingGeometry(data.radius - 6, data.radius + 6, 4, 0);
    const vertices = pointsGeom.attributes.position.array.slice(0);
    pointsGeom = new BufferGeometry(pointsGeom);
    pointsGeom.setAttribute(
      'position',
      new Float32BufferAttribute(vertices, 3),
    );
    pointsGeom.computeBoundingSphere();

    const mat = new MeshBasicMaterial({ color: data.color });
    const wireMat = new LineBasicMaterial({
      color: data.wireColor,
    });

    const pointsMat = new PointsMaterial({
      color: data.pointColor,
      size: World.pointSize,
      map: texture,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    const mesh = new Mesh(geom, mat);
    const wireMesh = new LineSegments(wireGeom, wireMat);
    const pointsMesh = new Points(pointsGeom, pointsMat);

    const object = new Group();
    object.add(mesh);
    object.add(wireMesh);
    object.add(pointsMesh);

    return object;
  }

  constructor(name) {
    super(name, 'item');

    if (!itemData.has(name)) {
      throw new Error('item data not found');
    }

    this.data = itemData.get(name);
    this.collider.set(new Vector3(), this.data.radius);
    this.object = Item[this.data.method](this.data);

    this.setObject(this.object);
    this.setOnUpdate(this.data.update);
    this.setActive(false);
  }

  update(deltaTime, elapsedTime, damping) {
    super.update(deltaTime, elapsedTime, damping);

    //
  }
}

export default Item;
