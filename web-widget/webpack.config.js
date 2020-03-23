var path = require('path');

module.exports = {
  entry: {
    widget: ['./src/js/widget.js']
  },
  output: {
    path: path.resolve(__dirname + '/dist'),
    filename: '[name].Channelize.js',
    publicPath: "dist"
  },
  devtool: "cheap-eval-source-map",
  devServer: {
    publicPath: '/dist/',
    compress: true,
    port: 9000
  },
  module: {
    rules: [
      { // SCSS
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader'
          }
        ]
      }
    ]
  }
};
