const webpack = require("webpack");
const path = require("path");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
    entry: {
        "map": "./src/library.js",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        library: "GW2Map",
    },
    devtool: "source-map",
    context: path.resolve(__dirname),
    externals: {
        jquery: "$",
        leaflet: "L"
    },
    plugins: [
        new webpack.NamedModulesPlugin(),
        new UglifyJSPlugin({
            sourceMap: true,
        }),
    ],
};
