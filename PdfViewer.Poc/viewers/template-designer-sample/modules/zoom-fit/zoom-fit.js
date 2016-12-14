/* global module, require, $, PCCViewer */

// require the CSS code and the HTML template
require('./zoom-fit.less');
var template = require('./zoom-fit.html');

/**
 * @module zoom-fit
 * @description Zooms and fits the document. This module will allow
 * the user to zoom in and out, set a specific scale factor, or 
 * set a page fit mode that will be maintained when the browser
 * window is resized.
 * @example
 * var ZoomFit = require('zoom-fit.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myZoomFit = ZoomFit(this, {
 *         elem: document.getElementById('myZoomFit')
 *     });
 * }
 */
function ZoomFit(viewer, options) {
    var $elem,
        nodes = {},
        currentFitType,
        windowResizeFunc;

    function initModule() {
        nodes.$zoomIn = $elem.find('[data-pcc-zoom-in]');
        nodes.$zoomOut = $elem.find('[data-pcc-zoom-out]');
        nodes.$display = $elem.find('[data-pcc-zoom-percent]');
        nodes.$menu = $elem.find('[data-pcc-scale-menu]');
    }

    function onViewerReady(ev) {
        // display the initial scale factor
        nodes.$display.html(parseInt(viewer.viewerControl.getScaleFactor() * 100, 10) + '%');
    }
    
    function onScaleChange(ev) {
        // display the updated scale factor
        nodes.$display.html(parseInt(ev.scaleFactor * 100, 10) + '%');
        
        if (ev.fitType) {
            currentFitType = ev.fitType;
        }
        
        if (viewer.viewerControl.getAtMaxScale()) {
            nodes.$zoomIn.attr('disabled', 'disabled');
        } else {
            nodes.$zoomIn.removeAttr('disabled');
        }
        
        if (viewer.viewerControl.getAtMinScale()) {
            nodes.$zoomOut.attr('disabled', 'disabed');
        } else {
            nodes.$zoomOut.removeAttr('disabled');
        }
    }

    function onScaleClick(ev) {
        nodes.$menu.removeClass('pcc-show');
        var data = $(ev.target).data();
        
        if (data.pccScale) {
            var scale = Number(data.pccScale) / 100;
            viewer.viewerControl.setScaleFactor(scale);
        } else if (data.pccFit) {
            viewer.viewerControl.fitContent(data.pccFit);
        }
    }
    
    function attachEvents() { 
        nodes.$zoomIn.on('click', function(){
            viewer.viewerControl.zoomIn('1.25');
        });
        nodes.$zoomOut.on('click', function(){
             viewer.viewerControl.zoomOut('1.25');
        });
        nodes.$display.on('click', function(){
            nodes.$menu.toggleClass('pcc-show');
        });
        nodes.$menu.on('click', 'li', onScaleClick);

        viewer.viewerControl.on(PCCViewer.EventType.ScaleChanged, onScaleChange);
        
        // add a function that will init when the ViewerControl is ready
        viewer.onReady.add(onViewerReady);
        
        windowResizeFunc = viewer.onResize.add(function() {
            if (currentFitType) {
                viewer.viewerControl.fitContent(currentFitType);
            }
        });
    }

    function detachEvents() {
        nodes.$zoomIn.off();
        nodes.$zoomOut.off();
        nodes.$display.off();
        nodes.$menu.off();

        viewer.viewerControl.off(PCCViewer.EventType.ScaleChanged, onScaleChange);
        
        viewer.onResize.remove(windowResizeFunc);
    }

    /**
     * @function module:zoom-fit#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents();
        $elem.empty();
    };
    
    $elem = $(options.elem);
    
    $elem.html(template({
        data: {
            language: PCCViewer.Language.data
        }
    }));
    viewer.parseIcons($elem);
    
    initModule();
    attachEvents();
}

/**
 * Creates the zoom and fit module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new ZoomFit(viewer, options);
};
