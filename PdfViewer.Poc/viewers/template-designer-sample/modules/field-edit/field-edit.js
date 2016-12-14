/* global module, require, $, _, PCCViewer */

// require CSS code and HTML template
require('./field-edit.less');
var template = require('./field-edit.html');

function attachEvents(viewer, funcs) {
    viewer.eventStore.on('StateModified', funcs.onStateModified);
    viewer.eventStore.on('ModifyTemplateField', funcs.onTriggerIntent);
    viewer.eventStore.on('ModifyMultipleTemplateFields', funcs.onCloseIntent);
    viewer.eventStore.on('DeselectAllTemplateFields', funcs.onCloseIntent);
}

function detachEvents(viewer, funcs) {
    funcs.onCloseIntent();
    
    viewer.eventStore.off('StateModified', funcs.onStateModified);
    viewer.eventStore.off('ModifyTemplateField', funcs.onTriggerIntent);
    viewer.eventStore.off('ModifyMultipleTemplateFields', funcs.onCloseIntent);
    viewer.eventStore.off('DeselectAllTemplateFields', funcs.onCloseIntent);
}

/**
 * @module field-edit
 * @description Provides UI showing the settings of a form field and allowing the user to edit the form field.
 * @fires {@link module:event-store#event:ModifyState}
 * @fires {@link module:event-store#event:DeleteFields}
 * @fires {@link module:event-store#event:DuplicateFields}
 * @listens {@link module:event-store#event:ModifyTemplateField}
 * @listens {@link module:event-store#event:ModifyMultipleTemplateFields}
 * @listens {@link module:event-store#event:DeselectAllTemplateFields}
 * @example
 * var FieldEdit = require('field-edit.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myFieldEdit = FieldEdit(this, {
 *         elem: document.getElementById('myFieldEdit')
 *     });
 * }
 */
