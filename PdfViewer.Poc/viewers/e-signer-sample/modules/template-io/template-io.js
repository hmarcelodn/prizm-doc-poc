/* global module, $, _, PCCViewer */

/**
 * @module template-io
 * @description Manages the saving and loading of template files.
 * @fires {@link module:event-store#event:ModifyState}
 * @fires {@link module:event-store#event:DisplayForm}
 * @fires {@link module:event-store#event:FormLoaded}
 * @fires {@link module:event-store#event:FormCopied}
 * @fires {@link module:event-store#event:TemplateSaved}
 * @fires {@link module:event-store#event:TemplateSaveFailed}
 * @listens {@link module:event-store#event:SaveTemplate}
 * @listens {@link module:event-store#event:SaveTemplateCopy}
 * @example
 * var TemplateIO = require('template-io.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myTemplateIO = TemplateIO(this);
 * }
 */
function TemplateIO(viewer, options) {
    var pendingSave = false;
    var queuedSave = false;
    var saveEvent = 'SaveTemplate'.toLowerCase();
    var copyEvent = 'SaveTemplateCopy'.toLowerCase();
    var globalSettingsObj = {};
    
    function addIdToFormData (formDefinitionId) {
        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                formDefinitionId: formDefinitionId
            }
        });
    }
    
    function initModule() {
        var templateDocumentId = viewer.options.templateDocumentId;
        var signatureDateFormat = viewer.options.signatureDateFormat;

        globalSettingsObj['signatureDateFormat'] = signatureDateFormat;

        if (viewer.options.globalFontName !== undefined) {
            globalSettingsObj['fontName'] = viewer.options.globalFontName;
        }
        if (viewer.options.globalFontColor !== undefined) {
            globalSettingsObj['fontColor'] = viewer.options.globalFontColor;
        }
        
        // save the templateDocumentId
        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                templateDocumentId: templateDocumentId,
                globalSettings: globalSettingsObj
            }
        });

        // check to see if a template is being loaded
        // if not, we will assume that we are creating a new one
        if (viewer.options.formDefinitionId) {
            performOpen(viewer.options.formDefinitionId);
        }
    }
    
    function performOpen (formDefinitionId) {
        var url = viewer.options.imageHandlerUrl + '/FormDefinitions/' + formDefinitionId;
        
        $.ajax({
            url: url,
            method: 'GET',
            cache: false
        }).always(function(data, status, xhr){
            if (status === 'success' && data.formData) {
                // save form metadata in the state
                viewer.eventStore.trigger('ModifyState', {
                    state: 'FieldList',
                    stateValue: {
                        groups: data.groups,
                        formRoles: data.formRoles,
                        formDefinitionId: data.formDefinitionId || formDefinitionId,
                        formName: data.formName,
                        templateDocumentId: data.templateDocumentId,
                        globalSettings: data.globalSettings
                    }
                });

                if (data.globalSettings && data.globalSettings.fontName && data.globalSettings.fontColor) {
                    //template setting overide options settings. 
                    viewer.eventStore.trigger('ModifyState', {
                        state: 'GlobalSettings',
                        stateValue: data.globalSettings
                    });
                }
                else if (viewer.options.globalFontName !== undefined && viewer.options.globalFontColor !== undefined) {
                    //for new templates being created, the settings provided in the options would be applicable
                    viewer.eventStore.trigger('ModifyState', {
                        state: 'GlobalSettings',
                        stateValue: globalSettingsObj
                    });
                }

                // trigger event to draw marks and build the FieldList
                viewer.eventStore.trigger('DisplayForm', data);
            }
        });

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                formDefinitionId: formDefinitionId
            }
        });
    }
    
    function prepareSaveData(type) {
        var data = viewer.stateStore.getState('FieldList'),
            pageData = viewer.stateStore.getState('PageData');

        // make sure the formName field is defined
        data.formName = data.formName || "";

        // convert FieldList to FormDefinition
        data.formData = _.map(data.fieldList, function(field) {
            // delete extraneous fields
            delete field.markId;
            
            // add page data if the state knows it
            // if it doesn't, we will assume that this mark has 
            // not been transformed yet
            if (pageData && pageData[field.pageNumber]) {
                field.pageData = pageData[field.pageNumber];
            }
            
            return field;
        });
        delete data.fieldList;
        
        if (type === copyEvent) {
            // remove the old form definition id
            delete data.formDefinitionId;
            
            // rename the form
            var lang = PCCViewer.Language.data || {};
            data.formName = data.formName + (lang.copyNameAppend || ' - Copy');
        }
        
        return data;
    }
    
    function performSave(ev) {
        var evType = ev.type.toLowerCase();
        
        // check if a save is in progress already
        // skip this check if this is a Save Copy event
        if (pendingSave && evType === saveEvent) {
            queuedSave = true;
            return;
        }
        
        var formDef = prepareSaveData(evType);
        var id = formDef.formDefinitionId;
        
        if (evType !== copyEvent) {
            pendingSave = true;
        }
        
        // assume that this will be a "create" call
        var url = viewer.options.imageHandlerUrl + '/FormDefinitions',
            method = 'POST';
        
        // if we have an id, we need to update this to an "update" call
        if (id) {
            url += '/' + id;
        }
        
        // pseudo-save method
        // make sure it is asynchronous
        $.ajax({
            url: url,
            method: method,
            contentType: 'text/plain',
            data: JSON.stringify(formDef)
        }).done(function(data, status, xhr){
            if (xhr.status === 201 && data.formDefinitionId) {
                formDef.formDefinitionId = data.formDefinitionId;
                addIdToFormData(data.formDefinitionId);
            }
            
            if (evType === saveEvent) {
                pendingSave = false;
            } else if (evType === copyEvent) {
                updateOnCopyComplete(formDef);
            }
            
            viewer.eventStore.trigger('TemplateSaved');

            // check if we need to save again
            if (queuedSave) {
                queuedSave = false;
                performSave();
            }
        }).fail(function() {
            pendingSave = false;
            queuedSave = false;

            viewer.eventStore.trigger('TemplateSaveFailed');
        });
    }

    function updateOnCopyComplete(data) {
        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                formName: data.formName,
                formDefinitionId: data.formDefinitionId
            }
        });
        
        viewer.eventStore.trigger('FormCopied');
    }
    
    function onStateModified(ev, data) {
        if (data.state !== 'FieldList') { return; }
        
        performSave();
    }
    
    function attachEvents() {
        viewer.eventStore.on('SaveTemplate', performSave);
        viewer.eventStore.on('SaveTemplateCopy', performSave);
    }
    
    function detachEvents() {
        viewer.eventStore.off('StateModified', onStateModified);
        viewer.eventStore.off('SaveTemplate', performSave);
        viewer.eventStore.off('SaveTemplateCopy', performSave);
    }
    
    /**
     * @method module:template-io#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents();
    };
    
    initModule();
    attachEvents();
}

/**
 * Creates the template IO module.
 * @param {Core} viewer The core viewer to which the module will attach.
 */
module.exports = function(viewer, options) {
    return new TemplateIO(viewer, options);
};
