/* global module, require, $ */

// require the CSS code and the HTML template
require('./template-name-header.less');
var template = require('./template-name-header.html');

/**
 * @module template-name-header
 * @description dfgsdf
 * Provides the ability to display the currently loaded template name as a header.
 * @listens {@link module:event-store#event:DisplayForm}
 * @example
 * var TemplateNameHeader = require('template-name-header.js');
 * 
 * // a generic Viewer constructor
 *  var myTemplateNameHeader = TemplateNameHeader(this, {
 *      elem: document.getElementById('myTemplateHeader')
 *  });
 */
function TemplateNameHeader(viewer, options) {
    var $elem,
        nodes = {};

    function onDisplayForm(ev, data) {
        nodes.$formName.html(data.formName);
    }

    function attachEvents() {
        viewer.eventStore.on('DisplayForm', onDisplayForm);
    }

    function detachEvents() {
        viewer.eventStore.off('DisplayForm', onDisplayForm);
    }

    function initModule() {
        nodes.$formName = $elem.find('[data-pcc-form-name]');
    }

    /**
     * @function module:template-name-header#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        $elem.empty();
        detachEvents();
    };
    
    $elem = $(options.elem);
    
    $elem.prepend(template());
    viewer.parseIcons($elem);

    initModule();
    attachEvents();
}

/**
 * Created the template name header module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options abject.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new TemplateNameHeader(viewer, options);
};
