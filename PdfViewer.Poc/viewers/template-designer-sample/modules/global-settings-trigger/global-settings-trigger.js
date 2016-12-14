/* global module, require, $ */

require('./global-settings-trigger.less');

var template = require('./global-settings-trigger.html');

/**
 * @module global-settings-trigger
 * @description triggers .
 * @example
 * var GlobalSettingsTrigger = require('global-settings-trigger.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myGlobalSettings = GlobalSettingsTrigger(this, {
 *         elem: document.getElementById('myGlobalSettings')
 *     });
 * }
 */
function GlobalSettingsTrigger(viewer, options) {
    var $elem,
        nodes = {};

    function initModule() {
        nodes.$globalSettingsButton = $elem.find('[data-pcc-global-settings-trigger]');
    }

    function onGlobalSettingsButtonClicked(ev) {
        viewer.eventStore.trigger('AccessGlobalSettings');
    }

    function attachEvents() {
        nodes.$globalSettingsButton.on('click', onGlobalSettingsButtonClicked);
    }

    function detachEvents() {
        nodes.$globalSettingsButton.off();
    }

    /**
     * @function module:global-settings-trigger#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents();
        $elem.empty();
    };
    
    // initialize the module
    $elem = $(options.elem);
    
    $elem.html(template());
    viewer.parseIcons($elem);
    
    initModule();
    attachEvents();
}

/**
 * Creates the global settings trigger UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options abject.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewerObj, options) {
    return new GlobalSettingsTrigger(viewerObj, options);
};
