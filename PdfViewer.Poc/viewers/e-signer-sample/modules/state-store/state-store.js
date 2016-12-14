/* global module, _ */

/**
 * @module state-store
 * @description The state store can keep track of any JSON-style data
 * object for other modules to access and use.
 * 
 * The state store is used as centralized data storage for all modules, especially
 * when concerning data that is shared among 2 or more modules. When individual modules
 * need to update stecific data, modifications through the state store ensure that other
 * modules that need to be aware of the latest available data can do so without specific
 * input from the module changing it.
 *
 * The state store can store any number of states, as defined by a data string. See
 * {@link module:event-store#event:ModifyState}. It is able to associate any data object
 * with that particular state, although it is optimized to store key-value Objects.
 * 
 * @fires {@link module:event-store#event:StateModified}
 * @listens {@link module:event-store#event:ModifyState}
 * 
 * @example
 * var StateStore = require('state-store.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     // other modules will expect this to be present
 *     this.stateStore = StateStore(this);
 * }
 */
function StateStore(viewer) {
    var store = {};

    function getState(key) {
        // if defined, always return a deep copy of the object
        return (typeof store[key] === 'undefined') ? undefined : viewer.deepMerge({}, store[key]);
    }

    /**
     * @function module:state-store#getState
     * @description Gets the current state.
     * @param {string} key The name of the state value being retrieved.
     * @returns {*|undefined} The state value associated with the specified key
     * or `undefined` if the state value does not exist.
     */
    this.getState = function(key) {
        return getState(key);
    };

    function triggerStateModified(name, data) {
        viewer.eventStore.trigger('StateModified', viewer.deepMerge({}, data, {
            stateValue: getState(name)
        }));
    }

    function updateStateData(stateName, stateData, operation) {
        var oldData = store[stateName],
            newData;

        if (operation !== 'replace') {
            // deep merge the existing and new data
            store[stateName] = viewer.deepMerge({}, store[stateName], stateData);
        } else {
            // replace the existing data with a copy of the new data
            store[stateName] = viewer.deepMerge({}, stateData);
        }

        newData = store[stateName];

        // If the old and new objects are different, return true
        return !_.isEqual(oldData, newData);
    }
    
    function onModifyState(ev, data) {
        // when state is modified, we need to save it
        if (updateStateData(data.state, data.stateValue, data.operation || 'extend')) {
            triggerStateModified(data.state, data);
        }
    }

    function attachEvents() {
        viewer.eventStore.on('ModifyState', onModifyState);
    }
    function detachEvents() {
        viewer.eventStore.off('ModifyState', onModifyState);
    }

    /**
     * @function module:state-store#destroy
     * @description Destroys the instance of the State Store.
     */
    this.destroy = function() {
        // detach events
        detachEvents();
        
        // clear existing data
        store = undefined;
        store = {};
    };
    
    // init the module automatically by attaching events
    attachEvents();
}

/**
 * Creates and initializes the state store.
 * @param {Core} viewer The core viewer to which the module will attach.
 */
module.exports = function(that) {
    return new StateStore(that);
};

