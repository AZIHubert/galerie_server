const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

const {
  NODE_ENV = 'production',
} = process.env;

module.exports = {
  devtool: 'source-map',
  externals: [nodeExternals()],
  mode: NODE_ENV,
  node: {
    __dirname: false,
    __filename: false,
  },
  target: 'node',
  entry: {
    main: './src/index.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    chunkFilename: '[name].chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@sequelize': path.resolve(__dirname, './sequelize'),
      '@src': path.resolve(__dirname, './src'),
      '@root': path.resolve(__dirname, './'),
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: [
          /node_modules/,
          /\.(test.js|test.jsx)$/,
        ],
        include: /src/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
    ],
  },
};
