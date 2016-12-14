/*global module, _, $, PCCViewer*/

var defaultFillColor = '#DCEBF8';
var defaultBorderColor = '#333333';
var defaultOpacity = 127;
var defaultBorderThickness = 1;

//var defaultFontColor = '#000000';
//var defaultFontName = 'Fira Sans';

var globalFontNameSetting = 'UseGlobalFontNameSetting';
var globalFontColorSetting = 'UseGlobalFontColorSetting';

var TRIANGLE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAZElEQVR42q3Myw2AMAwE0emA/k+UQgl0RIgPkawoH7B3Vnt9FLjri+p1HEoUS4nSUqH4FCh9WZRRGZRZUZRVEZRdhj5wyUAHn1LwK8rfdiiRVijRZiiZRijZehRFHkVVQ1Fm6Asoo6Y5ILuQ0wAAAABJRU5ErkJggg==';

var requiredImage = {
    dataUrl: TRIANGLE,
    id: 'required'
};

var requiredForKey = 'required-for';

/**
 * @module form-controller
 * @description
 * This module interfaces with `ViewerControl` in order to display
 * the fields being created, as well as update field positioning data.
 * It is in charge of translating between `FieldList` field objects
 * and `ViewerControl` mark objects whenever necessary.
 * 
 * @fires {@link module:event-store#event:ModifyState}
 * @fires {@link module:event-store#event:FormLoaded}
 * @fires {@link module:event-store#event:ModifyTemplateField}
 * @fires {@link module:event-store#event:ModifyMultipleTemplateFields}
 * @fires {@link module:event-store#event:DeselectAllTemplateFields}
 *
 * @listens {@link module:event-store#event:StateModified} for the "FieldList" state.
 * @listens {@link module:event-store#event:DisplayForm}
 * @listens {@link module:event-store#event:AlignFields}
 * @listens {@link module:event-store#event:DeleteFields}
 * @listens {@link module:event-store#event:DuplicateFields}
 * @listens {@link module:event-store#event:MatchSizeFields}
 * @listens {@link module:event-store#event:ModifyMultipleTemplateFields}
 * @listens {@link module:event-store#event:ModifyTemplateField}
 * @listens {@link module:event-store#event:FormLoaded}
 * @listens {@link module:event-store#event:FormCopied}
 * @listens {@link module:event-store#event:ModifyTemplateField}
 * @listens {@link module:event-store#event:SaveTemplate}
 * @listens {@link module:event-store#event:SaveTemplateCopy}
 *
 * @example
 * var FormController = require('form-controller.js');
 *
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myFormController = FormController(this);
 * }
 */
