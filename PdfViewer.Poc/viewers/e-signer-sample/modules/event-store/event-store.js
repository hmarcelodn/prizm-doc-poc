/* global module, $ */

/**
 * @module event-store
 * @description An event API. This event store is used internally by the viewer, 
 * and should not need to be initialized outside of that usage.
 * @example
 * var EventStore = require('event-store.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     // other modules will expect this to be present
 *     this.eventStore = EventStore(this);
 * }
 */
function EventStore(){
    return $({});
}

/**
 * @example
 * var eventStore = require('event-store.js')(viewerInstance);
 */
module.exports = function init() {
    return new EventStore();
};

//-------------------------------------------------------------------------------
// A description of all on, off, and event callback functions across the viewer.
//-------------------------------------------------------------------------------

/**
 * All event registrations across the viewer follow the pattern of this `on` function.
 * @function on
 * @param {string} name The event name.
 * @param {eventCallback} callback The function to execute.
 */

/**
 * All event removals across the viewer follow the pattern of this `off` function.
 * @function off
 * @param {string} [name] The name of the event being listened to. If a name is not provided, all
 * event listeners attached to this object will be removed.
 * @param {eventCallback} [callback] The original function used to register the event listener that should
 * be disconnected. If this parameter is not defined, all functions registered to listen to the provided
 * event name will be removed.
 */

/**
 * All event callbacks across the viewer follow this pattern.
 * @function eventCallback
 * @param {Object} event The event parameters.
 * @param {string} event.type The event name.
 * @param {Object} [data] The data associated with this event. This `data` object will contain the 
 * information being forwarded with the event.
 */

/**
 * The format of the data provided in the `onDone` event. This will be an event triggered
 * in the style of {@link module:event-store~eventCallback}.
 * @member onDoneCallback
 * @property {string} status On a successful completion, this value will be `success`. It can also be
 * `cancel` for when a user cancels the action.
 * @property {*} data The data requested by the action. This can be any format that is needed
 * by the event.
 */

//-------------------------------------------------------------------------------
// A description of events that are fired.
//-------------------------------------------------------------------------------

/**
 * @event module:event-store#ModifyState
 * @description
 * Indicates that a module or external code would like to modify a known 
 * state value. Generally, a module should not listen to this event. It is
 * handled by {@link StateStore}, which will in turn fire 
 * {@link module:event-store#event:StateModified}, to notify all other modules that
 * a new state value is available.
 * @property {string} state The name of the state being modified.
 * @property {*} stateValue The new value of the state.
 * @property {string} [operation="extend"]
 * Specifies how the modification should occur. By default, any modification will
 * extend the current state, merging any additional values from `stateValue` into
 * the current state that is stored in the State Store. You can also specify
 * `"replace"` as the operation value, causing the old state to be discarded, and 
 * the exact value of `stateValue` to become the current state.
 * @see module:state-store
 * @see module:event-store#event:StateModified
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#StateModified
 * @description Indicates that a state value has been modified.
 * This event should only be fired by the {@link StateStore} 
 * module. It has the following data properties:
 * @property {string} state The name of the state that was modified.
 * @property {*} stateValue The current value of the state that was modified.
 * @see module:state-store
 * @see module:event-store#event:ModifyState
 * @see module:event-store~eventCallback
 *
 * @example
 * viewer.eventStore.on('StateModified', function(ev, data){
 *     if (data.state !== 'MyStateKey') { return; }
 *     
 *     // handle the state change here
 * });
 */

/**
 * @event module:event-store#ModifyTemplateField 
 * @description Indicates that a template field needs to be modified.
 * @property {string} markId The ID of the mark that corresponds to the template field.
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#ModifyMultipleTemplateFields
 * @description Indicates that multiple template fields need to be modified.
 * @property {array} markIds An array of currently selected Mark IDs.
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#DeselectAllTemplateFields
 * @description Indicates that all previously selected fields are now deselected.
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#FormLoaded
 * @description Indicates that a form has been loaded from the server.
 * @see module:event-store~eventCallback
 */

/**
* @event module:event-store#AccessGlobalSettings
* @description Indicates that the user needs to access the global settings dialog for modifying
* the various global settings available for the templates.
* @see module:event-store~eventCallback
*/

/**
* @event module:event-store#RegisterKeyCombinations
* @description Requests registration of a new keyboard key combination.
* @property {string} state This should always be defined as the string "KeyCombinations".
* @property {Object} stateValue An object containing data about the key combination.
* @property {string} stateValue.keyCombinations Keyboard key combinations when pressed 
* would trigger [KeyCombinationsTriggered]{@link module:event-store#event:KeyCombinationsTriggered} 
* event.
* @see module:event-store~eventCallback
* @see module:event-store#event:KeyCombinationsTriggered
*/

/**
* @event module:event-store#KeyCombinationsTriggered
* @description Indicates that the user pressed the keyboard key combinations.
* @property {string} state This should always be defined as the string "KeyCombinationsTriggered".
* @property {Object} stateValue An object containing data about the key combination.
* @property {string} stateValue.keyCombinations
* A string property containing keyboard keyCombinations that were pressed
* by the user.
* @see module:event-store~eventCallback
* @see module:event-store#event:RegisterKeyCombinations
*/

/**
 * @event module:event-store#FormCopied
 * @description Indicates that the current form has successfully been copied.
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#DisplayForm
 * @description Indicates that a {@link module:state-store~FormDefinition} is
 * available for displaying on the document.
 * @property {module:state-store~FormDefinition} formDefinition
 * Provides the form definition as the data parameter.
 * @see module:event-store~eventCallback
 * 
 * @example
 * viewer.eventStore.on('DisplayForm', function(ev, formDefinition) {
 *     // logic to convert the form data to visible marks on the document
 *     createMarksForFormData(formDefinition.formData);
 * });
 */

