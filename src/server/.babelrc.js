const path = require('path');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'commonjs',
        useBuiltIns: 'usage',
        corejs: {
          version: 3.34,
          proposals: true,
        },
        configPath: path.resolve(__dirname),
      },
    ],
  ],
  plugins: [],
};
