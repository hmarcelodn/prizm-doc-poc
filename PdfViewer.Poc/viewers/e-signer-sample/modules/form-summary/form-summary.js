/* global module, _ */

/**
 * @module form-summary
 * @description
 * This module interfaces with the FieldList state to create a new state.
 * The module will merge groups with fields into a central form summary
 * that can be used by other modules to show the status of the form and the
 * fields/groups that it consists of.
 * 
 * @fires {@link module:event-store#event:ModifyState}
 *
 * @listens {@link module:event-store#event:StateModified} for the "FieldList" state.
 *
 * @example
 * var FormSummary = require('form-summary.js');
 *
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myFormSummary = FormSummary(this);
 * }
 */
function FormSummary(viewer) {

    function onStateModified(ev, data) {
        var formSummary = {};

        if (data.state === 'FieldList' && data.stateValue.fieldList) {

            // Grab every field and add some of its properties to the FormSummary. For fields
            // that belong to a group, add them to the appropriate group in this list.
            _.each(data.stateValue.fieldList, function(field) {
                var properties = {
                    sortIndex: field.sortIndex
                };

                // If the field is complete, this item is as well
                if (field.isComplete) {
                    properties.isComplete = field.isComplete;
                }

                // If the field is invalid, this item is as well
                if (field.isInvalid) {
                    properties.isInvalid = field.isInvalid;
                }

                // Grab the group-level properties from this field,
                // then add the bare minimum as a child of the group.
                if (data.stateValue.groups && field.groupId) {

                    // Make sure the group has the lowest sortIndex of its children
                    if (formSummary[field.groupId] && formSummary[field.groupId].sortIndex < field.sortIndex) {
                        properties.sortIndex = formSummary[field.groupId].sortIndex;
                    }

                    var group = formSummary[field.groupId] || data.stateValue.groups[field.groupId];

                    group.fields = group.fields || {};
                    group.fields[field.markId] = {
                        markId: field.markId,
                        displayName: field.displayName || field.fieldId,
                        sortIndex: field.sortIndex
                    };

                    formSummary[field.groupId] = _.extend({}, group, properties);
                }

                // If this is a non-grouped field, just grab some
                // properties that are important to the FormSummary
                else {
                    properties.markId = field.markId;
                    properties.displayName = field.displayName || field.fieldId;
                    properties.required = field.required;

                    formSummary[field.markId] = _.extend({}, properties);
                }
            });

            viewer.eventStore.trigger('ModifyState', {
                state: 'FormSummary',
                stateValue: {
                    list: formSummary
                },
                operation: 'replace'
            });
        }
    }

    function attachEvents() {
        viewer.eventStore.on('StateModified', onStateModified);
    }

    function detachEvents() {
        viewer.eventStore.off('StateModified', onStateModified);
    }

    /**
     * @function module:form-summary#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents();
    };

    attachEvents();
}

/**
 * Creates the form summary module.
 * @param {Core} viewer The core viewer to which the module will attach.
 */
module.exports = function init(viewer) {
    return new FormSummary(viewer);
};
