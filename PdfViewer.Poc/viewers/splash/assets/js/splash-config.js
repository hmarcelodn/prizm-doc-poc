(function(exports) {
    function fromBasePath(path) {
        var pathName = location.pathname;
        if (pathName[pathName.length - 1] !== '/') {
            pathName += '/';
        }
        if (path[0] === '/') {
            path = path.substring(1);
        }
        return pathName + path;
    }

    exports.splashConfig = {
        webTier: fromBasePath('pcc'),
        upload: fromBasePath('Upload'),
        viewers: {
            full: fromBasePath('fullviewer'),
            bookReader: fromBasePath('bookreader')
        }
    };
})(window);