function FieldEdit(viewer, options) {
    
    // init the module
    // in this module, the $elem is the template content, not the parent
    var $elem = $('<div class="pcc-fieldedit-container"></div>').appendTo(options.elem);
    var components = {};
    var field;
    var markId;
    
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
        updateFieldState: function updateFieldState(fieldPropertyName, component, state, componentValue) {
            if (component) {
                componentValue = funcs.getComponentValue(component, componentValue);

                state.fieldList[field.markId] = state.fieldList[field.markId] || {};
                state.fieldList[field.markId][fieldPropertyName] = componentValue;
            }

            return state;
        },
        updateFieldProperty: function updateFieldProperty(fieldPropertyName, component, componentValue) {
            if (component) {
                var state = funcs.updateFieldState(fieldPropertyName, component, {fieldList: {}}, componentValue);

                viewer.eventStore.trigger('ModifyState', {
                    state: 'FieldList',
                    stateValue: state
                });
            }
        },
        isFieldIdUnique: function isFieldIdUnique() {
            // Check if another field has the specified field ID, if so show an error.
            var fieldList = viewer.stateStore.getState('FieldList').fieldList;
            for (var fieldListField in fieldList) {
                if (fieldList.hasOwnProperty(fieldListField)) {
                    if (fieldList[fieldListField].markId !== field.markId && fieldList[fieldListField].fieldId && fieldList[fieldListField].fieldId.toLowerCase() === components.fieldId.value().toLowerCase()) {
                        return false;
                    }
                }
            }

            return true;
        },
        attachTemplateBehavior: function attachTemplateBehavior() {

            components.fieldId.on('change', function(ev){
                // Check that a value was provided.
                if (components.fieldId.value().length === 0) {
                    components.fieldId.showError(PCCViewer.Language.data.errorFieldIdRequired);
                    return;
                }

                if (funcs.isFieldIdUnique() === false) {
                    components.fieldId.showError(PCCViewer.Language.data.errorMustEnterUniqueFieldId);
                    return;
                }

                components.fieldId.hideError();

                funcs.updateFieldProperty('fieldId', components.fieldId);
            });

            components.displayName.on('change', function(ev){
                funcs.updateFieldProperty('displayName', components.displayName);
            });

            components.required.on('change', function(ev){
                var groupId = funcs.getComponentValue(components.group);

                if (groupId !== undefined && groupId !== 'none') {
                    var groups = viewer.stateStore.getState('FieldList').groups || {};

                    if (groups[groupId]) {
                        groups[groupId].required = funcs.getComponentValue(components.required);

                        viewer.eventStore.trigger('ModifyState', {
                            state: 'FieldList',
                            stateValue: {
                                groups: groups
                            }
                        });
                    }
                } else {
                    funcs.updateFieldProperty('required', components.required);
                }
            });

            if (components.multiline) {
                components.multiline.on('change', function(ev){
                    var isMultiline = $(components.multiline.pccElements[0]).find('input').is(':checked');
                    var fontSizeCont = $(components.fontSize.dom).parent();

                    if (isMultiline && fontSizeCont.hasClass('pcc-hide')) {
                        fontSizeCont.removeClass('pcc-hide');
                    } else {
                        fontSizeCont.addClass('pcc-hide');
                    }

                    funcs.updateFieldProperty('multiline', components.multiline);
                });
            }

            if (components.formRole) {
                components.formRole.on('change', function(ev){
                    var groupId = funcs.getComponentValue(components.group);

                    if (groupId !== undefined && groupId !== 'none') {
                        var groups = viewer.stateStore.getState('FieldList').groups || {};

                        if (groups[groupId]) {
                            groups[groupId].formRoleId = funcs.getComponentValue(components.formRole);

                            viewer.eventStore.trigger('ModifyState', {
                                state: 'FieldList',
                                stateValue: {
                                    groups: groups
                                }
                            });
                        }
                    } else {
                        funcs.updateFieldProperty('formRoleId', components.formRole);
                    }
                });
            }

            if (components.font) {
                components.font.on('change', function(ev){
                    funcs.updateFieldProperty('fontName', components.font);
                });
            }

            if (components.fontColor) {
                components.fontColor.on('change', function(ev){
                    funcs.updateFieldProperty('fontColor', components.fontColor);
                });
            }

            if (components.fontSize) {
                components.fontSize.on('change', function(ev){
                    funcs.updateFieldProperty('fontSize', components.fontSize);
                });
            }

            if (components.characterLimit) {
                components.characterLimit.on('change', function(ev){
                    var enteredText = components.characterLimit.value();

                    if (isNaN(enteredText)) {
                        components.characterLimit.showError(PCCViewer.Language.data.errorMustEnterNumber);
                        return;
                    }
                    else if (enteredText < 0) {
                        components.characterLimit.showError(PCCViewer.Language.data.errorMustEnterNonNegativeNumber);
                        return;
                    }
                    else if (enteredText.indexOf('.') !== -1) {
                        components.characterLimit.showError(PCCViewer.Language.data.errorMustEnterWholeNumber);
                        return;
                    }

                    components.characterLimit.hideError();

                    funcs.updateFieldProperty('characterLimit', components.characterLimit, Number(enteredText));
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
                var $newGroupSubmit = $('[data-pcc-new-group-submit]');

                components.newGroup
                    .on('input', function() {
                        var value = funcs.getComponentValue(components.newGroup);

                        components.newGroup.css('margin-right', value.length ? $newGroupSubmit.outerWidth() + 2 : 0);
                        $newGroupSubmit.toggle(!!value.length);
                    })
                    .on('submit', function() {
                        var groups = viewer.stateStore.getState('FieldList').groups || {},
                            value = funcs.getComponentValue(components.newGroup),
                            fieldGroup = _.findWhere(groups, { displayName: value }),
                            groupId;

                        // The group name cannot be empty
                        if (!value.length) {
                            components.newGroup.showError(PCCViewer.Language.data.groupNameCannotBeEmpty);
                            return;
                        }

                        // The group name must be unique
                        if (_.chain(groups).pluck('displayName').contains(value).value()) {
                            components.newGroup.showError(PCCViewer.Language.data.groupNameMustBeUnique);
                            return;
                        }

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

                components.newGroup.parent().hide()
                    .find('[data-pcc-new-group-submit]').hide().on('click', function() {
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
            _.forEach(components, function(comp, name){
                comp.destroy();
            });

            components = {};

            $elem.removeClass('pcc-open').off().empty();
        },
        updateAllFieldProperties: function updateAllFieldProperties() {
            var state = { fieldList: {} };

            if (components.fieldId && components.fieldId.value().length !== 0 && funcs.isFieldIdUnique() === true) {
                state = funcs.updateFieldState('fieldId', components.fieldId, state);
            }

            state = funcs.updateFieldState('displayName', components.displayName, state);
            state = funcs.updateFieldState('required', components.required, state);
            state = funcs.updateFieldState('multiline', components.multiline, state);
            state = funcs.updateFieldState('fontName', components.fontName, state);
            state = funcs.updateFieldState('fontColor', components.fontColor, state);
            state = funcs.updateFieldState('fontSize', components.fontSize, state);
            
            if (components.characterLimit) {
                var enteredText = components.characterLimit.value();
                if (!(isNaN(enteredText) || enteredText < 0 || enteredText.indexOf('.') !== -1)) {
                    components.characterLimit.hideError();
                    state = funcs.updateFieldState('characterLimit', components.characterLimit, state, Number(enteredText));
                }
            }

            viewer.eventStore.trigger('ModifyState', {
                state: 'FieldList',
                stateValue: state
            });
        },
        drawTemplate: function drawTemplate() {

            // clear any previously attached controls
            funcs.detachTemplateBehavior();

            var fieldList = viewer.stateStore.getState('FieldList'),
                fieldRoleId, formRoles, roles;

            field = fieldList.fieldList[markId];

            // The sort index may be updated by another module, so make sure this module does not overwrite it.
            field['sortIndex'] = undefined;
            field['rectangle'] = undefined;

            // Get the role that this field is attached to
            if (field.groupId && field.groupId !== 'none') {
                fieldRoleId = fieldList.groups[field.groupId].formRoleId;
            } else {
                fieldRoleId = field.formRoleId;
            }

            // Translate the roles object into an array
            roles = _.toArray(fieldList.formRoles);

            // Sort the roles in order of sortIndex
            roles.sort(function(a, b) {
                var aSort = a.sortIndex,
                    bSort = b.sortIndex;

                return aSort < bSort ? -1 : aSort > bSort ? 1 : 0;
            });

            // Set up the form roles for display
            if (!_.isEmpty(fieldList.formRoles)) {
                formRoles = {
                    list: roles,
                    selected: fieldRoleId,
                };
            }

            $elem.html(template({
                    data: field,
                    language: PCCViewer.Language.data,
                    groups: {
                        list: fieldList.groups,
                        selected: field.groupId ? field.groupId : 'none'
                    },
                    formRoles: formRoles
                }))
                .on('click', '[data-pcc-back]', funcs.onBackClick)
                .on('click', '[data-pcc-duplicate]', funcs.onDuplicateClick)
                .on('click', '[data-pcc-delete]', funcs.onDeleteClick);

            // init parts of the template
            components = viewer.parseComponents($elem);
            viewer.parseIcons($elem);

            // Show the current state of the field in the UI.
            components.fieldId.value(field.fieldId);
            if (field.displayName) {
                components.displayName.value(field.displayName);
            }
            if (field.required === true && !field.groupId) {
                components.required.value('required');
            }
            if (field.multiline === true) {
                components.multiline.value('multiline');
            }
            if (field.fontName !== undefined) {
                components.font.value(field.fontName);
            }
            if (field.fontColor !== undefined) {
                components.fontColor.value(field.fontColor);
            }
            if (field.fontSize !== undefined && field.multiline) {
                components.fontSize.value(field.fontSize);
            }
            if (field.characterLimit !== undefined) {
                components.characterLimit.value(field.characterLimit);
            }
            if (fieldList.groups && field.groupId && fieldList.groups[field.groupId]) {
                components.group.value(field.groupId);

                if (fieldList.groups[field.groupId].required) {
                    components.required.value('required');
                }

                if (fieldList.groups[field.groupId].data.multiple) {
                    components.multipleSelections.value(true);
                }
            }

            funcs.attachTemplateBehavior();

            // only open the menu once all DOM manipulation is done
            $elem.addClass('pcc-open');
        },
        onTriggerIntent: function onTriggerIntent(ev, data) {
            funcs.updateAllFieldProperties();

            markId = data.markId;

            funcs.drawTemplate();
        },
        onCloseIntent: function onCloseIntent(ev, data) {
            markId = undefined;

            funcs.detachTemplateBehavior();
        },
        onStateModified: function onStateModified(ev, data) {
            if (data.state === 'FieldList' && markId && data.stateValue.fieldList[markId]) {
                funcs.updateAllFieldProperties();
                funcs.drawTemplate();
            }
        },
        onBackClick: function onBackClick(ev) {
            funcs.updateAllFieldProperties();
            funcs.detachTemplateBehavior();
        },
        onDuplicateClick: function onDuplicateClick(ev) {

            viewer.eventStore.trigger('DuplicateFields', {
                markIds: [markId]
            });

            funcs.updateAllFieldProperties();
            funcs.detachTemplateBehavior();
        },
        onDeleteClick: function onDeleteClick(ev) {

            viewer.eventStore.trigger('DeleteFields', {
                markIds: [markId]
            });

            // Dismiss the UI.
            funcs.detachTemplateBehavior();
        }
    };
    
    /**
     * @function FieldEdit#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents(viewer, funcs);
        
        $elem.off();
        $elem.remove();
    };

    //init the module
    attachEvents(viewer, funcs);
}

/**
 * Creates the field editing UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewerObj, options) {
    return new FieldEdit(viewerObj, options);
};
