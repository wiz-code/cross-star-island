const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const babelConfig = require('./src/client/.babelrc');

module.exports = (env, argv) => {
  let mode = 'development';

  if (env) {
    if (env.production) {
      mode = 'production';
    }
  }

  if (argv.mode != null) {
    mode = argv.mode;
  }

  const isProd = mode === 'production';

  return {
    mode,

    watch: false,

    devtool: 'source-map',

    entry: {
      app: './src/client/index.jsx',
    },

    output: {
      path: path.resolve(__dirname, 'dist/client'),
      filename: '[name].js',
      clean: true,
    },

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: babelConfig,
          },
        },
      ],
    },

    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin(),
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/html/index.html',
      }),
    ],

    resolve: {
      extensions: ['.js', '.jsx'],
    },

    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist/client'),
        },
        {
          directory: path.join(__dirname, 'assets'),
          publicPath: '/assets',
        },
      ],
      hot: true,
      open: true,
    },
  };
};
