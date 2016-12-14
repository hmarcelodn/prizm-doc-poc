/* global module, require, $, _, PCCViewer */

// require the CSS code and the HTML template
require('./form-tools.less');
var template = require('./form-tools.html');

var defaultFillColor = '#DCEBF8';
var defaultBorderColor = '#333333';
var defaultOpacity = 127;
var defaultBorderThickness = 1;

/**
 * @module form-tools
 * @description Manages the form tools. Selecting a tool determines how the mouse interacts with the document.
 * For example, selecting the Pan tool allows the user to scroll the document by clicking on it and dragging the
 * mouse. Selecting the Signature tool allows the user to use the mouse to create a signature field. After a
 * signature field is added, the Pan tool is automatically selected. The user can click a field tool twice to put
 * it into "sticky" state so that the tool remains selected after adding a field.
 *
 * @example
 * var FormTools = require('form-tools.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myFormTools = FormTools(this, {
 *         elem: document.getElementById('myFormTools')
 *     });
 * }
 */
function FormTools(viewer, options) {
    var $elem,
        components = {},
        mouseTools = {},
        knownTools = ['SignatureTemplate', 'InitialsTemplate', 'TextTemplate', 'DateTemplate', 'CheckboxTemplate'],
        lastToolData;

    function setMouseToolFillColor(name) {
        var formRoles = viewer.stateStore.getState('FieldList').formRoles || {},
            mouseTool = PCCViewer.MouseTools.getMouseTool(name);

        if (mouseTool.getTemplateMark) {
            var mark = mouseTool.getTemplateMark();

            if (!_.isEmpty(formRoles)) {
                var defaultRole = _.min(formRoles, function(role) {
                    return role.sortIndex;
                });

                mark.setFillColor(viewer.shadeColor(defaultRole.fieldColor, 0.5));
            } else {
                mark.setFillColor(defaultFillColor);
            }
        }
    }

    function createMouseTools() {

        // add the custom signature tools
        _.forEach(knownTools, function(name){
            // perform a safe add -- if the tool exists, do nothing
            var tool = PCCViewer.MouseTools.getMouseTool(name);
            if (tool) { return; }
            
            tool = PCCViewer.MouseTools.createMouseTool(name, PCCViewer.Mark.Type.RectangleAnnotation);

            // set this tool's mark properties
            var mark = tool.getTemplateMark();
            mark.setFillColor(defaultFillColor);
            mark.setOpacity(defaultOpacity);
            mark.setBorderThickness(defaultBorderThickness);
            mark.setBorderColor(defaultBorderColor);
            mark.setData('template', name);

            mouseTools[name] = tool;
        });

        // add the Accusoft tools
        mouseTools.panAndEdit = PCCViewer.MouseTools.getMouseTool('AccusoftPanAndEdit');
    }

    function onMarkCreated(ev) {
        
        // change the mouse tool if the current one is not sticky
        if (lastToolData && lastToolData.toggle !== 'sticky') {
            components.mousetools.value('AccusoftPanAndEdit', 'on');
        }
    }

    function onStateModified(ev, data) {
        if (data.state !== 'FieldList') {
            return;
        }

        setMouseToolFillColor(viewer.viewerControl.getCurrentMouseTool());
    }

    function attachEvents() {
        viewer.viewerControl.on(PCCViewer.EventType.MarkCreated, onMarkCreated);

        viewer.eventStore.on('StateModified', onStateModified);

        components.mousetools.on('change', function(ev, data){

            // save the current mouse tool data
            lastToolData = data;
            
            if (data.value) {
                viewer.viewerControl.setCurrentMouseTool(data.value);

                setMouseToolFillColor(data.value);
            } else {
                components.mousetools.value('AccusoftPanAndEdit', 'on');
            }
        });
    }

    function detachEvents() {
        viewer.viewerControl.off(PCCViewer.EventType.MarkCreated, onMarkCreated);

        viewer.eventStore.off('StateModified', onStateModified);

        components.mousetools.destroy();
    }

    function destroy() {
        detachEvents();
        $elem.empty();
        
        components = {};
        mouseTools = {};
        lastToolData = undefined;
    }
    
    /**
     * @function module:form-tools#destroy
     * @description Destroys the module.
     */
    this.destroy = destroy;
    
    // init the module
    $elem = $(options.elem);
    
    $elem.html(template({
        language: PCCViewer.Language.data
    }));
    viewer.parseIcons($elem);
    components = viewer.parseComponents($elem);
    
    createMouseTools();
    attachEvents();
    
    viewer.onReady.add(function() {
        // just in case the module has already been destroyed
        if (components.mousetools) {
            // set the pan and edit tool to on by default
            components.mousetools.value('AccusoftPanAndEdit', 'on');
        }
    });
}

/**
 * Creates the form tools UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new FormTools(viewer, options);
};
