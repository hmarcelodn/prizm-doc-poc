/* global module, require, $, PCCViewer */

// require CSS code and HTML template
require('./notification.less');
var template = require('./notification.html');

function attachEvents(viewer, funcs) {
    viewer.eventStore.on('Notify', funcs.onNotify);
}

function detachEvents(viewer, funcs) {
    viewer.eventStore.off('Notify', funcs.onNotify);
}

/**
 * @module notification
 * @description Displays a notification.
 * @listens {@link module:event-store#event:Notify}
 * @example
 * var Notification = require('notification.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myNotification = Notification(this, {
 *         elem: document.getElementById('myNotification')
 *     });
 * }
 */
function Notification(viewer, options) {
    var $elem = $(options.elem), nodes = {};
    $elem.html(template({ data: { language: PCCViewer.Language.data } }));

    nodes.$notification = $elem.find('[data-pcc-notification]');
    nodes.$closeButton = $elem.find('[data-pcc-close]');
    
    nodes.$closeButton.on('click', function() {
        nodes.$notification.removeClass('pcc-open');
    });

    function onNotify(ev, data) {
        if (data.type === 'error') {
            nodes.$notification.addClass('pcc-error');
        }
        else {
            nodes.$notification.removeClass('pcc-error');
        }

        nodes.$notification.addClass('pcc-open').find('p').text(data.message);
    }
    
    var funcs = {
        onNotify: onNotify
    };
    
    /**
     * @function module:notification#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents(viewer, funcs, $elem);
        $elem.empty();
    };
    
    attachEvents(viewer, funcs);    
}

/**
 * Creates the notification UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewerObj, options) {
    return new Notification(viewerObj, options);
};
