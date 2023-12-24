import * as THREE from 'three';

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
};

export default textures;
