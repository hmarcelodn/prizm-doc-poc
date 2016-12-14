/* global module, require, $, PCCViewer */

// require the CSS code and the HTML template
require('./template-manager.less');
var template = require('./template-manager.html');

/**
 * @module template-manager
 * @description Provides a UI to name and save templates.
 * 
 * @fires {@link module:event-store#event:ModifyState}
 * @fires {@link module:event-store#event:SaveTemplate}
 * @fires {@link module:event-store#event:Notify}
 * 
 * @listens {@link module:event-store#event:FormLoaded}
 * @listens {@link module:event-store#event:FormCopied}
 * @listens {@link module:event-store#event:TemplateSaved}
 * @listens {@link module:event-store#event:TemplateSaveFailed}
 * 
 * @example
 * var TemplateManager = require('template-manager.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myTemplateManager = TemplateManager(this, {
 *         elem: document.getElementById('myTemplateManager')
 *     });
 * }
 */
function TemplateManager(viewer, options) {
    var $elem,
        components = {},
        nodes = {},
        saveFeedbackTimeout;

    function onNameChange(ev) {
        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                formName: components.templateName.value()
            }
        });
    }
    
    function enableSaving(enabled) {
        nodes.$saveButton.prop('disabled', enabled === false);
        if (enabled === false) {
            nodes.$saveCopy.removeClass('pcc-open').blur();
            nodes.$more.addClass('pcc-disabled');
        }
        else {
            nodes.$more.removeClass('pcc-disabled');
        }
    }
    
    function onNameInput(ev) {
        enableSaving(components.templateName.value().length > 0);
    }
    
    function onFormLoaded() {
        var fieldList = viewer.stateStore.getState('FieldList');
        components.templateName.value(fieldList.formName);
        enableSaving(true);
    }
    
    function onTemplateSaved() {
        var fieldList = viewer.stateStore.getState('FieldList');
        components.templateName.value(fieldList.formName);
        enableSaving(true);

        nodes.$loadingIcon.addClass('pcc-hide');
        nodes.$saveIcon.addClass('pcc-hide');
        nodes.$saveLabel.addClass('pcc-hide');
        nodes.$savedIcon.removeClass('pcc-hide');
        nodes.$savedLabel.removeClass('pcc-hide');

        saveFeedbackTimeout = setTimeout(function () {
            saveFeedbackTimeout = undefined;
            nodes.$loadingIcon.addClass('pcc-hide');
            nodes.$savedIcon.addClass('pcc-hide');
            nodes.$savedLabel.addClass('pcc-hide');
            nodes.$saveIcon.removeClass('pcc-hide');
            nodes.$saveLabel.removeClass('pcc-hide');
        }, 2000);
    }

    function onTemplateSaveFailed() {
        nodes.$loadingIcon.addClass('pcc-hide');
        nodes.$savedIcon.addClass('pcc-hide');
        nodes.$savedLabel.addClass('pcc-hide');
        nodes.$saveIcon.removeClass('pcc-hide');
        nodes.$saveLabel.removeClass('pcc-hide');

        // Notify the user that an error occurred when saving.
        viewer.eventStore.trigger('Notify', { type: 'error', message: PCCViewer.Language.data.errorTemplateSaveFailed });
    }

    function onSaveClicked(ev) {
        nodes.$saveIcon.addClass('pcc-hide');
        nodes.$savedIcon.addClass('pcc-hide');
        nodes.$savedLabel.addClass('pcc-hide');
        nodes.$loadingIcon.removeClass('pcc-hide');
        nodes.$saveLabel.removeClass('pcc-hide');
        viewer.eventStore.trigger('SaveTemplate');
    }
    
    function onSaveCopyClicked(ev) {
        viewer.eventStore.trigger('SaveTemplateCopy');
        nodes.$saveCopy.removeClass('pcc-open').blur();
        // return false to prevent a click on the save button
        return false;
    }
    
    function onOverflowClicked(ev) {
        // prevent default, since this is an anchor
        ev.preventDefault();
        
        if(components.templateName.value().length <= 0) {
            return false;   
        }
        
        nodes.$saveCopy.toggleClass('pcc-open');
        
        // return false to prevent a click on the save button
        return false;
    }
    
    function initModule() {
        nodes.$saveButton = $elem.find('[data-pcc-save-template]');
        nodes.$saveButton.prop('disabled', true);
        nodes.$more = $elem.find('[data-pcc-save-more]');
        nodes.$saveCopy = $elem.find('[data-pcc-save-copy]');
        nodes.$saveLabel = $elem.find('[data-pcc-save-label]');
        nodes.$savedLabel = $elem.find('[data-pcc-saved-label]');
        nodes.$saveIcon = $elem.find('[data-pcc-icon="pcc-icon-save"]');
        nodes.$savedIcon = $elem.find('[data-pcc-icon="pcc-icon-check"]');
        nodes.$loadingIcon = $elem.find('[data-pcc-icon="pcc-icon-loading"]');
    }

    function attachEvents() {
        viewer.eventStore.on('FormLoaded', onFormLoaded);
        viewer.eventStore.on('FormCopied', onFormLoaded);
        viewer.eventStore.on('TemplateSaved', onTemplateSaved);
        viewer.eventStore.on('TemplateSaveFailed', onTemplateSaveFailed);
        
        components.templateName.on('change', onNameChange);
        components.templateName.on('input', onNameInput);
        
        nodes.$more.on('click', onOverflowClicked);
        nodes.$saveCopy.on('click', onSaveCopyClicked);
        nodes.$saveButton.on('click', onSaveClicked);
    }

    function detachEvents() {
        viewer.eventStore.off('FormLoaded', onFormLoaded);
        viewer.eventStore.off('FormCopied', onFormLoaded);
        viewer.eventStore.off('TemplateSaved', onTemplateSaved);
        viewer.eventStore.off('TemplateSaveFailed', onTemplateSaveFailed);
        
        components.templateName.off('change', onNameChange);
        components.templateName.off('input', onNameInput);
        
        nodes.$saveButton.off();
        nodes.$more.off();
        nodes.$saveCopy.off();
    }

    /**
     * @function module:template-manager#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        if (saveFeedbackTimeout) {
            clearTimeout(saveFeedbackTimeout);
        }
        
        detachEvents();
        $elem.empty();
        
        nodes = {};
        components = {};
    };
    
    $elem = $(options.elem);
    
    $elem.html(template({
        data: {
            language: PCCViewer.Language.data
        }
    }));
    viewer.parseIcons($elem);
    components = viewer.parseComponents($elem);
    
    initModule();
    attachEvents();
}

/**
 * Creates the template manager module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new TemplateManager(viewer, options);
};
