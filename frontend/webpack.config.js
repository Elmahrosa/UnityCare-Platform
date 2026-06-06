const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/main.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      favicon: "./public/favicon.ico",
    }),
    new webpack.DefinePlugin({
      "process.env.FRONTEND_FORGE_API_KEY": JSON.stringify(process.env.FRONTEND_FORGE_API_KEY || ""),
      "process.env.FRONTEND_FORGE_API_URL": JSON.stringify(process.env.FRONTEND_FORGE_API_URL || ""),
      "process.env.API_URL": JSON.stringify(process.env.API_URL || "/api"),
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
};
