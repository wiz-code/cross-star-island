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
const Basename = location.pathname !== Delimiter ? location.pathname : Delimiter;

console.log(Basename);
export { Basename };
