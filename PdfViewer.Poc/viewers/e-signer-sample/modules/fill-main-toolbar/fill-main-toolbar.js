/* global module, require, $, _, PCCViewer */

// require the CSS code and the HTML template
require('./fill-main-toolbar.less');
var template = require('./fill-main-toolbar.html');

/**
 * @module fill-main-toolbar
 * @description Manages the form's main toolbar.
 * @fires {@link module:event-store#event:ModifyState}
 * @listens {@link module:event-store#FormLoaded}
 * @listens {@link module:event-store#ToggleChecklist}
 * @example
 * var FillMainToolbar = require('fill-main-toolbar.js');
 *
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myFillMainToolbar = FillMainToolbar(this, {
 *         elem: document.getElementById('myFillMainToolbar')
 *     });
 * }
 */
function FillMainToolbar(viewer, options) {
    var $elem,
        components = {};

    // init the module
    function initModule() {
        $elem = $(options.elem);
        $elem.html(template(PCCViewer.Language.data));
        components = viewer.parseComponents($elem);
        viewer.parseIcons($elem);
    }

    // When the viewer is ready, set the initial states of the toolbar and its
    // items.
    function onViewerReady(ev) {
        viewer.eventStore.trigger('ModifyState', {
            state: 'ChecklistButton',
            stateValue: {
                active: false
            }
        });
    }

    // When the checklist panel visibility changes, trigger a notifying event.
    function onTriggerChange(ev, data) {
        viewer.eventStore.trigger('ModifyState', {
            state: 'ChecklistVisibility',
            stateValue: !!data.value
        });
    }
    
    // When the form loads, open the checklist on devices that are large enough
    function onFormLoaded() {
        if (components.checklistTrigger && viewer.breakpoint.latest() !== viewer.breakpoint.values.mobile) {
            components.checklistTrigger.value(true);
        }
    }

    function onToggleChecklist(ev, data) {
        var currentValue = components.checklistTrigger.value();

        components.checklistTrigger.value(!currentValue);
    }

    function attachEvents() {
        viewer.onReady.add(onViewerReady);
        viewer.eventStore.on('FormLoaded', onFormLoaded);
        viewer.eventStore.on('ToggleChecklist', onToggleChecklist);
        components.checklistTrigger.on('change', onTriggerChange);
    }

    function detachEvents() {
        viewer.eventStore.off('FormLoaded', onFormLoaded);
        viewer.eventStore.off('ToggleChecklist', onToggleChecklist);
        $elem.off();
        components.checklistTrigger.off();
    }

    function destroy() {
        detachEvents();

        _.forEach(components, function(comp, name){
            comp.off();
            comp.destroy();
        });
        components = {};

        $elem.empty();
    }

    /**
     * @function module:fill-main-toolbar#destroy
     * @description Destroys the module.
     */
    this.destroy = destroy;

    initModule();
    attachEvents();
}

/**
 * Creates the main toolbar module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new FillMainToolbar(viewer, options);
};
