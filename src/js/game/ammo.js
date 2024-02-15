import {
  IcosahedronGeometry,
  OctahedronGeometry,
  BufferGeometry,
  WireframeGeometry,
  MeshBasicMaterial,
  MeshNormalMaterial,
  LineBasicMaterial,
  PointsMaterial,
  Mesh,
  LineSegments,
  Points,
  Group,
  Float32BufferAttribute,
  Texture,
  Sphere,
  Vector3,
  NormalBlending,
} from 'three';

import { Ammo as AmmoData } from './data';
import Publisher from './publisher';
import { World, AmmoSettings } from './settings';
import textures from './textures';

const { exp, sqrt } = Math;

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
textures.crossStar(context);

const texture = new Texture(canvas);
texture.needsUpdate = true;

class Ammo extends Publisher {
  #vecA = new Vector3();

  #vecB = new Vector3();

  #vecC = new Vector3();

  constructor(name) {
    super();

    this.name = name;

    const dataMap = new Map(AmmoData);
    const ammo = dataMap.get(name);

    const {
      color,
      wireColor,
      pointColor,
      pointSize,

      radius,
      detail,
      numAmmo,
      speed,
      rotateSpeed,
      weight,
      fireInterval,
      accuracy,

      update,
    } = { ...ammo };

    const geom = new IcosahedronGeometry(radius, detail);
    const geomWire = new WireframeGeometry(geom);
    const pointsGeom = new OctahedronGeometry(radius + 4, detail);
    const pointsVertices = pointsGeom.attributes.position.array.slice(0);

    const bufferGeom = new BufferGeometry();
    bufferGeom.setAttribute(
      'position',
      new Float32BufferAttribute(pointsVertices, 3),
    );
    bufferGeom.computeBoundingSphere();

    const mat = new MeshBasicMaterial({ color });
    /* const wireMat = new MeshBasicMaterial({
      color: AmmoSettings.wireColor,
      wireframe: true,
    }); */
    const wireMat = new LineBasicMaterial({
      color: wireColor,
    });

    const pointsMat = new PointsMaterial({
      color: pointColor,
      size: pointSize,
      map: texture,
      blending: NormalBlending,
      alphaTest: 0.5,
    });

    this.list = [];
    this.index = 0;

    for (let i = 0; i < numAmmo; i += 1) {
      const mesh = new Mesh(geom, mat);
      const wireMesh = new LineSegments(geomWire, wireMat);
      const pointsMesh = new Points(bufferGeom, pointsMat);

      const group = new Group();
      group.add(mesh);
      group.add(wireMesh);
      group.add(pointsMesh);
      //this.scene.add(group);

      const bullet = {
        object: group,
        collider: new Sphere(
          new Vector3(0, i * radius * 2 - 1000, 0),
          radius,
        ),
        velocity: new Vector3(),
        radius,
        weight,
        speed,
        rotateSpeed,
      };
      bullet.update = update.bind(bullet);

      this.list.push(bullet);
    }
  }
}

export default Ammo;
