const path = require("path");
const pkg = require('./package.json');
const TerserPlugin = require('terser-webpack-plugin');

const banner = `
// ==UserScript==
// @name         ADOS Helper
// @namespace    https://ados/
// @version      ${pkg.version}
// @description  ADOS Helper
// @author       archerax
// @match        https://ados/WirelineRnD_Collection/WirelineRnD/_sprints/taskboard/*/WirelineRnD/*/Sprint*
// @icon         https://ados/favicon.ico
// @grant        none
// ==/UserScript==
`;

module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  optimization:{
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            preamble: banner.trim()
          }
        }
      })
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts"],
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
};
