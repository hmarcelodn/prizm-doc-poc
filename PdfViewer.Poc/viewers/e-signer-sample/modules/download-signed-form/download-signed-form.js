/* global module, require, $, PCCViewer */

// require the CSS code and the HTML template
require('./download-signed-form.less');
var template = require('./download-signed-form.html');

/**
 * @module download-signed-form
 * @description Manages downloading a signed form.
 *
 * This UI of this module is a modal dialog box that shows
 * the signature burn-in status, allows the user to cancel
 * the burning and download, and allows the user to download the signed form.
 *
 * @listens {@link module:event-store#event:BurnForm} - The download signed form dialog will be displayed when this event is triggered.
 *
 * @listens {@link module:event-store#event:DisplayForm} - Gets the form name from this event.
 *
 * @example
 * var DownloadSignedForm = require('download-signed-form.js');
 *
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myDownloadSignedForm = DownloadSignedForm(this, {
 *         elem: document.getElementById('myDownloadSignedForm')
 *     });
 * }
 */
function DownloadSignedForm(viewer, options) {
    var $elem,
        formName,
        components = {},
        nodes = {},
        burnRequest = null,
        documentDownloadUrl = null;

    function buildTemplate(mode) {
        destroyTemplate();

        $elem.html(template({
            language: PCCViewer.Language.data,
            options: {
                mode: mode
            }
        }));

        initNodes();

        // init parts of the template
        components = viewer.parseComponents(nodes.$container);

        // IE 10 won't animate the loader if the icons are parsed before the dialog is visible
        $elem.addClass('pcc-open');
        viewer.parseIcons($elem);
    }

    function destroyTemplate() {
        $elem.empty().removeClass('pcc-open');
    }

    function burnSignatures() {
        // First, generate a filename for the burned document.
        // This filename will be based on the form name and the
        // current date and time.

        // Replace invalid file name characters with "_".
        var replaceRegExp = /^\.|[\s\\\/\?\*<\>\:\|\"\^]+/g;
        var safeFormName = formName.replace(replaceRegExp, "_");

        // The filename suffix is "-signed-<ISODateString>"
        var filenameSuffix = "-signed-" + getDateString();

        // Limit the filename to 160 characters by clipping the
        // form name. The length of 160 characters was found to
        // be supported by browsers on Windows.
        // A longer filename would be clipped by the browser, but
        // still downloads successfully.
        var formMaxLength =
            160 - // max length of file name
            5 -   // dot + 4 char extension
            filenameSuffix.length;
        safeFormName = safeFormName.substring(0, formMaxLength);

        // Start burning
        burnRequest = viewer.viewerControl.burnMarkup({
            includeSignatures: true,
            includeRedactions: true,
            filename: safeFormName + filenameSuffix
        });

        // Handle events of the burn request.
        burnRequest.on(PCCViewer.BurnRequest.EventType.BurnCompleted, onBurnCompleted);
        burnRequest.on(PCCViewer.BurnRequest.EventType.BurnFailed, onBurnFailed);
    }

    // Clean up an existing burn request.
    // Cancel it if it is still running.
    // Detach events.
    // Set variable to null.
    function destoryBurnRequest() {
        if (burnRequest) {
            burnRequest.cancel();
            burnRequest.off(PCCViewer.BurnRequest.EventType.BurnCompleted, onBurnCompleted);
            burnRequest.off(PCCViewer.BurnRequest.EventType.BurnFailed, onBurnFailed);
            burnRequest = null;
        }
    }

    // Handle burn request completion.
    function onBurnCompleted() {
        if (!burnRequest) { return; }

        if (burnRequest.getErrorCode()) {
            buildTemplate("error");
        } else {
            documentDownloadUrl = burnRequest.getBurnedDocumentDownloadURL();
            buildTemplate("complete");
        }

        destoryBurnRequest();
    }

    // Handle burn failure.
    // Although the documentation for PCCViewer.BurnRequest.EventType.BurnCompleted
    // states that it will fire for failure, it does not fire in the cases I tested.
    // This handler is used to handle the failure when the BurnCompleted event does
    // not fire.
    function onBurnFailed() {
        buildTemplate("error");
        destoryBurnRequest();
    }

    // Show the modal in progress.
    // Start burning.
    function onBurnForm() {
        buildTemplate("pending");
        burnSignatures();
    }

    // This is used to get the form name of the form that is
    // displayed in the viewer.
    function onDisplayForm(ev, data) {
        formName = data.formName;
    }

    function attachEvents() {
        viewer.eventStore.on('BurnForm', onBurnForm);
        viewer.eventStore.on('DisplayForm', onDisplayForm);
    }

    function detachEvents() {
        viewer.eventStore.off('BurnForm', onBurnForm);
        viewer.eventStore.off('DisplayForm', onDisplayForm);
    }

    function initNodes() {
        nodes.$container = $elem.find('[data-pcc-overlay-container]');
        nodes.$close = nodes.$container.find('[data-pcc-download-signed-form-close]');
        nodes.$retry = nodes.$container.find('[data-pcc-download-signed-form-retry]');
        nodes.$save = nodes.$container.find('[data-pcc-download-signed-form-save]');

        nodes.$close.on('click', function() {
            destoryBurnRequest();
            destroyTemplate();
        });

        nodes.$retry.on('click', function() {
            onBurnForm();
        });

        nodes.$save.on('click', function() {
            if (documentDownloadUrl) {
                window.open(documentDownloadUrl);
            }

            destroyTemplate();
        });
    }

    /**
     * @function module:download-signed-form#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        destoryBurnRequest();
        destroyTemplate();
        detachEvents();
        $elem.empty();
    };

    $elem = $(options.elem);

    attachEvents();

    // Generate a date string that can be used as part of the
    // download file name.
    function getDateString() {
        var now = new Date();
        if (now.toISOString) {
            return now.toISOString();
        } else {
            return now.getUTCFullYear() +
                '-' + pad(now.getUTCMonth() + 1) +
                '-' + pad(now.getUTCDate()) +
                'T' + pad(now.getUTCHours()) +
                ':' + pad(now.getUTCMinutes()) +
                ':' + pad(now.getUTCSeconds()) +
                '.' + (now.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
                'Z';
        }
    }

    // A helper method for creating an ISO date string
    function pad(number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    }
}

/**
 * Creates the download signed form module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new DownloadSignedForm(viewer, options);
};
