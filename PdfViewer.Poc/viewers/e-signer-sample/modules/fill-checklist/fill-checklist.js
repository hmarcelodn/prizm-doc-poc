/* global require, module, _, $, PCCViewer */

// require the CSS code and the HTML template
require('./fill-checklist.less');
var template = require('./fill-checklist.html');

function attachEvents(viewer, funcs, $elem) {
    viewer.eventStore.on('StateModified', funcs.onStateModified);

    $elem.on('click', '[data-pcc-field]', funcs.onChecklistItemClick);
}

function detachEvents(viewer, funcs, $elem) {
    viewer.eventStore.off('StateModified', funcs.onStateModified);
    $elem.off();
}

/**
 * @module fill-checklist
 * @description Displays a list of fields to be completed in the form. As
 * fields are completed, the icon in the checklist item will be updated to
 * reflect the completed state.
 * @fires {@link module:event-store#event:ToggleChecklist}
 * @fires {@link module:event-store#event:FocusChecklistItem}
 * @listens {@link module:event-store#event:StateModified}
 * @example
 * var FillChecklist = require('fill-checklist.js');
 *
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myFillChecklist = FillChecklist(this, {
 *         elem: document.getElementById('myChecklist')
 *     });
 * }
 */
function FillChecklist(viewer, options) {

    // in this module, the $elem is the template content, not the parent
    var lastActiveFieldMarkId,
        $elem = $('<div class="pcc-checklist-container"></div>')
        .html(template({ data: { language: PCCViewer.Language.data } }))
        .appendTo(options.elem);

    // Fire an event when a checklist item is selected and record the item
    // selected. Finally redraw the checklist so that the selected item
    // is highlighted.
    function onChecklistItemClick(ev) {
        var summary = viewer.stateStore.getState('FormSummary'),
            itemId = $(this).data('pccItemId'),
            markId = itemId;

        if (summary.list[itemId] && summary.list[itemId].fields) {
            markId = _.findWhere(summary.list[itemId].fields, { sortIndex: summary.list[itemId].sortIndex }).markId;
        }

        viewer.eventStore.trigger('FocusChecklistItem', {
            markId: markId
        });

        lastActiveFieldMarkId = markId;
        drawList(summary.list);

        // On mobile, after clicking on a field to focus, the checklist should hide
        if (viewer.breakpoint.latest() === viewer.breakpoint.values.mobile) {
            viewer.eventStore.trigger('ToggleChecklist');
        }
    }

    function onStateModified(ev, data) {

        switch (data.state) {
            case 'FormSummary':
                formSummaryModified(data);
                break;
            case 'FocusField':
                focusFieldModified(data);
                break;
        }
    }

    // When a field is modified, update the checklist to show a possible change
    // in the completion state of the field.
    function formSummaryModified(data) {
        drawList(data.stateValue.list);
    }

    // When a field becomes newly focused in the form, redraw the checklist so
    // that the corresponding checklist item will be highlighted.
    function focusFieldModified(data) {
        lastActiveFieldMarkId = data.stateValue.lastActiveFieldMarkId;
        drawList(viewer.stateStore.getState('FormSummary').list);
    }

    // This method handles the display functionality of the checklist.
    function drawList(items) {
        var summary = viewer.stateStore.getState('FormSummary') || {},
            displayFields = _.sortBy(items, 'sortIndex'),
            lastActiveItemId;

        // save scroll position in the list
        var currentScroll = $elem.get(0).scrollTop;

        // Get the active item ID if it is in a group
        if (summary.list[lastActiveFieldMarkId]) {
            lastActiveItemId = lastActiveFieldMarkId;
        } else {
            var item = _.find(summary.list, function(listItem) {
                return listItem.fields && listItem.fields[lastActiveFieldMarkId];
            });
            lastActiveItemId = item && item.markId ? item.markId : item && item.groupId ? item.groupId : 0;
        }

        // re-render the list
        $elem.html(template({
            data: {
                items: displayFields,
                language: PCCViewer.Language.data,
                lastActiveItemId: lastActiveItemId
            },
            getIcon: function(field) {

                var icon;

                if (field.isInvalid) {
                    icon = 'pcc-icon-warning';
                } else if (field.isComplete) {
                    icon = 'pcc-icon-circle-check';
                } else if (field.required) {
                    icon = 'pcc-icon-circle-star';
                } else {
                    icon = 'pcc-icon-empty-circle';
                }

                return icon;
            }
        }));

        viewer.parseIcons($elem);

        // match previous scroll position
        $elem.get(0).scrollTop = currentScroll;
    }

    var funcs = {
        onStateModified: onStateModified,
        onChecklistItemClick: onChecklistItemClick
    };

    /**
     * @function module:fill-checklist#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents(viewer, funcs, $elem);
        $elem.remove();
    };

    attachEvents(viewer, funcs, $elem);
}

/**
 * Creates the checklist UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewerObj, options) {
    return new FillChecklist(viewerObj, options);
};
