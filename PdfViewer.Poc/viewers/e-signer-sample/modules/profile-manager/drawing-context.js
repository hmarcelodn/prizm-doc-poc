/* global module, require, $, PCCViewer */

require('./drawing-context.less');
var template = require('./drawing-context.html');

function DrawingContext(elem) {
    var $elem = $(elem).html(template({
        language: PCCViewer.Language.data
    }));
    
    var $contextElem = $elem.find('[data-pcc-draw-context]');
    
    return new PCCViewer.SignatureControl($contextElem.get(0));
}

module.exports = function init(parentElem) {
    return new DrawingContext(parentElem);
};
