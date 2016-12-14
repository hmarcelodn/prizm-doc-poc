(function(exports) {
    function fromBasePath(path) {
        var pathFragments = location.pathname.split('/');
        var basePathFragments = [];
        for (var x = 0; x < pathFragments.length; x++) {
            var fragment = pathFragments[x];
            if (fragment.toLowerCase() === 'esign') {
                break;
            }
            basePathFragments.push(fragment);
        }
        var basePath = basePathFragments.join('/');
        if (basePath[basePath.length - 1] !== '/') {
            basePath += '/';
        }
        if (path[0] === '/') {
            path = path.substring(1);
        }
        return basePath + path;
    }

    exports.splashConfig = {
        webTier: fromBasePath('pcc'),
        upload: fromBasePath('Upload'),
        viewers: {
            esign: fromBasePath('esign'),
            esignDesigner: fromBasePath('templatedesigner')
        }
    };
})(window);