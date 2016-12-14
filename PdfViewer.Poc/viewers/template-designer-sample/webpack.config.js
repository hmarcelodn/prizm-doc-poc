/* jshint node: true */

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var webpack = require('webpack');

module.exports = {
    entry: './modules/core/core.js',
    output: {
        path: './viewer-assets',
        publicPath: '../',
        filename: 'js/bundle.js',
        sourceMapFilename: '[file].map'
    },
    externals: {
        'jquery': 'jQuery'
    },
    module: {
        loaders: [
            { test: /\.html$/, loader: 'underscore-template-loader' },
            { test: /\.less$/, loader: ExtractTextPlugin.extract('style-loader', 'css-raw-loader!less-loader') },
            { test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-raw-loader') },
            // fonts used in CSS should not be inlined
            { test: /\.pcc\.(woff|eot|svg|ttf)$/, loader: 'file-loader?name=fonts/[name].[ext]' },
            // load SVG file as an XML string
            { test: /\.svg$/, loader: 'html-loader' },
            // PNG fallbacks should not be inlined, so modern browsers do not have to
            // download the PNG sprite
            { test: /\.png$/, loader: 'file-loader?name=img/[name].[ext]' }
        ]
    },
    plugins: [
        new ExtractTextPlugin('css/bundle.css'),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        })
    ]
};
