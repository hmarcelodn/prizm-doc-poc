/* global module, require, $, _, PCCViewer */

// require CSS code and HTML template
require('./multiple-selection.less');
var template = require('./multiple-selection.html');

function attachEvents(viewer, funcs) {
    viewer.eventStore.on('ModifyTemplateField', funcs.onOneOrNoFieldsSelected);
    viewer.eventStore.on('DeselectAllTemplateFields', funcs.onOneOrNoFieldsSelected);
    viewer.eventStore.on('ModifyMultipleTemplateFields', funcs.onMultipleFieldsSelected);
}

function detachEvents(viewer, funcs) {
    funcs.detachTemplateBehavior();

    viewer.eventStore.off('ModifyTemplateField', funcs.onOneOrNoFieldsSelected);
    viewer.eventStore.off('DeselectAllTemplateFields', funcs.onOneOrNoFieldsSelected);
    viewer.eventStore.off('ModifyMultipleTemplateFields', funcs.onMultipleFieldsSelected);
}

/**
 * @module multiple-selection
 * @description Provides UI showing bulk actions to be completed on a selection of more than one field.
 * @fires {@link module:event-store#event:AlignFields}
 * @fires {@link module:event-store#event:DeleteFields}
 * @fires {@link module:event-store#event:DuplicateFields}
 * @fires {@link module:event-store#event:MatchSizeFields}
 * @listens {@link module:event-store#event:ModifyTemplateField}
 * @listens {@link module:event-store#event:DeselectAllTemplateFields}
 * @listens {@link module:event-store#event:ModifyMultipleTemplateFields}
 * @example
 * var MultipleSelection = require('multiple-selection.js');
 *
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myMultipleSelection = MultipleSelection(this, {
 *         elem: document.getElementById('myMultipleSelection')
 *     });
 * }
 */
