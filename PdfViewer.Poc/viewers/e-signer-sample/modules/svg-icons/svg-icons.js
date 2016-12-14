/* global module, require, $ */

// include Less that defined icon sizes
require('./svg-icons.less');

var $svgElem;

var svgCapable = (function(){
    // tests whether the browser is capable of processing SVGs
    // this will execute only once and be available as a boolean to the module
    return !!('createElementNS' in document && document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect);
})();

function destroy() {
    $svgElem.remove();
}

/**
 * @member module:svg-icons~moduleApi
 * @property {function} destroy Destroys the module.
 */
var returnObject = {
    destroy: destroy
};

function init() {
    // If SVG is not supported in the browser, skip this insert
    if (!svgCapable) { return returnObject; }
    
    // perform a save init
    // try to find if the icons already exist
    // if they already exist, return and do nothing
    if ($('#pcc-icon-sprite').length) { return returnObject; }
    
    var file = require('./svg-icons.svg');
    
    $(file)
        .attr('id', 'pcc-icon-sprite')
        .css('display', 'none')
        .appendTo(document.body);

    return returnObject;
}

function parseIcons(dom) {
    var $dom = $(dom);
    var $iconParents = $dom.find('[data-pcc-icon]');
    
    var $elem, name;
    
    $iconParents.each(function(i, elem){
        $elem = $(elem);
        name = $elem.data('pccIcon');
        
        if (svgCapable) {
            // use SVG icons
            $elem.empty().append('<svg class="pcc-icon"><use xlink:href="#' + name + '"></use></svg>');
        } else {
            // fallback to PNG sprite
            $elem.empty().append('<span class="pcc-icon ' + name + '"></span>');
        }
    });
}
  
/**
 * @module svg-icons
 * @description This module appends the icons to the document body.
 * If this module is initialized twice, the icons are not appended
 * since they only need to be appended once.
 * @exports {function} init
 * @exports {function} parseIcons
 */
module.exports = {
    /**
     * @method module:svg-icons#init
     * @description
     * Initializes the module. This method will insert the SVG icon sprite into 
     * the body of the page. This sprite can be shared between multiple instances
     * of the viewer embedded on the same page.
     * @returns {module:svg-icons~moduleApi} The module API object.
     */
    init: init,
    /**
     * @method module:svg-icons#parseIcons
     * @description
     * Parses icons. For any HTML template that contains icons, this method
     * must be called with the HTML template passed as the parameter.
     * Note that the init method must be called before calling `parseIcons`.
     * @param {HTMLElement} dom A parent DOM element, or jQuery-wrapped element,
     * that contains the icons that need to be parsed.
     */
    parseIcons: parseIcons
};