function FormController(viewer) {
    var isActive = true,
        isInProgress = false,
        requiredMarksForFields = {};

    function updateFieldPositions() {
        // Get the current field list state.
        var data = viewer.stateStore.getState('FieldList') || {};

        // Loop through all marks and update the sort index of the corresponding field.
        var marks = viewer.viewerControl.getAllMarks(),
            field;

        _.forEach(marks, function(mark) {
            field = data.fieldList[mark.getId()];

            if (!field) { return; }

            field.rectangle = mark.getBoundingRectangle();
        });

        return data;
    }

    function getBorderThickness(thickness, mark) {
        var pageData = viewer.stateStore.getState('PageData'),
            pageSize, borderThickness;

        if (pageData && pageData[mark.pageNumber]) {
            pageSize = Math.min(pageData[mark.pageNumber].width, pageData[mark.pageNumber].height) / 600;
            borderThickness = Math.round(thickness * pageSize);

            // Base the border thickness on the page size
            return (borderThickness <= 50 ? borderThickness : 50);
        } else {
            return thickness;
        }
    }

    function transformMarkRectangle(rectangle, originalPageData, newPageData) {
        var xRatio = newPageData.width / originalPageData.width,
            yRatio = newPageData.height / originalPageData.height;

        return {
            x: rectangle.x * xRatio,
            y: rectangle.y * yRatio,
            width: rectangle.width * xRatio,
            height: rectangle.height * yRatio
        };
    }

    function generateMarksFromData(dataStr) {
        var formData = dataStr,
            mark,
            fieldList = {},
            pageData = viewer.stateStore.getState('PageData') || {},
            groups = viewer.stateStore.getState('FieldList').groups || {},
            formRoles = viewer.stateStore.getState('FieldList').formRoles || {};

        _.forEach(formData, function(field) {
            var formRoleId;

            // create the mark object
            mark = viewer.viewerControl.addMark(field.pageNumber, PCCViewer.Mark.Type.RectangleAnnotation);

            if (pageData && pageData[field.pageNumber]) {
                mark.setRectangle(transformMarkRectangle(
                    field.rectangle,
                    field.pageData,
                    pageData[field.pageNumber]
                ));
            } else {
                mark.setOpacity(0);
                mark.setRectangle(field.rectangle);
            }

            field.markId = Number(mark.getId());
            fieldList[field.markId] = field;

            // Get the form role associated with the field or its group (if it exists)
            if (field.groupId) {
                formRoleId = groups[field.groupId] && groups[field.groupId].formRoleId;
            } else {
                formRoleId = field.formRoleId;
            }

            // set the field color based on the form role (if it exists)
            mark.setFillColor(formRoles[formRoleId] ? viewer.shadeColor(formRoles[formRoleId].fieldColor, 0.5) : defaultFillColor);

            // add some presets
            mark.setOpacity(defaultOpacity);
            mark.setBorderThickness(getBorderThickness(defaultBorderThickness, mark));
            mark.setBorderColor(defaultBorderColor);

            // add all of the metadata
            mark.setData('template', field.template);

            if (field.required && field.template !== 'CheckboxTemplate') {
                requiredMarksForFields[field.markId] = addRequiredFieldIndicator(field);
            }
        });

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                fieldList: fieldList
            }
        });

        var count = formData.length + _.keys(requiredMarksForFields).length;

        if (count > 0) {
            viewer.viewerControl.on('MarkChanged', function(ev) {
                if (ev.propertyName !== 'rectangle') { return; }

                count--;

                if (count === 0) {
                    viewer.eventStore.trigger('FormLoaded');
                }
            });
        } else {
            viewer.eventStore.trigger('FormLoaded');
        }
    }

    function registerKeyCombinations(){
        //register keyboard keys combinations
        viewer.eventStore.trigger('RegisterKeyCombinations', {
            state: 'KeyCombinations',
            stateValue: {
                keyCombinations: 'up',
                register: true
            }
        });

        viewer.eventStore.trigger('RegisterKeyCombinations', {
            state: 'KeyCombinations',
            stateValue: {
                keyCombinations: 'down',
                register: true
            }
        });

        viewer.eventStore.trigger('RegisterKeyCombinations', {
            state: 'KeyCombinations',
            stateValue: {
                keyCombinations: 'left',
                register: true
            }
        });

        viewer.eventStore.trigger('RegisterKeyCombinations', {
            state: 'KeyCombinations',
            stateValue: {
                keyCombinations: 'right',
                register: true
            }
        });
    }

    function updateMarksOnPageData(pageNumber, newPageData) {
        var data = viewer.stateStore.getState('FieldList'),
            list = _.filter(data.fieldList, function(field){
                return field.pageNumber === pageNumber;
            }),
            mark;

        _.forEach(list, function(field) {
            mark = viewer.viewerControl.getMarkById(field.markId);

            var rect = transformMarkRectangle(
                field.rectangle,
                field.pageData,
                newPageData
            );

            mark.setRectangle(rect);
            mark.setOpacity(defaultOpacity);

            if (field.required && field.template !== 'CheckboxTemplate') {
                requiredMarksForFields[field.markId] = addRequiredFieldIndicator(field);
            }
        });
    }

    function updateSelectionOnMarkCreation(ev) {
        var data = viewer.stateStore.getState('FieldSelection') || {},
            mark = ev.mark,
            allMarksCreated;

        // Only select the mark if it is created using the mouse, not if it is loaded.
        // The clientX and clientY event args are only defined when a mark is added using the mouse.
        if (ev.clientX !== undefined) {
            viewer.viewerControl.deselectAllMarks();
            viewer.viewerControl.selectMarks([mark]);
        } else if (data.fieldSelection !== undefined && data.fieldSelection[mark.getId()] !== undefined) {
            data.fieldSelection[mark.getId()].isCreated = true;

            allMarksCreated = _.every(data.fieldSelection, function (selectedMark, index) {
                return !!data.fieldSelection[selectedMark.getId()].isCreated;
            });

            // Only select the marks after all marks have been created
            if (allMarksCreated) {
                viewer.viewerControl.deselectAllMarks();
                viewer.viewerControl.selectMarks(_.values(data.fieldSelection));

                // Remove field selections from state store
                viewer.eventStore.trigger('ModifyState', {
                    state: 'FieldSelection',
                    stateValue: null,
                    operation: 'replace'
                });
            }
        }
    }

    function updateFieldColors(fieldList) {
        var mark, fieldRole;

        _.each(fieldList.fieldList, function(field) {
            mark = viewer.viewerControl.getMarkById(field.markId);

            if (!_.isEmpty(fieldList.formRoles)) {

                if (field.groupId && field.groupId !== 'none') {
                    fieldRole = fieldList.formRoles[fieldList.groups[field.groupId].formRoleId];
                } else {
                    fieldRole = fieldList.formRoles[field.formRoleId];
                }
            }

            mark.setFillColor(fieldRole ? viewer.shadeColor(fieldRole.fieldColor, 0.5) : defaultFillColor);
        });
    }

    function updateRequiredIndicators(fields) {
        var selectedMarks = viewer.viewerControl.getSelectedMarks();

        function isSelected(markId) {
            return _.find(selectedMarks, function (mark) {
                return mark.getId() === markId.toString();
            });
        }

        // Add a required mark to all fields that need it and save the required mark id
        _.each(fields, function(field) {

            if (!field.required && requiredMarksForFields[field.markId]) {
                removeRequiredFieldIndicator(field);
            }

            else if (field.required && !requiredMarksForFields[field.markId] && !isSelected(field.markId) && field.template !== 'CheckboxTemplate') {
                requiredMarksForFields[field.markId] = addRequiredFieldIndicator(field);
            }
        });
    }

    function addRequiredFieldIndicator(field) {
        var fieldMark = viewer.viewerControl.getMarkById(field.markId),
            pageData = viewer.stateStore.getState('PageData'),
            page = (pageData && pageData[field.pageNumber]) || {
                // assume standard SVG size if we do not have a page size yet
                // this will be updated when we get the page size
                height: 792,
                width: 612
            },
            smallestPageSide = Math.min(page.width, page.height),
            requiredMarkId = requiredMarksForFields[field.markId],
            requiredMark;

        if (!fieldMark) {
            return false;
        }

        // Grab any previously added indicators
        if (requiredMarkId) {
            requiredMark = viewer.viewerControl.getMarkById(requiredMarkId);
        } else {
            requiredMark = viewer.viewerControl.addMark(fieldMark.getPageNumber(), PCCViewer.Mark.Type.ImageStampAnnotation);
            requiredMark.setImage(requiredImage);
            requiredMark.setInteractionMode(PCCViewer.Mark.InteractionMode.SelectionDisabled);
        }

        var rectangle = fieldMark.getRectangle(),
            smallestRectSide = Math.min(rectangle.width, rectangle.height);

        // add a bit of room around the mark
        var padding = getBorderThickness(0.5, fieldMark);

        // assume that the mark will be 2% of the total page size
        var dim = smallestPageSide * 0.02;
        // do not size it bigger than the 1/2 of the mark rectangle
        dim = Math.min(dim, smallestRectSide * 0.5);

        requiredMark.setRectangle({
            height: dim,
            width: dim,
            x: rectangle.x + rectangle.width - dim - padding,
            y: rectangle.y + padding
        });

        // link the marks together for future reference
        requiredMark.setData(requiredForKey, field.markId.toString());

        return Number(requiredMark.getId());
    }

    function removeRequiredFieldIndicator(field) {
        var mark = viewer.viewerControl.getMarkById(requiredMarksForFields[field.markId]);

        if (mark) {
            viewer.viewerControl.deleteMarks(mark);
        }

        delete requiredMarksForFields[field.markId];
    }

    function onDisplayForm(ev, data) {
        viewer.onPageCountReady.add(function(){
            generateMarksFromData(data.formData);
        });
    }

    function onAlignFields(ev, data) {
        var rectangle = viewer.viewerControl.getMarkById(data.markIds[0]).getRectangle(),
            newValues = {};

        // Determine what to do with the selected marks based on the given alignment
        switch (data.alignment) {
            case 'vertical-top':
                newValues.y = rectangle.y;
                break;
            case 'vertical-center':
                newValues.y = rectangle.y + rectangle.height / 2;
                newValues.center = true;
                break;
            case 'vertical-bottom':
                newValues.y = rectangle.y + rectangle.height;
                newValues.max = true;
                break;
            case 'horizontal-left':
                newValues.x = rectangle.x;
                break;
            case 'horizontal-center':
                newValues.x = rectangle.x + rectangle.width / 2;
                newValues.center = true;
                break;
            case 'horizontal-right':
                newValues.x = rectangle.x + rectangle.width;
                newValues.max = true;
                break;
        }

        // Loop through the current selected marks and align each one according to the new values set above
        _.each(data.markIds, function (markId) {
            var mark = viewer.viewerControl.getMarkById(markId);
            var values = _.extend(mark.getRectangle(), newValues);

            if (newValues.x) {
                values.x -= (newValues.center) ? values.width / 2 : (newValues.max) ? values.width : 0;
            }

            if (newValues.y) {
                values.y -= (newValues.center) ? values.height / 2 : (newValues.max) ? values.height : 0;
            }

            mark.setRectangle(values);
        });
    }

    function onDeleteFields(ev, data) {
        var marks = _.map(data.markIds, function (markId) {
            return viewer.viewerControl.getMarkById(markId);
        });

        viewer.viewerControl.deleteMarks(marks);
    }

    function onDuplicateFields(ev, data) {
        var marks = _.map(data.markIds, function (markId) {
            return viewer.viewerControl.getMarkById(markId);
        });

        var list = viewer.stateStore.getState('FieldList') || {},
            duplicationOffset = 20,
            duplicateMarks = {};

        function getUniqueDisplayName(displayName) {
            var copyNameAppend = PCCViewer.Language.data.copyNameAppend,
                displayNameRegex = new RegExp(copyNameAppend + '\\s*([0-9]*)?', 'g');

            // Add a copy number to the duplicate display name starting at 2
            // If the display name already contains a copy number, increment it by 1
            var newDisplayName = displayName.replace(displayNameRegex, function (match, capture) {
                var copyNumber = (Number(capture) || 1) + 1;
                return copyNameAppend + ' ' + copyNumber;
            });

            if (displayName) {
                return newDisplayName !== displayName ? newDisplayName : displayName + copyNameAppend;
            } else {
                return displayName;
            }
        }

        _.each(marks, function (mark) {
            var pageData = viewer.stateStore.getState('PageData'),
                duplicateMark = viewer.viewerControl.addMark(mark.getPageNumber(), mark.getType()),
                duplicateMarkId = duplicateMark.getId(),
                markId = mark.getId(),
                rectangle = mark.getRectangle(),
                duplicateMarkProperties;

            // If the new rectangle is close to the edge, keep it within the horizontal page bounds
            if (rectangle.x + rectangle.width + duplicationOffset >= pageData[mark.getPageNumber()].width) {
                rectangle.x -= duplicationOffset;
            } else {
                rectangle.x += duplicationOffset;
            }

            // If the new rectangle is close to the edge, keep it within the vertical page bounds
            if (rectangle.y + rectangle.height + duplicationOffset >= pageData[mark.getPageNumber()].height) {
                rectangle.y -= duplicationOffset;
            } else {
                rectangle.y += duplicationOffset;
            }

            duplicateMark.setRectangle(rectangle);

            // Set field data
            duplicateMark.setData('template', mark.getData('template'));
            duplicateMark.setBorderColor(mark.getBorderColor());
            duplicateMark.setBorderThickness(mark.getBorderThickness());
            duplicateMark.setFillColor(mark.getFillColor());
            duplicateMark.setOpacity(mark.getOpacity());

            // Duplicate the field list properties
            duplicateMarkProperties = {
                markId: duplicateMarkId,
            };

            if (list.fieldList[markId].displayName) {
                duplicateMarkProperties.displayName = getUniqueDisplayName(list.fieldList[markId].displayName);
            }

            list.fieldList[duplicateMarkId] = _.extend({}, list.fieldList[markId], duplicateMarkProperties);

            // Remove the fieldId so a unique one can be created later
            delete list.fieldList[duplicateMarkId].fieldId;

            // Add the mark to an object so we can select it later
            duplicateMarks[duplicateMarkId] = duplicateMark;
        });

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                fieldList: list.fieldList
            }
        });

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldSelection',
            stateValue: {
                fieldSelection: duplicateMarks
            }
        });
    }

    function onMatchSizeFields(ev, data) {
        var rectangle = viewer.viewerControl.getMarkById(data.markIds[0]).getRectangle(),
            newValues = {};

        // Determine what to do with the selected marks based on the given orientation
        switch (data.direction) {
            case 'vertical':
                newValues.height = rectangle.height;
                break;
            case 'horizontal':
                newValues.width = rectangle.width;
                break;
        }

        // Loop through the current selected marks and resize each one according to the new values set above
        _.each(data.markIds, function (markId) {
            var mark = viewer.viewerControl.getMarkById(markId);
            var values = _.extend(mark.getRectangle(), newValues);

            mark.setRectangle(values);
        });
    }

    function onMarkCreated(ev) {
        // Get the current field list data and add a new field to it.
        var data = viewer.stateStore.getState('FieldList') || {};

        if (data.fieldList === undefined) {
            data.fieldList = {};
        }

        var markTemplate = ev.mark.getData('template');

        // If the mark doesn't have a template, it's probably not a field
        if (!markTemplate) { return; }

        // Make sure the field gets a unique ID.
        var i = 1;
        var uniqueId = 1;
        var fieldList = data.fieldList;

        var existingField = fieldList[ev.mark.getId()];

        // if the field already exists, then this is a form load
        // skip calculating any new data, as it was already loaded
        // from the form definition
        if (existingField && existingField.fieldId) { return; }

        function sortNumber(a,b) {
            return a - b;
        }

        var templateFields = $.map(fieldList, function(value) {
            if (value.template === markTemplate && value.fieldId) {
                return Number(value.fieldId.replace(/[^0-9.]/g, ''));
            }
        }).sort(sortNumber);

        if (templateFields.length > 0) {
            // Check if there are any available IDs between 1 and length, if so, use it to make a unique ID.
            var foundAvailableId = false;
            for (i = 0; i < templateFields.length; i++) {
                if (templateFields[i] !== i + 1) {
                    uniqueId = i + 1;
                    foundAvailableId = true;
                    break;
                }
            }

            // Append the templateFields length + 1 as the ID if each item in the templateFields has ID 1 through length.
            if (foundAvailableId === false) {
                uniqueId = templateFields.length + 1;
            }
        }

        // calculate a new sort index for this mark
        var sortIndices = _.map(fieldList, function(field){
            return field.sortIndex;
        });
        var highestSortIndex = sortIndices.length ? Math.max.apply(Math, sortIndices) : 0;

        var markData = {
            markId: Number(ev.mark.getId()),
            fieldId: markTemplate.replace(/template/gi, '') + uniqueId,
            template: markTemplate,
            rectangle: ev.mark.getBoundingRectangle(),
            pageNumber: ev.mark.getPageNumber()
        };

        // Set the default role
        if (!_.isEmpty(data.formRoles)) {

            var defaultRole = _.min(data.formRoles, function(role) {
                return role.sortIndex;
            });

            markData.formRoleId = defaultRole.formRoleId;
        }

        switch (markData.template) {
            case 'TextTemplate':
            case 'DateTemplate':
                if (existingField === undefined || existingField.fontColor === undefined) {
                    markData.fontColor = globalFontColorSetting;
                }
                else {
                    markData.fontColor = existingField.fontColor;
                }

                if (existingField === undefined || existingField.fontName === undefined) {
                    markData.fontName = globalFontNameSetting;
                }
                else {
                    markData.fontName = existingField.fontName;
                }
        }

        fieldList[ev.mark.getId()] = _.extend(markData, existingField);

        // Add sorting to the mark
        fieldList[ev.mark.getId()].sortIndex = highestSortIndex + 1;

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: data
        });

        // Update the selection after the mark has been created
        updateSelectionOnMarkCreation(ev);
    }

    var onDataChangeThrottled = viewer.throttle(function onDataChange(ev){
        var newData = updateFieldPositions();

        var data = viewer.stateStore.getState('FieldList') || {};
        data.fieldList = newData.fieldList;

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: data
        });
    }, 300);

    var onMarkDataChange = function(ev) {
        if (ev.propertyName !== 'rectangle') { return; }

        onDataChangeThrottled(ev);
    };

    function onMarkRemoved(ev) {
        var fieldList = {};

        fieldList[ev.mark.getId()] = undefined;

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                fieldList: fieldList
            }
        });
    }

    function onPageClick(ev) {

        // If the required indicator is clicked, select the required field
        if (ev.mark && ev.mark.getData(requiredForKey)) {
            viewer.viewerControl.selectMarks(viewer.viewerControl.getMarkById(ev.mark.getData(requiredForKey)));
        }

        // Remove focus when clicking on a page so we can scroll with arrow keys
        if (ev.targetType === 'page') {

            // In IE9 & IE10, blurring the body element will switch to a different application
            if (document.activeElement.nodeName.toLowerCase() !== 'body') {
                document.activeElement.blur();
            }

            // Focus the Page List wrapper which scrolls the page
            $(ev.originalEvent.target).closest('.pccPageListContainerWrapper').focus();
        }
    }

    function onMarkSelectionChanged() {
        var selectedMarks = viewer.viewerControl.getSelectedMarks();
        var fieldList = viewer.stateStore.getState('FieldList').fieldList;

        if (selectedMarks.length > 1) {
            var markIds = _.map(selectedMarks, function (mark) {
                return Number(mark.getId());
            });

            viewer.eventStore.trigger('ModifyMultipleTemplateFields', {
                markIds: markIds
            });
        } else if (selectedMarks.length === 1) {
            var markId = selectedMarks[0].getId();
            viewer.eventStore.trigger('ModifyTemplateField', {
                markId: markId
            });
        } else {
            viewer.eventStore.trigger('DeselectAllTemplateFields');
        }

        // Make sure all required indicators exist
        updateRequiredIndicators(fieldList);

        // Remove the required indicator from the selected fields
        if (selectedMarks.length > 0) {

            _.each(selectedMarks, function (mark) {
                if (requiredMarksForFields[mark.getId()]) {
                    removeRequiredFieldIndicator(fieldList[Number(mark.getId())]);
                }
            });
        }
    }

    function onModifyTemplateField(ev, data) {
        // Select the mark if it is not already selected.
        var selectedMarks = viewer.viewerControl.getSelectedMarks();

        if (!(selectedMarks.length === 1 && selectedMarks[0].getId() === data.markId.toString())) {
            var mark = viewer.viewerControl.getMarkById(data.markId);
            
            // Scroll to the mark.
            viewer.viewerControl.scrollToAsync(mark).then(function () {
                // Select the mark.
                viewer.viewerControl.deselectAllMarks();
                viewer.viewerControl.selectMarks([mark]);
            });
        }
    }

    function onModifyMultipleTemplateFields(ev, data) {
        // Select the marks if they are not already selected.
        var selectedMarks = viewer.viewerControl.getSelectedMarks();
        var alreadySelected = _.find(selectedMarks, function (obj, index) {
            return Number(obj.getId()) === data.markIds[index];
        });

        if (!alreadySelected) {
            viewer.viewerControl.deselectAllMarks();
            viewer.viewerControl.selectMarks(data.selectedMarks);
        }
    }

    function updatePageData(pageNumber, data) {
        if (!isActive) { return; }

        var value = {};
        value[pageNumber] = data;

        viewer.eventStore.trigger('ModifyState', {
            state: 'PageData',
            stateValue: value
        });

        updateMarksOnPageData(pageNumber, data);
    }

    function onPageDisplayed(ev) {
        var pageData = viewer.stateStore.getState('PageData');

        if (pageData && pageData[ev.pageNumber]) { return; }

        viewer.viewerControl.requestPageAttributes(ev.pageNumber)
            .then(function success(attr) {
                updatePageData(ev.pageNumber, attr);
            });
    }

    function onBeforeUnload() {

        if (isInProgress) {
            return PCCViewer.Language.data.beforeUnload;
        }
    }

    function onTemplateSaved() {
        isInProgress = false;
    }

    function onFormLoaded() {
        isInProgress = false;
    }

    function onStateModified(ev, data) {
        if (data.state === 'FieldList' && data.stateValue.fieldList && _.keys(data.stateValue.fieldList).length) {
            isInProgress = true;
            updateRequiredIndicators(data.stateValue.fieldList);
            updateFieldColors(data.stateValue);
        }
    }

    function onKeyCombinationsTriggered(ev, data) {

        // Nudge selected marks when an arrow key is pressed
        switch (data.stateValue.keyCombinations) {
            case "up":
                nudgeSelectedMarks({ y: -1 });
                break;
            case "down":
                nudgeSelectedMarks({ y: 1 });
                break;
            case "left":
                nudgeSelectedMarks({ x: -1 });
                break;
            case "right":
                nudgeSelectedMarks({ x: 1 });
                break;
        }
    }

    function nudgeSelectedMarks(direction) {
        var selectedMarks = viewer.viewerControl.getSelectedMarks(),
            pageData = viewer.stateStore.getState('PageData');

        if (selectedMarks.length) {
            var nudgeAmount = 0.5,
                rectangle, pageW, pageH;

            _.each(selectedMarks, function(mark) {
                rectangle = mark.getRectangle();
                pageW = pageData[mark.getPageNumber()].width;
                pageH = pageData[mark.getPageNumber()].height;

                // Horizontal boundaries
                if (rectangle.x <= 0) {
                    rectangle.x = 0;
                }
                else if (rectangle.x >= pageW - rectangle.width) {
                    rectangle.x = pageW - rectangle.width;
                }
                else {
                    rectangle.x += direction.x ? (direction.x * nudgeAmount) : 0;
                }

                // Vertical boundaries
                if (rectangle.y <= 0) {
                    rectangle.y = 0;
                }
                else if (rectangle.y >= pageH - rectangle.height) {
                    rectangle.y = pageH - rectangle.height;
                }
                else {
                    rectangle.y += direction.y ? (direction.y * nudgeAmount) : 0;
                }

                mark.setRectangle(rectangle);
            });
        }
    }

    function attachEvents() {
        viewer.viewerControl.on(PCCViewer.EventType.MarkCreated, onMarkCreated);
        viewer.viewerControl.on(PCCViewer.EventType.MarkChanged, onMarkDataChange);
        viewer.viewerControl.on(PCCViewer.EventType.MarkRemoved, onMarkRemoved);
        viewer.viewerControl.on(PCCViewer.EventType.PageDisplayed, onPageDisplayed);

        viewer.eventStore.on('DisplayForm', onDisplayForm);
        viewer.eventStore.on('AlignFields', onAlignFields);
        viewer.eventStore.on('DeleteFields', onDeleteFields);
        viewer.eventStore.on('DuplicateFields', onDuplicateFields);
        viewer.eventStore.on('MatchSizeFields', onMatchSizeFields);

        viewer.viewerControl.on(PCCViewer.EventType.Click, onPageClick);
        viewer.viewerControl.on(PCCViewer.EventType.MarkSelectionChanged, onMarkSelectionChanged);
        viewer.eventStore.on('ModifyTemplateField', onModifyTemplateField);
        viewer.eventStore.on('ModifyMultipleTemplateFields', onModifyMultipleTemplateFields);

        viewer.onBeforeUnload.add(onBeforeUnload);
        viewer.eventStore.on('FormLoaded', onFormLoaded);
        viewer.eventStore.on('FormCopied', onFormLoaded);
        viewer.eventStore.on('TemplateSaved', onTemplateSaved);
        viewer.eventStore.on('StateModified', onStateModified);

        viewer.eventStore.on('KeyCombinationsTriggered', onKeyCombinationsTriggered);
    }

    function detachEvents() {
        viewer.viewerControl.off(PCCViewer.EventType.MarkCreated, onMarkCreated);
        viewer.viewerControl.off(PCCViewer.EventType.MarkChanged, onMarkDataChange);
        viewer.viewerControl.off(PCCViewer.EventType.MarkRemoved, onMarkRemoved);
        viewer.viewerControl.off(PCCViewer.EventType.PageDisplayed, onPageDisplayed);

        viewer.eventStore.off('DisplayForm', onDisplayForm);
        viewer.eventStore.off('AlignFields', onAlignFields);
        viewer.eventStore.off('DeleteFields', onDeleteFields);
        viewer.eventStore.off('DuplicateFields', onDuplicateFields);
        viewer.eventStore.off('MatchSizeFields', onMatchSizeFields);

        viewer.viewerControl.off(PCCViewer.EventType.Click, onPageClick);
        viewer.viewerControl.off(PCCViewer.EventType.MarkSelectionChanged, onMarkSelectionChanged);
        viewer.eventStore.off('ModifyTemplateField', onModifyTemplateField);
        viewer.eventStore.off('ModifyMultipleTemplateFields', onModifyMultipleTemplateFields);

        viewer.onBeforeUnload.remove(onBeforeUnload);
        viewer.eventStore.off('FormLoaded', onFormLoaded);
        viewer.eventStore.off('FormCopied', onFormLoaded);
        viewer.eventStore.off('TemplateSaved', onTemplateSaved);
        viewer.eventStore.off('StateModified', onStateModified);

        viewer.eventStore.off('KeyCombinationsTriggered', onKeyCombinationsTriggered);
    }

    /**
     * @function module:form-controller#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        isActive = false;
        isInProgress = false;
        detachEvents();
    };

    attachEvents();
    registerKeyCombinations();
}

/**
 * Creates the form controller module.
 * @param {Core} viewer The core viewer to which the module will attach.
 */
module.exports = function init(viewerObj) {
    return new FormController(viewerObj);
};
