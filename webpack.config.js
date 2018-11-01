const path = require("path");

module.exports = {
    entry: "./src/app.js",
    watch: true,
    devtool: "inline-source-map",
    mode: "production",
    performance: {
        hints: false
    },
    devServer: {
        contentBase: path.join(__dirname, "."),
        compress: true,
        port: 9000
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js"
    }
};