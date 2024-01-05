import * as THREE from 'three';

const { PI } = Math;

const textures = {
  crossStar(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);
    context.fillStyle = '#FFF';
    context.beginPath();
    context.moveTo(56, 0);
    context.lineTo(72, 0);
    context.lineTo(72, 56);
    context.lineTo(128, 56);
    context.lineTo(128, 72);
    context.lineTo(72, 72);
    context.lineTo(72, 128);
    context.lineTo(56, 128);
    context.lineTo(56, 72);
    context.lineTo(0, 72);
    context.lineTo(0, 56);
    context.lineTo(56, 56);
    context.closePath();
    context.fill();

    return context;
  },
  crossStarThick(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);
    context.fillStyle = '#FFF';
    context.beginPath();
    context.moveTo(48, 0);
    context.lineTo(80, 0);
    context.lineTo(80, 48);
    context.lineTo(128, 48);
    context.lineTo(128, 80);
    context.lineTo(80, 80);
    context.lineTo(80, 128);
    context.lineTo(48, 128);
    context.lineTo(48, 80);
    context.lineTo(0, 80);
    context.lineTo(0, 48);
    context.lineTo(48, 48);
    context.closePath();
    context.fill();

    return context;
  },

  crossStarThin(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);
    context.fillStyle = '#FFF';
    context.beginPath();
    context.moveTo(60, 0);
    context.lineTo(68, 0);
    context.lineTo(68, 60);
    context.lineTo(128, 60);
    context.lineTo(128, 68);
    context.lineTo(68, 68);
    context.lineTo(68, 128);
    context.lineTo(60, 128);
    context.lineTo(60, 68);
    context.lineTo(0, 68);
    context.lineTo(0, 60);
    context.lineTo(60, 60);
    context.closePath();
    context.fill();

    return context;
  },

  sight(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);
    context.fillStyle = '#FFF';
    context.translate(64, 64);
    context.rotate(PI * 0.25);
    context.beginPath();

    for (let i = 0; i < 4; i += 1) {
      context.moveTo(-2, -62);
      context.arc(0, -62, 2, PI, 0, false);
      context.lineTo(2, -24);
      context.arc(0, -24, 2, 0, PI, false);
      context.lineTo(-2, -62);

      context.rotate(PI * 0.5);
    }

    context.closePath();
    context.fill();

    return context;
  },

  triangle(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);
    context.lineWidth = 12;
    context.miterLimit = 20
    context.strokeStyle = '#FFF';
    context.beginPath();
    context.moveTo(64, 16);
    context.lineTo(119, 112);
    context.lineTo(9, 112);
    context.lineTo(64, 16);
    context.closePath();

    context.stroke();

    return context;
  },
};

export default textures;
