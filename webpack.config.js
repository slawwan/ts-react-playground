/* eslint-disable @typescript-eslint/no-var-requires */

const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  resolve: {
    alias: {
      src: "../src",
    },
    extensions: [".wasm", ".ts", ".tsx", ".mjs", ".cjs", ".js", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin()],
  devtool: "inline-source-map",
  devServer: {
    static: "./dist",
    compress: true,
    port: 9000,
  },
};
