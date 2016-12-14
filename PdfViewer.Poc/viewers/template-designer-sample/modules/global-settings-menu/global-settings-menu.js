/* global module, require, $, _, PCCViewer */

// require the CSS code and the HTML template
require('./global-settings-menu.less');
var template = require('./global-settings-menu.html');

/**
 * @module global-settings-menu
 * @description Manages global template settings.
 *
 * @fires {@link module:event-store#event:ModifyState} for "GlobalSettings" and "FieldList" state
 * @listens {@link module:event-store#event:AccessGlobalSettings}
 *
 * @example
 * var GlobalSettingsMenu = require('global-settings-menu.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myGlobalSettingsMenu = GlobaSettingsMenu(this, {
 *         elem: document.getElementById('myGlobalSettingsMenu')
 *     });
 * }
 */
function GlobalSettingsMenu(viewer, options) {
    var $elem = $(options.elem),
        components = {},
        saveData = { globalSettings: {}, formRoles: {} },
        fieldColors = ['#439fe0', '#58bb63', '#eb4d5c', '#edb431', '#4d394b'],
        currentTab;

    function getUniqueId(list, prefix) {
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
    }

    function saveSettings() {
        var fieldList = viewer.stateStore.getState('FieldList').fieldList || {},
            formRoles = getFormRoles(),
            defaultRole;

        // The default role is the one with the lowest sort index
        if (!_.isEmpty(formRoles)) {

            defaultRole = _.min(formRoles, function(role) {
                return role.sortIndex;
            });
        }

        // Make sure we aren't saving unnecessary things
        saveData.fieldList = {};
        saveData.groups = {};

        // Set the form role id on each field that currently exists
        _.each(fieldList, function(field) {

            // Form roles don't exist, so we should remove them from the field
            if (_.isEmpty(formRoles)) {

                if (field.groupId) {
                    saveData.groups[field.groupId] = {
                        formRoleId: undefined
                    };
                } else {
                    saveData.fieldList[field.markId] = {
                        formRoleId: undefined
                    };
                }
            }

            // Form roles exist, but this field is not referencing a valid one
            else if (!field.formRoleId || !formRoles[field.formRoleId]) {

                if (field.groupId) {
                    saveData.groups[field.groupId] = {
                        formRoleId: defaultRole.formRoleId
                    };
                } else {
                    saveData.fieldList[field.markId] = {
                        formRoleId: defaultRole.formRoleId
                    };
                }
            }
        });

        viewer.eventStore.trigger('ModifyState', {
            state: 'GlobalSettings',
            stateValue: saveData.globalSettings
        });

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                globalSettings: saveData.globalSettings,
                formRoles: saveData.formRoles,
                fieldList: saveData.fieldList,
                groups: saveData.groups
            }
        });

        detachTemplateBehavior();
    }

    function revertSettings() {
        saveData = { globalSettings: {}, formRoles: {} };

        detachTemplateBehavior();
    }

    function getFormRoles() {
        var formRoles = viewer.stateStore.getState('FieldList').formRoles || {};

        // Emulate what will happen when we modify state
        formRoles = viewer.deepMerge({}, formRoles, saveData.formRoles);

        return formRoles;
    }

    function buildTemplate() {
        var fieldList = viewer.stateStore.getState('FieldList'),
            globalSettings = viewer.stateStore.getState('GlobalSettings') || fieldList.globalSettings || {},
            formRoles = getFormRoles();

        detachTemplateBehavior();

        // Translate the roles object into an array
        formRoles = _.toArray(formRoles);

        // Sort the roles in order of sortIndex
        formRoles.sort(function(a, b) {
            var aSort = a.sortIndex,
                bSort = b.sortIndex;

            return aSort < bSort ? -1 : aSort > bSort ? 1 : 0;
        });

        $elem.html(template({
                language: PCCViewer.Language.data,
                formRoles: {
                    list: formRoles,
                    colors: _.difference(fieldColors, _.pluck(formRoles, 'fieldColor'))
                }
            })).addClass('pcc-open')
            .on('click', '[data-pcc-global-settings-close]', revertSettings)
            .on('click', '[data-pcc-global-settings-cancel]', revertSettings)
            .on('click', '[data-pcc-global-settings-done]', saveSettings);

        // init parts of the template
        components = viewer.parseComponents($elem);
        viewer.parseIcons($elem);

        if (globalSettings && globalSettings.fontName) {
            components.font.value(globalSettings.fontName);
        }

        if (globalSettings && globalSettings.fontColor !== undefined) {
            components.fontColor.value(globalSettings.fontColor);
        }

        attachTemplateBehavior();

        components.settingsTab.value(currentTab || 'font');
    }

    function attachTemplateBehavior() {

        if (components.settingsTab) {
            var $panes = $('[data-pcc-settings-pane]');

            components.settingsTab.on('change', function(ev, data) {
                currentTab = data.value;

                var $current = $panes.filter('[data-pcc-settings-pane="' + currentTab + '"]').show();

                $panes.not($current).hide();
            });
        }

        if (components.font) {
            components.font.on('change', function(ev) {
                saveData.globalSettings.fontName = components.font.value();
            });
        }

        if (components.fontColor) {
            components.fontColor.on('change', function(ev) {
                saveData.globalSettings.fontColor = components.fontColor.value();
            });
        }

        if (components.newRole) {
            var $newRoleSubmit = $('[data-pcc-global-settings-new-role-submit]');

            components.newRole
                .on('input', function() {
                    var value = components.newRole.value();

                    components.newRole.css('margin-right', value.length ? $newRoleSubmit.outerWidth() + 2 : 0);
                    $newRoleSubmit.toggle(!!value.length);
                })
                .on('submit', function(ev) {
                    var formRoles = getFormRoles(),
                        formRoleId = getUniqueId(_.pluck(formRoles, 'formRoleId'), 'formRole'),
                        formRoleName = components.newRole.value(),
                        fieldColor = components.fieldColor.value(),
                        maxSortIndex = 0;

                    // The role name cannot be empty
                    if (!formRoleName.length) {
                        components.newRole.showError(PCCViewer.Language.data.roleNameCannotBeEmpty);
                        return;
                    }

                    // The role name must be unique
                    if (_.chain(formRoles).pluck('displayName').contains(formRoleName).value()) {
                        components.newRole.showError(PCCViewer.Language.data.roleNameMustBeUnique);
                        return;
                    }

                    if (!_.isEmpty(formRoles)) {
                        maxSortIndex = _.max(formRoles, function(role) {
                            return role.sortIndex;
                        }).sortIndex;
                    }

                    saveData.formRoles[formRoleId] = {
                        formRoleId: formRoleId,
                        fieldColor: fieldColor,
                        displayName: _.escape(formRoleName),
                        sortIndex: maxSortIndex + 1
                    };

                    buildTemplate();
                });

            $('[data-pcc-global-settings-new-role-submit]').hide().on('click', function(ev) {
                components.newRole.trigger('submit');
            });
        }

        $elem.on('click', '[data-pcc-global-settings-form-role-delete]', function(ev) {
            saveData.formRoles[ $(this).parent().attr('data-pcc-global-settings-form-role-id') ] = undefined;

            buildTemplate();
        });
    }

    function detachTemplateBehavior() {

        _.forEach(components, function(comp, name) {
            comp.destroy();
        });

        components = {};

        $elem.removeClass('pcc-open').off().empty();
    }

    function attachEvents() {
        viewer.eventStore.on('AccessGlobalSettings', buildTemplate);
    }

    function detachEvents() {
        viewer.eventStore.off('AccessGlobalSettings', buildTemplate);
    }

    /**
     * @function module:global-settings-menu#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachTemplateBehavior();
        detachEvents();
        $elem.empty();
    };

    attachEvents();
}

/**
 * Creates the global settings menu module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new GlobalSettingsMenu(viewer, options);
};
