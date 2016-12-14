/*global module, require, $, _, PCCViewer*/

// require the CSS code and the HTML template
require('./fill-progress.less');
var template = require('./fill-progress.html');

function attachEvents(viewer, funcs) {
    viewer.eventStore.on('StateModified', funcs.onStateModified);
}

function detachEvents(viewer, funcs, $elem) {
    viewer.eventStore.off('StateModified', funcs.onStateModified);
    $elem.off();
}

/**
 * @module fill-progress
 * @description Shows the progress of how many fields have been filled and how many are remaining.
 * If there are required fields, a progress bar indicates the progress of required fields that have been filled.
 * If there are optional fields, text below the progress bar indicates how many optional fields are left.
 * @listens {@link module:event-store#event:StateModified} for "FieldList" state.
 * @example
 * var FillProgress = require('fill-progress.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myFillProgress = FillProgress(this, {
 *         elem: document.getElementById('myFillProgress')
 *     });
 * }
 */
function FillProgress(viewer, options) {
    var $elem = $(options.elem);
    $elem.html(template({ data: { language: PCCViewer.Language.data } }));

    var $progressBar = $elem.find('[data-pcc-percent]');
    var $progressBarFill = $elem.find('[data-pcc-bar]');
    var $optionalLeft = $elem.find('[data-pcc-optional-left]');
    var $noRequired = $elem.find('[data-pcc-no-required]');
    $noRequired.hide().html(PCCViewer.Language.data.noRequiredFields);
    $progressBar.hide();
    $optionalLeft.hide();
    
    function onStateModified(ev, data) {
        // we only care about a modified mark list
        if (data.state !== 'FormSummary') { return; }

        // Loop through each field to determine the total number of required and optional fields and how many have been completed.
        var totalRequiredFields = 0;
        var totalOptionalFields = 0;
        var completedRequiredFields = 0;
        var completedOptionalFields = 0;
        var fieldList = data.stateValue.list;
        
        if (fieldList === undefined) {
            return;   
        }
        
        _.forEach(fieldList, function(field){
            if (field.required === true) {
                totalRequiredFields++;
                if (field.isComplete) {
                    completedRequiredFields++;
                }
            }
            else {
                totalOptionalFields++;
                if (field.isComplete === true) {
                    completedOptionalFields++;
                }
            }
        });

        // Update the progress status text.
        $optionalLeft.html((totalOptionalFields - completedOptionalFields) + ' ' + PCCViewer.Language.data.optionalFieldsLeft);
        
        if (totalOptionalFields === 0) {
            $optionalLeft.hide();   
        }
        else {
            $optionalLeft.show();   
        }
        
        if (totalRequiredFields === 0) {
            // Do not show the progress bar if there are no required fields.
            $progressBar.hide();
            $noRequired.show();
            return;
        }
        
        // Update the progress bar.
        $noRequired.hide();
        $progressBar.show();
        $progressBar.prop('title', (totalRequiredFields - completedRequiredFields) + ' ' + PCCViewer.Language.data.requiredFieldsLeft);
        var progress = completedRequiredFields / totalRequiredFields * 100;
        $progressBarFill.css('width', progress + '%');
        if (progress === 100) {
            $progressBarFill.addClass('pcc-complete');   
        }
        else {
            $progressBarFill.removeClass('pcc-complete');   
        }
    }
    
    var funcs = {
        onStateModified: onStateModified
    };
    
    /**
     * @function module:fill-progress#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents(viewer, funcs, $elem);
        $elem.empty();
    };
    
    attachEvents(viewer, funcs);    
}

/**
 * Creates the fill progress UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new FillProgress(viewer, options);
};
