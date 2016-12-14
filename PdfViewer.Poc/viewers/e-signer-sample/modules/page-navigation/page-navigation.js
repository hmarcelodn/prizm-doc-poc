/* global module, require, $, PCCViewer */

require('./page-navigation.less');

var template = require('./page-navigation.html');

/**
 * @module page-navigation
 * @description Navigates pages.
 * @example
 * var PageNavigation = require('page-navigation.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myPageNav = PageNavigation(this, {
 *         elem: document.getElementById('myPageNav')
 *     });
 * }
 */
function PageNavigation(viewer, options) {
    var $elem,
        nodes = {};

    function initModule() {
        nodes.$first = $elem.find('[data-pcc-pagenav-first]');
        nodes.$prev = $elem.find('[data-pcc-pagenav-prev]');
        nodes.$next = $elem.find('[data-pcc-pagenav-next]');
        nodes.$last = $elem.find('[data-pcc-pagenav-last]');
        nodes.$number = $elem.find('[data-pcc-pagenav-number]');
    }

    function onPageChange(ev) {
        nodes.$number.html(ev.pageNumber);
    }

    function attachEvents() {
        nodes.$first.on('click', function(){
            viewer.viewerControl.changeToFirstPage();
        });
        nodes.$prev.on('click', function(){
            viewer.viewerControl.changeToPrevPage();
        });
        nodes.$next.on('click', function(){
            viewer.viewerControl.changeToNextPage();
        });
        nodes.$last.on('click', function(){
            viewer.viewerControl.changeToLastPage();
        });

        viewer.viewerControl.on(PCCViewer.EventType.PageChanged, onPageChange);
    }

    function detachEvents() {
        nodes.$first.off();
        nodes.$prev.off();
        nodes.$next.off();
        nodes.$last.off();

        viewer.viewerControl.off(PCCViewer.EventType.PageChanged, onPageChange);
    }

    /**
     * @function module:page-navigation#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents();
        $elem.empty();
    };
    
    // initialize the module
    $elem = $(options.elem);
    
    $elem.html(template({
            language: PCCViewer.Language.data
        }));
    viewer.parseIcons($elem);
    
    initModule();
    attachEvents();
}

/**
 * Creates the page navigation UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewerObj, options) {
    return new PageNavigation(viewerObj, options);
};
