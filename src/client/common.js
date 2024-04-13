export const Meta = [
  ['siteName', 'JavaScript/Three.jsのゲーム'],
  ['title', 'CrossStar Island'],
  ['subtitle', 'クロススターアイランド'],
  [
    'description',
    'ローポリながら3D空間に星型のグリッドを配置してプレイヤーの空間把握を容易にした新感覚一人称シューティングゲーム。待ち受ける難所をクリアして美女が待つゴールへたどり着け！',
  ],
];

const Delimiter = '/';
let Basename = Delimiter;

const pathname = location.pathname;

if (pathname !== Delimiter) {
  const paths = pathname.split(Delimiter);
  paths.pop();
  Basename = paths.join(Delimiter);
}

export { Basename };
