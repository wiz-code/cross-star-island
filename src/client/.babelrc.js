module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        corejs: '3.34',
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [],
};