/**
 * @member module:state-store~FieldList
 * @description The known set of fields and metadata on the form.
 * 
 * @property {string} templateDocumentId
 * The unique id used to determine which document belongs to the form.
 * The form cannot be loaded if this value is not defined.
 * @property {string} [formName=""] The display name of the form.
 * @property {string} [formDefinitionId]
 * The unique id to use to save the form to the server.
 *
 * @property {Object} [formRoles] A hash object used to store and access the
 * metadata for each role in the form. The key for this hash object is the
 * `formRoleId` of the form role.
 * @property {string} formRoles.formRoleId The id of the form role.
 * @property {string} formRoles.displayName A friendly name for the form role.
 * @property {string} formRoles.fieldColor The color to use for any field to which the form role
 * is assigned, as a pound sign followed by a 6 character hexadecimal color code.
 * @property {number} formRoles.sortIndex A number representing the sorting
 * order of the form role.
 *
 * @property {Object} [groups] A hash object used to store and access the
 * metadata for each group in the form. The key for this hash object is the
 * `groupId` of the group.
 * @property {string} groups.groupId The id of the group.
 * @property {string} groups.displayName A friendly name for the group.
 * @property {string} groups.type
 * The data type of the group. Possible values are:
 * - `checkbox`
 * @property {Object} groups.data Data associated with the group.
 * @property {boolean} groups.data.multiple Indicates whether or not the group allows multiple selections.
 * @property {boolean} [groups.required] Indicates whether this group is required when signing the form.
 * @property {string} [groups.formRoleId] The form role id associated with the group.
 *
 * @property {Object} fieldList A hash object used to store and access
 * the metadata for each field in the form. The key for this hash object is
 * the `markId` of the viewer mark.
 * @property {number} fieldList.markId
 * The viewer mark associated with the form field.
 * @property {string} fieldList.fieldId A unique id for that field.
 * @property {string} fieldList.displayName A friendly name for the field.
 * @property {string} fieldList.template
 * The data type of the field. Possible values are:
 * - `SignatureTemplate`
 * - `InitialsTemplate`
 * - `TextTemplate`
 * - `DateTemplate`
 * @property {boolean} fieldList.required Indicates whether this field is
 * required when completing the form.
 * @property {number} fieldList.sortIndex A number representing the sorting
 * order of the field, when displaying an ordered list.
 * @property {number} fieldList.pageNumber The page number where the field is located.
 * @property {Object} fieldList.pageData Represents metadata about the page at
 * the time when the field rectangle was created or updated.
 * @property {number} fieldList.pageData.width The width of the page.
 * @property {number} fieldList.pageData.height The height of the page.
 * @property {Object} fieldList.rectangle The location of the field on the document.
 * @property {number} fieldList.rectangle.x
 * The x-coordinate of the top-left of the field in respect to the document.
 * @property {number} fieldList.rectangle.y
 * The y-coordinate of the top-left of the field in respect to the document.
 * @property {number} fieldList.rectangle.width
 * The width of the field.
 * @property {number} fieldList.rectangle.height
 * The height of the field.
 * @property {string} [fieldList.fontName]
 * The font name to use for `TextTemplate` and `DateTemplate` fields.
 * @property {string} [fieldList.fontColor]
 * The font color to use for `TextTemplate` and `DateTemplate` fields, as 
 * a pound sign followed by a 6 character hexadecimal color code.
 * @property {number} [fieldList.characterLimit]
 * The amount of characters that can be entered in a `TextTemplate` field. It is 
 * a whole number greater than or equal to 0 that indicates the maximum number of 
 * characters allowed in a text field when completing the form, with 0 indicating 
 * that there is no limit.
 * @property {string} [fieldList.formRoleId] The id of the form role associated with the field.
 * @property {string} [fieldList.groupId] The id of the group that contains the field.
 * 
 * @property {Object} globalSettings Settings that apply globally to the template.
 * @property {external:"jQuery.fn"~DateFormat} globalSettings.signatureDateFormat
 * The format to use for dates when completing template fields.
 * 
 * @example
 * var fieldList = viewer.stateStore.getState('FieldList');
 */

/**
 * @member module:state-store~PageData
 * @description
 * Defines the set of currently known pages -- ones that have loaded at least
 * once in the viewer -- and their sizes. It is a hash object, using the page
 * number as the object key, and the following properties as the object value.
 * @property {number} width The width of the page.
 * @property {number} height The height of the page.
 */

/**
 * @member module:state-store~FormDefinition
 * @description
 * Defines the schema of the template form that is saved to the server, 
 * including all of the metadata required to load and recreate the form.
 * 
 * @property {string} templateDocumentId
 * The unique id used to determine which document belongs to the form.
 * The form cannot be loaded if this value is not defined.
 * @property {string} [formName=""] The display name of the form.
 * @property {string} [formDefinitionId]
 * The unique id to use to save the form to the server.
 * @property {Array} [formRoles]
 * The data here is similar to the `formRoles` property of
 * {@link module:state-store~FieldList}, but represented as an array to be saved
 * to the server. This array will be used to rebuild the `formRoles` object when
 * a `FormDefinition` is loaded into the viewer.
 * @property {Array} [groups]
 * The data here is similar to the `groups` property of
 * {@link module:state-store~FieldList}, but represented as an array to be saved
 * to the server. This array will be used to rebuild the `groups` object when
 * a `FormDefinition` is loaded into the viewer.
 * @property {Array} formData
 * The data here is similar to the `fieldList` property of
 * {@link module:state-store~FieldList}, but represented as an array to be saved
 * to the server. This array will be used to rebuild the `FieldList` object when
 * a `FormDefinition` is loaded into the viewer. As such, some properties of 
 * `FieldList.fieldList` are excluded when generating the `FormDefinition.formData`.
 * These exclusions are `markId` and `sortIndex`.
 * @property {Object} globalSettings
 * An instance of the {@link module:state-store~GlobalSettings} object used 
 * for this form.
 */