function MultipleSelection(viewer, options) {

    // init the module
    // in this module, the $elem is the template content, not the parent
    var $elem = $('<div class="pcc-multipleselection-container"></div>').appendTo(options.elem),
        components = {},
        markIds = [];

    var funcs = {
        getUniqueId: function getUniqueId(list, prefix) {
            var max = 0;

            if (list.length) {

                // Remove the prefix from the list of ids
                var ids = _.map(list, function(item) {
                    return Number(item.replace(prefix, ''));
                });

                // Find the max value in the group
                max = _.max(ids);
            }

            // Append the max value + 1 as the ID
            return prefix + (max + 1);
        },
        getComponentValue: function getComponentValue(component, componentValue) {

            if (component) {
                if (componentValue === undefined) {
                    componentValue = component.value();
                }
                
                if (componentValue.constructor === Array) {
                    componentValue = !!componentValue.length;
                }
                else if (typeof componentValue === 'string') {
                    componentValue = $.trim(componentValue);   
                }
            }

            return componentValue;
        },
        updateFieldState: function updateFieldState(propertyName, component, state, componentValue) {

            if (component) {
                componentValue = funcs.getComponentValue(component, componentValue);

                _.each(markIds, function(markId) {
                    state.fieldList[markId] = state.fieldList[markId] ? state.fieldList[markId] : {};
                    state.fieldList[markId][propertyName] = componentValue;
                });
            }

            return state;
        },
        updateFieldProperty: function updateFieldProperty(propertyName, component, componentValue) {

            if (component) {
                var state = funcs.updateFieldState(propertyName, component, {fieldList: {}}, componentValue);

                viewer.eventStore.trigger('ModifyState', {
                    state: 'FieldList',
                    stateValue: state
                });
            }
        },
        updateGroupState: function updateGroupState(propertyName, component, state, componentValue) {

            if (component) {
                componentValue = funcs.getComponentValue(component, componentValue);

                _.each(markIds, function(markId) {
                    var field = state.fieldList[markId.toString()];

                    if (field.groupId && field.groupId !== 'none') {
                        state.groups[field.groupId] = state.groups[field.groupId] ? state.groups[field.groupId] : {};
                        state.groups[field.groupId][propertyName] = componentValue;
                    } else {
                        field = field ? field : {};
                        field[propertyName] = componentValue;
                    }
                });
            }

            return state;
        },
        updateGroupProperty: function updateGroupProperty(propertyName, component, componentValue) {

            if (component) {
                var state = funcs.updateGroupState(propertyName, component, viewer.stateStore.getState('FieldList'), componentValue);

                viewer.eventStore.trigger('ModifyState', {
                    state: 'FieldList',
                    stateValue: state
                });
            }
        },
        canAlignSelection: function canAlignSelection() {
            var fieldList = viewer.stateStore.getState('FieldList').fieldList,
                lastPage, markPage;

            _.each(markIds, function(markId) {
                markPage = fieldList[markId].pageNumber;

                if (lastPage && markPage !== lastPage) {
                    return false;
                }

                lastPage = markPage;
            });

            return true;
        },
        attachTemplateBehavior: function attachTemplateBehavior() {

            components.multipleRequired.on('change', function(ev){
                funcs.updateGroupProperty('required', components.multipleRequired);
            });

            if (components.formRole) {
                components.formRole.on('change', function(ev){
                    funcs.updateGroupProperty('formRoleId', components.formRole);
                });
            }

            if (components.group) {
                components.group.on('change', function() {
                    var value = funcs.getComponentValue(components.group);

                    switch (value) {
                        case 'new':
                            if (components.newGroup) {
                                components.newGroup.parent().show();
                            }
                            if (components.multipleSelections) {
                                components.multipleSelections.pccElements.hide();
                            }
                            break;
                        case 'none':
                            funcs.updateFieldProperty('groupId', components.group, '');
                            funcs.drawTemplate();
                            break;
                        default:
                            funcs.updateFieldProperty('groupId', components.group, value);
                            funcs.drawTemplate();
                            break;
                    }
                });
            }

            if (components.newGroup) {
                components.newGroup.on('submit', function() {
                    var groups = viewer.stateStore.getState('FieldList').groups || {},
                        value = funcs.getComponentValue(components.newGroup),
                        fieldGroup = _.findWhere(groups, { displayName: value }),
                        groupId;

                    if (fieldGroup) {
                        groupId = fieldGroup.groupId;
                    } else {
                        groupId = funcs.getUniqueId(_.pluck(groups, 'groupId'), 'group');

                        groups[groupId] = {
                            groupId: groupId,
                            displayName: value,
                            type: 'checkbox',
                            data: {
                                multiple: false
                            }
                        };

                        viewer.eventStore.trigger('ModifyState', {
                            state: 'FieldList',
                            stateValue: {
                                groups: groups
                            }
                        });
                    }

                    funcs.updateFieldProperty('groupId', components.group, groupId);

                    funcs.drawTemplate();
                });

                $('.pcc-new-group').hide()
                    .find('[data-pcc-new-group-submit]').on('click', function() {
                        components.newGroup.trigger('submit');
                    });
            }

            if (components.multipleSelections) {
                components.multipleSelections.on('change', function() {
                    var groups = viewer.stateStore.getState('FieldList').groups || {},
                        groupId = funcs.getComponentValue(components.group);

                    groups[groupId].data.multiple = funcs.getComponentValue(components.multipleSelections);

                    viewer.eventStore.trigger('ModifyState', {
                        state: 'FieldList',
                        stateValue: {
                            groups: groups
                        }
                    });
                });

                if (funcs.getComponentValue(components.group) === 'new' || funcs.getComponentValue(components.group) === 'none') {
                    components.multipleSelections.pccElements.hide();
                }
            }
        },
        detachTemplateBehavior: function detachTemplateBehavior() {

            _.each(components, function(component) {
                component.destroy();
            });

            components = {};

            $elem.removeClass('pcc-open').off().empty();
        },
        drawTemplate: function drawTemplate() {

            funcs.detachTemplateBehavior();

            var fieldList = viewer.stateStore.getState('FieldList'),
                allRequired = true,
                allCheckboxes = true,
                selectedFields, groups, roles;

            // Get the fields that are currently selected
            selectedFields = _.filter(fieldList.fieldList, function(field) {
                return _.contains(markIds, Number(field.markId));
            });

            // Determine if all selected fields are like-minded
            _.each(selectedFields, function(field) {

                if ((field.groupId && !fieldList.groups[field.groupId].required) ||
                    (!field.groupId && !field.required)) {
                    allRequired = false;
                }

                if (field.template !== 'CheckboxTemplate') {
                    allCheckboxes = false;
                }
            });

            var selectedGroup = _.chain(selectedFields).pluck('groupId').unique().value();

            if (allCheckboxes) {
                groups = {
                    list: fieldList.groups,
                    selected: selectedGroup.length === 1 && selectedGroup[0] ? selectedGroup[0] : 'none'
                };
            }

            // Translate the roles object into an array
            roles = _.toArray(fieldList.formRoles);

            // Sort the roles in order of sortIndex
            roles.sort(function(a, b) {
                var aSort = a.sortIndex,
                    bSort = b.sortIndex;

                return aSort < bSort ? -1 : aSort > bSort ? 1 : 0;
            });

            var selectedRole = _.chain(selectedFields).pluck('formRoleId').unique().value();

            $elem.html(template({
                    language: PCCViewer.Language.data,
                    groups: groups,
                    formRoles: {
                        list: roles,
                        selected: selectedRole.length === 1 ? selectedRole[0] : ''
                    }
                })).addClass('pcc-open')
                .on('click', '[data-pcc-back]', funcs.onBackClick)
                .on('click', '[data-pcc-duplicate]', funcs.onDuplicateClick)
                .on('click', '[data-pcc-delete]', funcs.onDeleteClick)
                .on('click', '[data-pcc-align]', funcs.onAlignClick)
                .on('click', '[data-pcc-match-size]', funcs.onMatchSizeClick);

            // Init parts of the template
            viewer.parseIcons($elem);
            components = viewer.parseComponents($elem);

            if (allRequired) {
                components.multipleRequired.value('required');
            }

            if (components.multipleSelections &&
                fieldList.groups &&
                selectedGroup.length &&
                fieldList.groups[selectedGroup[0]] &&
                fieldList.groups[selectedGroup[0]].data.multiple) {
                components.multipleSelections.value(true);
            }

            funcs.attachTemplateBehavior();

            if (funcs.canAlignSelection()) {
                $elem.find('.pcc-alignment-disabled').hide();
                $elem.find('[data-pcc-align]').attr('disabled', false);
            } else {
                $elem.find('.pcc-alignment-disabled').show();
                $elem.find('[data-pcc-align]').attr('disabled', true);
            }
        },
        onMultipleFieldsSelected: function onMultipleFieldsSelected(ev, data) {

            markIds = data.markIds;

            funcs.drawTemplate();
        },
        onOneOrNoFieldsSelected: function onOneOrNoFieldsSelected(ev) {
            funcs.detachTemplateBehavior();
        },
        onBackClick: function onBackClick(ev) {
            funcs.detachTemplateBehavior();
        },
        onDuplicateClick: function onDuplicateClick(ev) {

            viewer.eventStore.trigger('DuplicateFields', {
                markIds: markIds
            });

            // Dismiss the UI.
            funcs.detachTemplateBehavior();
        },
        onDeleteClick: function onDeleteClick(ev) {

            viewer.eventStore.trigger('DeleteFields', {
                markIds: markIds
            });

            // Dismiss the UI.
            funcs.detachTemplateBehavior();
        },
        onAlignClick: function onAlignClick(ev) {

            if (!markIds.length || !funcs.canAlignSelection()) {
                return;
            }

            viewer.eventStore.trigger('AlignFields', {
                markIds: markIds,
                alignment: $(this).data('pcc-align')
            });
        },
        onMatchSizeClick: function (ev) {

            viewer.eventStore.trigger('MatchSizeFields', {
                markIds: markIds,
                direction: $(this).data('pcc-match-size')
            });
        }
    };

    /**
     * @function module:multiple-selection#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents(viewer, funcs);

        $elem.remove();
    };

    // Init the module
    attachEvents(viewer, funcs);
}

/**
 * Creates the multiple selection UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new MultipleSelection(viewer, options);
};
