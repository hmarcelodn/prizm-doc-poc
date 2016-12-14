/*global module, require, $, _, PCCViewer*/

// require the CSS code and the HTML template
require('./download-signed-form-trigger.less');
var template = require('./download-signed-form-trigger.html');

function attachEvents(viewer, funcs) {
    viewer.eventStore.on('StateModified', funcs.onStateModified);
}

function detachEvents(viewer, funcs, $elem) {
    viewer.eventStore.off('StateModified', funcs.onStateModified);
    $elem.off();
}

/**
 * @module download-signed-form-trigger
 * @description Triggers the event for downloading a signed form.
 *
 * This UI of this module is a button that the user can click to start burning
 * the fields into the form and then download the burned document. This button
 * will be disabled until the user has filled all of the required fields on the
 * document.
 *
 * @listens {@link module:event-store#event:StateModified} for "FieldList" state.
 *
 * @fires {@link module:event-store#event:StartBurningForm} - This event is fired to indicate that the user wants to begin burning the document and download the burned document.
 *
 * @example
 * var DownloadSignedFormTrigger = require('download-signed-form-trigger.js');
 *
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myDownloadSignedFormTrigger = DownloadSignedFormTrigger(this, {
 *         elem: document.getElementById('myDownloadSignedFormTrigger')
 *     });
 * }
 */
function DownloadSignedFormTrigger(viewer, options) {
    var $elem = $(options.elem);
    $elem.html(template({ data: { language: PCCViewer.Language.data } }));
    viewer.parseIcons($elem);

    var $downloadButton = $elem.find('[data-pcc-download-button]');
    $downloadButton.prop('disabled', true);

    $downloadButton.on('click', function () {
        viewer.eventStore.trigger('BurnForm', {});
    });

    function onStateModified(ev, data) {
        // we only care about a modified mark list
        if (data.state !== 'FormSummary') { return; }

        // Loop through each field to determine the total number of required and optional fields and how many have been completed.
        var totalRequiredFields = 0;
        var completedRequiredFields = 0;
        var invalidFields = 0;
        var fieldList = data.stateValue.list;

        _.forEach(fieldList, function(field){
            if (field.required === true) {
                totalRequiredFields++;
                if (field.isComplete === true) {
                    completedRequiredFields++;
                }
            }
            
            if (field.isInvalid === true) {
                invalidFields++;
            }
        });

        // Enable the download button if all required fields have been completed.
        $downloadButton.prop('disabled', fieldList === undefined || completedRequiredFields !== totalRequiredFields || invalidFields > 0);
    }

    var funcs = {
        onStateModified: onStateModified
    };

    /**
     * @function module:download-signed-form-trigger#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents(viewer, funcs, $elem);
        $elem.empty();
    };

    attachEvents(viewer, funcs);
}

/**
 * Creates the download signed form trigger UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new DownloadSignedFormTrigger(viewer, options);
};
