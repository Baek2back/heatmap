const { merge } = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist",
    host: "localhost",
    port: 3000,
    hot: true,
    open: true,
    overlay: true,
    historyApiFallback: true,
  },
});
