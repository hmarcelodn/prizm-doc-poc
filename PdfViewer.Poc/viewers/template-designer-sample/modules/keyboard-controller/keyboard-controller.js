/*global require, module, _, $, jQuery */

require('./jquery.hotkeys.min.js');

/**
 * @module keyboard-controller
 * @description 
 * Controls the keyboard keys. This module uses [jQuery.hotkeys](https://github.com/jeresig/jquery.hotkeys)
 * plugin. If desired it can be replaced with any other keyboard interface code without affecting the 
 * keyboard consumer modules.
 * @fires {@link module:event-store#event:KeyCombinationsTriggered}
 * @listens {@link module:event-store#event:RegisterKeyCombinations} for "KeyCombinations" state
 * @example
 * var KeyboardController = require('keyboard-controller.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myKeyboardController = KeyboardController(this);
 * }
 */
function KeyboardController(viewer) {
    var isActive = true;
    var keysRegistered = [];
    var overlaysNode, downloadNode, fieldSelected;

    function checkRegistered(action, keys) {
        var returnValue = -1;
        $.each(keysRegistered, function (index, item) {
            if (item.keys === keys && item.action === action) {
                return false;
            }
        });
        return returnValue;
    }

    function removeRegisteredArrayItem(action, keys) {
        var item;
        
        for (var i = 0; i < keysRegistered.length; i++) {
            item = keysRegistered[i];
            
            if (item.keys === keys && item.action === action) {
                item.count--;
                if (item.count === 0) {
                    keysRegistered.splice(i, 1);
                }
                break;
            }
            
            item = undefined;
        }
    }
    
    function onRegisterKeyCombinations(ev, data) {
        //To Do Apply filters here to add value to the module. 
        //right now we are just using 'keydown'
        if (data.state === 'KeyCombinations') {
            var register = true;
            if (data.stateValue && data.stateValue.register === false) {
                register = false;
            }
            if (data.stateValue && data.stateValue.keyCombinations) {
                registerKeyDown('keyDown', data.stateValue.keyCombinations, register);
            }
        }
    }

    function registerKeyDown(keyType, keysShortcut, register) {

        function keyDownHandler() {

            if ((overlaysNode && overlaysNode.hasClass('pcc-open')) || (downloadNode && downloadNode.hasClass('pcc-open'))) {
                return true;
            }

            if (keysShortcut === 'space') {
                var listState = viewer.stateStore.getState('FieldList'),
                    focusState = viewer.stateStore.getState('FocusField');

                if (focusState && focusState.lastActiveFieldMarkId) {
                    var field = listState.fieldList[focusState.lastActiveFieldMarkId];

                    if (field.template === 'TextTemplate') { 
                        return true;
                    }
                }
            }

            if (keysShortcut === 'up' || keysShortcut === 'right' || keysShortcut === 'down' || keysShortcut === 'left') {
                var activeElement = document.activeElement.nodeName.toLowerCase();

                if (!fieldSelected || activeElement === 'input' || activeElement === 'textarea') {
                    return true;
                }
            }

            viewer.eventStore.trigger('KeyCombinationsTriggered', {
                state: 'KeyCombinationsTriggered',
                stateValue: {
                    keyCombinations: keysShortcut
                }
            });

            return false;
        }

        if (register === true) {
            if (checkRegistered('keyDown', keysShortcut) === -1) {
                $(document).on('keydown', null, keysShortcut, keyDownHandler);
                keysRegistered.push({ action: 'keyDown', keys: keysShortcut, count: 1, handler: keyDownHandler });
            }
        }
        else {
            $(document).off('keydown', keyDownHandler);
            removeRegisteredArrayItem('keyDown', keysShortcut);
        }
    }

    function removeAllAttachedKeyHandlers() {
        _.forEach(keysRegistered, function (item) {
            $(document).off('keydown', item.handler);
        });
        keysRegistered = [];
    }

    function onFieldSelected() {
        fieldSelected = true;
    }

    function onFieldDeselected() {
        fieldSelected = false;
    }

    function initPlugin() {
        //jQuery.hotkeys.options.filterContentEditable = false;
        jQuery.hotkeys.options.filterInputAcceptingElements = false;
        jQuery.hotkeys.options.filterTextInputs = false;
        overlaysNode = viewer.$elem.find('[data-pcc-profile]');
        downloadNode = viewer.$elem.find('[data-pcc-download-signed-form-dialog]');
    }

    function attachEvents() {
        viewer.eventStore.on('RegisterKeyCombinations', onRegisterKeyCombinations);
        viewer.eventStore.on('ModifyMultipleTemplateFields', onFieldSelected);
        viewer.eventStore.on('ModifyTemplateField', onFieldSelected);
        viewer.eventStore.on('DeselectAllTemplateFields', onFieldDeselected);
    }

    function detachEvents() {
        viewer.eventStore.off('RegisterKeyCombinations', onRegisterKeyCombinations);
        viewer.eventStore.off('ModifyMultipleTemplateFields', onFieldSelected);
        viewer.eventStore.off('ModifyTemplateField', onFieldSelected);
        viewer.eventStore.off('DeselectAllTemplateFields', onFieldDeselected);
    }
    
    /**
     * @function module:keyboard-controller#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        //remove keyboard events
        removeAllAttachedKeyHandlers();
        isActive = false;
        detachEvents();
    };
    initPlugin();
    attachEvents();
}

/**
 * Creates the keyboard controller module.
 * @param {Core} viewer The core viewer to which the module will attach.
 */
module.exports = function init(viewerObj) {
    return new KeyboardController(viewerObj);
};