/**
 * @event module:event-store#SaveTemplate
 * @description Indicates that the user needs to save the form template in its
 * current state.
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#SaveTemplateCopy
 * @description Indicates that the user needs to save a new copy of the form template 
 * in its current state. This event is implemented to convert the viewer into using
 * the newly created copy when the copying is complete.
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#ToggleChecklist
 * @description Triggers the checklist to toggle open or closed.
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#FocusChecklistItem
 * @description Indicates that an item in the checklist has been focused.
 * @property {string} [markId]
 * The ID of the mark that corresponds to the focused checklist item.
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#PersistSignatures
 * @description Triggers a manual save of the signatures. It will save all signatures
 * currently in the `PCCViewer.Signatures` collection.
 * @see module:event-store~eventCallback
 */

/**
 * @event module:event-store#CreateSignature
 * @description Triggers a user request to apply a signature to a field.
 * @property {string} [category]
 * The field type that this signature belongs to. If undefined, no category will be assigned.
 * Known values for this are `signature` and `initials`.
 * @property {string} [signatureType]
 * The type of signature being created, as represented by the target mark. Possible values are 
 * `FreehandSignature` and `TextSignature`. When this value is not defined, a good experience would
 * be to allow the user to choose.
 * @property {string} [onDone] An event name to trigger, in the style of 
 * {@link module:event-store~onDoneCallback}. It should provide a signature object as the `data`
 * attribute with the data returned from `PCCViewer.SignatureControl`, or `undefined` to signal 
 * that the user cancelled the action.
 * 
 * @see module:event-store~eventCallback
 * @see module:event-store~onDoneCallback
 */

/**
 * @event module:event-store#ManageSignatures
 * @description Triggers a user request to manage signatures in a list.
 * @property {string} [category]
 * The field type that this signature belongs to. When defined, only the signatures belonging to
 * that category should be displayed. If undefined, all known signatures should be displayed.
 * Known values for this are `signature` and `initials`.
 * @property {Object} [selectedSignature] An object, consisting of the signature data (as returned 
 * by `PCCViewer.SignatureControl`), defining the signature that the user has selected. Unless the 
 * user changes the signature, this data should be returned in the `onDone` event as the signature
 * data.
 * @property {string} [onDone] An event name to trigger, in the style of 
 * {@link module:event-store~onDoneCallback}. It should provide a signature object as the `data`
 * attribute with the data returned from `PCCViewer.SignatureControl`, or `undefined` to signal 
 * that the user has removed the selected signature.
 * 
 * @see module:event-store~eventCallback
 * @see module:event-store~onDoneCallback
 */

/**
 * @event module:event-store#CreateDate
 * @description Triggers a user request to select a date.
 * @property {Object} position The position to locate the UI, relative to a rectangle on the window.
 * @property {number} position.x The x-axis location.
 * @property {number} position.y The y-axis location.
 * @property {number} position.width The width of the rectangle.
 * @property {number} position.height The height of the rectangle.
 * @property {string} [onDone] An event name to trigger, in the style of 
 * {@link module:event-store~onDoneCallback}. It should provide a date string as the 
 * event's `data` attribute.
 * 
 * @see module:event-store~eventCallback
 * @see module:event-store~onDoneCallback
 */

/**
 * @event module:event-store#AlignFields
 * @description Triggers alignment of the given fields.
 * @property {string} alignment The plane and direction of the alignment operation.
 * @property {Array} markIds An array of Mark IDs to align.
 * @see module:event-store~eventCallback
 *
 * @example
 * viewer.eventStore.trigger('AlignFields', {
 *     alignment: 'horizontal-left',
 *     markIds: viewer.viewerControl.getSelectedMarks()
 * });
 */

/**
 * @event module:event-store#DeleteFields
 * @description Triggers deletion of the given fields.
 * @property {Array} markIds An array of Mark IDs to delete.
 * @see module:event-store~eventCallback
 *
 * @example
 * viewer.eventStore.trigger('DeleteFields', {
 *     markIds: [1, 2, 3]
 * });
 */

/**
 * @event module:event-store#DuplicateFields
 * @description Triggers duplication of the given fields.
 * @property {Array} markIds An array of Mark IDs to duplicate.
 * @see module:event-store~eventCallback
 *
 * @example
 * viewer.eventStore.trigger('DuplicateFields', {
 *     markIds: [1, 2, 3]
 * });
 */

/**
 * @event module:event-store#Notify
 * @description Triggers a notification.
 * @property {String} type The type of notification, either "error" or "success".
 * @property {String} message The message of the notification.
 * @see module:event-store~eventCallback
 *
 * @example
 * viewer.eventStore.trigger('Notify', {
 *     type: 'error',
 *     message: 'An error occurred.'
 * });
 */

/**
 * @event module:event-store#TemplateSaved
 * @description Indicates that a template successfully saved.
 * @see module:event-store~eventCallback
 *
 * @example
 * viewer.eventStore.trigger('TemplateSaved');
 */

/**
 * @event module:event-store#TemplateSaveFailed
 * @description Indicates that a template failed to save.
 * @see module:event-store~eventCallback
 *
 * @example
 * viewer.eventStore.trigger('TemplateSaveFailed');
 */

/**
 * @event module:event-store#BurnForm
 * @description Indicates that the user wants to burn the signatures to the form.
 * @see module:event-store~eventCallback
 */
