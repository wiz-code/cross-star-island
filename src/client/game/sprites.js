const { PI } = Math;

const sprites = {
  sightLines(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);
    context.fillStyle = '#FFF';
    context.beginPath();
    context.rect(4, 56, 1, 16);
    context.rect(16, 56, 1, 16);
    context.rect(28, 56, 1, 16);

    context.rect(99, 56, 1, 16);
    context.rect(111, 56, 1, 16);
    context.rect(123, 56, 1, 16);
    context.fill();

    return context;
  },

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
  crossStarDotted(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);
    context.fillStyle = '#FFF';

    context.beginPath();

    /* context.rect(56, 0, 16, 32);
    context.rect(96, 56, 16, 16);
    context.rect(56, 96, 16, 32);
    context.rect(0, 56, 32, 16); */

    context.rect(56, 0, 16, 28);
    context.rect(100, 56, 28, 16);
    context.rect(56, 100, 16, 28);
    context.rect(0, 56, 28, 16);

    context.moveTo(56, 32);
    context.lineTo(72, 32);
    context.lineTo(72, 56);
    context.lineTo(96, 56);
    context.lineTo(96, 72);
    context.lineTo(72, 72);
    context.lineTo(72, 96);
    context.lineTo(56, 96);
    context.lineTo(56, 72);
    context.lineTo(32, 72);
    context.lineTo(32, 56);
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
    context.arc(0, 0, 4, 0, 2 * PI);

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

  rectangle(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);

    context.lineWidth = 10;
    context.miterLimit = 20;
    context.strokeStyle = '#FFF';
    context.moveTo(64, 8);
    // context.lineTo(120, 64);
    context.quadraticCurveTo(84, 44, 120, 64);
    context.quadraticCurveTo(84, 84, 64, 120);
    context.quadraticCurveTo(44, 84, 8, 64);
    context.quadraticCurveTo(44, 44, 64, 8);
    // context.lineTo(64, 120);
    // context.lineTo(8, 64);

    context.closePath();
    context.stroke();

    return context;
  },

  triangle(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);
    context.lineWidth = 8;
    context.miterLimit = 20;
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

  isoscelesTriangle(context, rotation = 0, fill = false) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);

    context.translate(64, 64);
    context.rotate(rotation);
    context.lineWidth = 6;
    context.miterLimit = 20;
    context.strokeStyle = '#FFF';
    context.fillStyle = '#FFF';
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(55, 48);
    context.lineTo(-55, 48);
    context.closePath();

    if (fill) {
      context.fill();
    } else {
      context.stroke();
    }

    return context;
  },

  direction(context) {
    const { canvas } = context;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, 128, 128);
    context.lineWidth = 1;
    context.lineCap = 'butt';
    context.miterLimit = 20;

    context.shadowColor = '#FFF';
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;

    context.fillStyle = '#FFF';
    context.beginPath();
    context.moveTo(0, 20);
    context.bezierCurveTo(44, 4, 84, 4, 128, 20);
    context.moveTo(128, 20);
    context.bezierCurveTo(84, 8, 44, 8, 0, 20);
    context.fill();

    return context;
  },

  text(context, text, x = 0, y = 0, options = {}) {
    const { canvas } = context;
    canvas.width = 512;
    canvas.height = 48;

    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.shadowColor = '#000';
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;

    context.fillStyle = '#FFF';
    context.font = '48px "Helvetica Neue",Arial,"メイリオ",Meiryo,"ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","ヒラギノ角ゴシック","Hiragino Sans","Roboto",sans-serif';
    context.textBaseline = 'alphabetic';
    context.fillText(text, x, y);

    return context;
  },
};

export default sprites;
