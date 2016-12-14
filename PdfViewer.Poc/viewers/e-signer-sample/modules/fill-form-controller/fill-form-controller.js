/* global module, _, $, PCCViewer */

var defaultFillColor = '#DCEBF8';
var defaultBorderColor = '#333333';
var defaultOpacity = 127;
var defaultBorderThickness = 1;
var focusBorderThickness = 3;
var focusBorderColor = '#3B8BC4';
var errorBorderColor = '#eb4d5c';

var defaultFontColor = '#000000';
var defaultFontName = 'Fira Sans';
var defaultFontSize = 8;

var globalFontNameSetting = 'UseGlobalFontNameSetting';
var globalFontColorSetting = 'UseGlobalFontColorSetting';
var globalFontSizeSetting = 'UseGlobalFontSizeSetting';

var emptyPath = 'M0,0';

var STAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAnFBMVEUAAADyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISHyISGYRQLyAAAAM3RSTlMA7vS5noXo27KoaWVSO39fTUcxKA3f18ejlZCNdnEY+c2tmpiKfGxcHxHTS0E3HAgGv1njw59/AAABlUlEQVRYw7XW61aqUBQF4MlFQREB0VPerbSO3Wu+/7tl1nAHwr7W95/BZE/GWht/bDzfjuFiQkZwsOTBEvZ8HviwdsujW9jyeOTZB/jWtw/gFKHPk8Q2gFOEhHSL0OUPXRjLWJHZBRAmMHTHmgHMRKyJYGTAM7npHHCKkLPBA7SMR++7qccG3s0uS1dotS8fFtfBvU+pdfTW69w9Pb9W3pkn8yDyaaK76Q2zogSwin3a+5diQyce6AghnfSAgA4CHMS0FuOoR0tX+HZp+/0nIS1c4ocpjYWomNHQNWpmls8LHRqYosGO2uZotKCmrfRGo9aRLmS1ISSWdu8XCioNIFh1eQOZgEobxU5WWo/R7j81lGiXUkOOP/wPQr1B2O5CaxvZlSD4L3YlCCP5xUYtQZvhedxFMmHdDGfa9sN8BbwuPFZd6ZYQljjad9Z6Nbz4lb0zwslzdWav0OyJQjyqFRRSKJTX2+ARZ0pxQn3FNLkYoFEaK2bKV8p7ycx6DKQ1pJ8nnEGq+GwqRYt8OtxDpb8t8Js+ANHFeUEfc3znAAAAAElFTkSuQmCC';
var CHECK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAATZJREFUeNrsm9ENgzAMRBmhozBCR2CEbNwROkJHoCCBVFVCEBInPt+d5N+S9z4Qsa7DoCiKoihRMi0zssKv4PMyH0YJ4wY+M0r4h6eScAT/O4kZPqyEHPhwEu7Ah5FQAg8voQY8rISa8HASLOD3mZjh3X8oCV7wDuHXl8aDFT5tP/QykgABPxtJgIKvLQESvpYEaPhSCSHg93lnPjAUfO6DQ8JfPUBo+LODUMAfHcj9563lwdxfbKwPCHGrs5QAc6VFkWB6n/cuockyw6uEppscbxK6rLG8SOi6w+stwcUCs5cEV9vb1hJcrq5bSXC9t7eWANHrsZIAVWqqLQGy0VVLAnSdrVRCiC7fXQmhioy5EkK2OK9KCF1hPZNA0d99MsMfrdkpO/yJGX4P9V9YFEVRFO/5CjAAtQiwHVNozuMAAAAASUVORK5CYII=';
var BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

var checkboxImage = {
    dataUrl: CHECK,
    id: 'checkmark'
};
var requiredImage = {
    dataUrl: STAR,
    id: 'required'
};
var blankImage = {
    dataUrl: BLANK,
    id: 'blank'
};

var targetForKey = 'target-for';
var requiredForKey = 'required-for';
var templateKey = 'template';

function disableMarkInteraction(mark) {
    mark.setInteractionMode(PCCViewer.Mark.InteractionMode.SelectionDisabled);
}

/**
 * @module fill-form-controller
 * @description Controls the form. It handles various tasks such as creation of marks, how marks are visually
 * represented, keyboard controls, and field focus management.
 * @fires {@link module:event-store#ModifyState}
 * @fires {@link module:event-store#FormLoaded}
 * @fires {@link module:event-store#RegisterKeyCombinations}
 * @fires {@link module:event-store#CreateDate}
 * @fires {@link module:event-store#ManageSignatures}
 * @fires {@link module:event-store#CreateSignature}
 * @fires {@link module:event-store#Notify}
 * @listens {@link module:event-store#event:DisplayForm}
 * @listens {@link module:event-store#event:StateModified}
 * @listens {@link module:event-store#event:FocusChecklistItem}
 * @listens {@link module:event-store#event:KeyCombinationsTriggered}
 * @listens {@link module:event-store#event:FormLoaded}
 * @listens {@link module:event-store#event:BurnForm}
 * @example
 * var FillFormController = require('fill-form-controller.js');
 *
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myFillFormController = FillFormController(this);
 * }
 */
function FillFormController(viewer, options) {
    var isActive = true,
        isInProgress = false,
        callbackQueue = {};

    function onCallback(ev, data) {
        var callbackName = ev.type;
        var func = callbackQueue[callbackName];

        if (func && typeof func === 'function') {
            func(ev, data);
        }

        callbackQueue[callbackName] = undefined;
    }

    function generateFieldList() {
        var state = viewer.stateStore.getState('FieldList');
        var data = { fieldList: {} };
        
        if (!state) { state = data; }
        
        var marks = viewer.viewerControl.getAllMarks(),
            counts = {};

        _.forEach(marks, function(mark){
            var markId = Number(mark.getId());
            var template = mark.getData(templateKey);
            var targetFor = mark.getData(targetForKey);
            var requiredFor = mark.getData(requiredForKey);
            var field;

            // if this is not a template or a target, ignore it
            if (template) {
                // get an existing field or create a new one
                field = data.fieldList[markId] || {};

                // make sure marks have all data they need
                var number = counts[template] ? counts[template] + 1 : 1;
                counts[template] = number;

                mark.setData('sortIndex', viewer.viewerControl.getCharacterIndex(mark) + '');

                data.fieldList[markId] = _.extend(field, {
                    template: template,
                    rectangle: mark.getBoundingRectangle()
                });
            } else if (targetFor) {
                field = data.fieldList[targetFor] || {};
                var isComplete;

                switch (field.template) {
                    case 'SignatureTemplate':
                    case 'InitialsTemplate':
                        if (mark.getType() === PCCViewer.Mark.Type.FreehandSignature) {
                            isComplete = mark.getPath() !== emptyPath;
                        } else if (mark.getType() === PCCViewer.Mark.Type.TextSignature) {
                            isComplete = !!mark.getText().length;
                        } else {
                            isComplete = false;
                        }
                        break;
                    case 'TextTemplate':
                        var text = mark.getText();
                        var stateField = state.fieldList[targetFor];
                        isComplete = (text.length > 0);
                        
                        if (stateField && stateField.characterLimit && text.length > stateField.characterLimit) {
                            field.isInvalid = true;
                            isComplete = false;
                        } else {
                            field.isInvalid = false;
                        }
                        
                        break;
                    case 'DateTemplate':
                        isComplete = !!mark.getText().length;
                        break;
                    case 'CheckboxTemplate':
                        isComplete = true;
                        break;
                }

                field.isComplete = isComplete || false;

                data.fieldList[targetFor] = field;
            } else if (requiredFor) {
                field = data.fieldList[requiredFor] || {};
                field.requiredId = markId;

                data.fieldList[requiredFor] = field;
            }
        });

        return data;
    }

    function onStateModified(ev, data) {
        if (data.state === 'FieldList') {

            // update required field token
            _.forEach(data.stateValue.fieldList, function (field) {
                // always check if a field is invalid
                if (field.isInvalid) {
                    markFieldInvalid(field);
                } else {
                    unmarkFieldInvalid(field);
                }
                
                // check if a field is required in order to do the rest of the work
                if (!field.required || !field.requiredId) {
                    return;
                }

                var requiredMark = viewer.viewerControl.getMarkById(field.requiredId);
                if (!requiredMark) {
                    return;
                }

                if (field.isComplete) {
                    completeRequiredMark(field, requiredMark);
                } else if (!field.isComplete) {
                    uncompleteRequiredMark(field, requiredMark);
                }
            });
        }
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

    // From form data, create the visual indicators that display where
    // fields exist on a document.
    function generateMarksFromData(dataStr) {
        var formData = dataStr,
            mark,
            fieldList = {},
            pageData = viewer.stateStore.getState('PageData'),
            globalSettings = viewer.stateStore.getState('GlobalSettings');

        _.forEach(formData, function (field) {

            if (field.template === 'TextTemplate' || field.template === 'DateTemplate') {
                if (field.fontColor === globalFontColorSetting) {
                    if (globalSettings && globalSettings.fontColor !== undefined) {
                        field.fontColor = globalSettings.fontColor;
                    }
                    else {
                        field.fontColor = defaultFontColor;
                    }
                }
                
                if (field.fontName === globalFontNameSetting) {
                    if (globalSettings && globalSettings.fontName !== undefined) {
                        field.fontName = globalSettings.fontName;
                    }
                    else {
                        field.fontName = defaultFontName;
                    }
                }

                if(field.fontSize === globalFontSizeSetting && field.template === 'TextTemplate'){
                    if (globalSettings && globalSettings.fontSize !== undefined) {
                        field.fontSize = globalSettings.fontSize;
                    }
                    else {
                        field.fontSize = defaultFontSize;
                    }
                }
            }

            // create the mark object
            mark = viewer.viewerControl.addMark(field.pageNumber, PCCViewer.Mark.Type.RectangleAnnotation);

            field.markId = Number(mark.getId());
            fieldList[field.markId] = field;

            if (pageData && pageData[field.pageNumber]) {
                mark.setRectangle(transformMarkRectangle(
                    field.rectangle,
                    field.pageData,
                    pageData[field.pageNumber]
                ));

                if (field.required && field.template !== 'CheckboxTemplate') {
                    field.requiredId = addRequiredFieldIndicator(field, mark);
                }
            } else {
                mark.setOpacity(0);
                mark.setRectangle(field.rectangle);
            }

            // add some presets
            mark.setFillColor(defaultFillColor);
            mark.setOpacity(defaultOpacity);
            mark.setBorderThickness(getBorderThickness(defaultBorderThickness, mark));
            mark.setBorderColor(defaultBorderColor);

            // prevent interaction with the mark
            disableMarkInteraction(mark);

            // add all of the metadata
            mark.setData(templateKey, field.template);

            field.isComplete = false;
        });

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: {
                fieldList: fieldList
            }
        });

        var count = formData.length;
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

        //register keyboard keys combinations
        viewer.eventStore.trigger('RegisterKeyCombinations', {
            state: 'KeyCombinations',
            stateValue: {
                keyCombinations: 'tab',
                register: true
            }
        });
        viewer.eventStore.trigger('RegisterKeyCombinations', {
            state: 'KeyCombinations',
            stateValue: {
                keyCombinations: 'shift+tab',
                register: true
            }
        });
        viewer.eventStore.trigger('RegisterKeyCombinations', {
            state: 'KeyCombinations',
            stateValue: {
                keyCombinations: 'return',
                register: true
            }
        });
        viewer.eventStore.trigger('RegisterKeyCombinations', {
            state: 'KeyCombinations',
            stateValue: {
                keyCombinations: 'space',
                register: true
            }
        });
    }

    function addRequiredFieldIndicator(field, fieldMark) {
        var pageData = viewer.stateStore.getState('PageData'),
            page = pageData[field.pageNumber] || {
                // assume standard SVG size if we do not have a page size yet
                // this will be updated when we get the page size
                height: 792,
                width: 612
            },
            smallestPageSide = Math.min(page.width, page.height);

        var rectangle = fieldMark.getRectangle(),
            smallestRectSide = Math.min(rectangle.width, rectangle.height);

        // add a bit of room around the mark
        var padding = getBorderThickness(1.5, fieldMark);

        // assume that the mark will be 2% of the total page size
        var dim = smallestPageSide * 0.02;
        // do not size it bigger than the 2/3 of the mark rectangle
        dim = Math.min(dim, smallestRectSide * 0.66);

        var requiredMark = viewer.viewerControl.addMark(fieldMark.getPageNumber(), PCCViewer.Mark.Type.ImageStampAnnotation);
        requiredMark.setImage(requiredImage);
        disableMarkInteraction(requiredMark);

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

    function onDisplayForm(ev, data) {

        // Only generate form fields for the specified role
        if (viewer.options.formRoleId) {
            data.formData = _.pick(data.formData, function(field) {
                if (field.groupId && data.groups[field.groupId]) {
                    return data.groups[field.groupId].formRoleId === viewer.options.formRoleId;
                } else {
                    return field.formRoleId === viewer.options.formRoleId;
                }
            });
        }

        viewer.onPageCountReady.add(function(){
            generateMarksFromData(data.formData);
        });
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
                addRequiredFieldIndicator(field, mark);
            }
        });
    }

    function createTargetDate(field, dateData, existingTargetMark) {
        var targetMark;

        if (existingTargetMark) {
            targetMark = existingTargetMark;
        } else {
            targetMark = viewer.viewerControl.addMark(field.pageNumber, PCCViewer.Mark.Type.TextInputSignature);
            targetMark.setRectangle(field.rectangle);

            if (field.fontColor) { targetMark.setFontColor(field.fontColor); }
            if (field.fontName)  { targetMark.setFontName(field.fontName); }

            setTargetMark(field, targetMark);
        }

        targetMark.setText(dateData);
    }

    function createDateAsync(field, existingTargetMark) {
        // create a new signature
        var callbackName = Math.random().toString().replace(/\./g, '');
        callbackQueue[callbackName] = function(ev, data) {
            if (data.status === 'success' && data.data) {
                createTargetDate(field, data.data, existingTargetMark);
            }
        };
        viewer.eventStore.on(callbackName, onCallback);

        var mark = viewer.viewerControl.getMarkById(field.markId),
            rectangle = mark.getRectangle();

        // convert the rectangle to 2 points (top-left and lower-right)
        var points = [{
            x: rectangle.x,
            y: rectangle.y
        }, {
            x: rectangle.x + rectangle.width,
            y: rectangle.y + rectangle.height
        }];

        var windowPoints = viewer.viewerControl.convertPageToWindowCoordinates(field.pageNumber, points);
        // convert the two points back to a rectangle
        var windowRectangle = {
            x: windowPoints[0].clientX,
            y: windowPoints[0].clientY,
            width: windowPoints[1].clientX - windowPoints[0].clientX,
            height: windowPoints[1].clientY - windowPoints[0].clientY
        };

        viewer.eventStore.trigger('CreateDate', {
            onDone: callbackName,
            position: windowRectangle
        });
    }

    function updateDateAsync(field, targetMark) {
        createDateAsync(field, targetMark);
    }

    function createTargetSignature(field, signatureData) {
        var targetMark;

        if (signatureData.type === 'path') {
            targetMark = viewer.viewerControl.addMark(field.pageNumber, PCCViewer.Mark.Type.FreehandSignature);
            targetMark.setRectangle(field.rectangle);
            targetMark.setPath(signatureData.path);
        } else if (signatureData.type === 'text') {
            targetMark = viewer.viewerControl.addMark(field.pageNumber, PCCViewer.Mark.Type.TextSignature);
            targetMark.setRectangle(field.rectangle);
            targetMark.setText(signatureData.text);
            targetMark.setFontName(signatureData.fontName);
        }

        if (targetMark) {
            setTargetMark(field, targetMark);
        }
    }

    function createSignatureAsync(field) {
        var signatures = PCCViewer.Signatures.toArray();
        var category = field.template === 'SignatureTemplate' ? 'signature' :
                       field.template === 'InitialsTemplate' ? 'initials' : null;

        // try to find a default
        var defaultSignature = _.find(signatures, function(sig) {
            var sameCategory = sig.category ? sig.category.toLowerCase() === category : false;
            return sig.lastSelected && sameCategory;
        });

        if (defaultSignature) {
            createTargetSignature(field, defaultSignature);
        } else {
            // create a new signature
            var callbackName = Math.random().toString().replace(/\./g, '');
            callbackQueue[callbackName] = function(ev, data) {
                if (data.status === 'success' && data.data) {
                    createTargetSignature(field, data.data);
                }
            };

            // if there are existing signatures, open the manager view
            var eventToTrigger = (signatures.length) ? 'ManageSignatures' : 'CreateSignature';

            viewer.eventStore.trigger(eventToTrigger, {
                onDone: callbackName,
                category: category
            });

            viewer.eventStore.on(callbackName, onCallback);
        }
    }

    function updateTargetSignature(field, targetMark, newSignature) {
        var markType = targetMark.getType() === PCCViewer.Mark.Type.FreehandSignature ? 'path' : 'text';

        // check if the current and new signature are of the sme type
        if (newSignature.type === markType) {
            switch (newSignature.type) {
                case 'path':
                    targetMark.setPath(newSignature.path);
                    break;
                case 'text':
                    targetMark.setText(newSignature.text);
                    targetMark.setFontName(newSignature.fontName);
                    break;
            }
        } else {
            // delete target mark and create new
            targetMark.setData(targetForKey, undefined);
            viewer.viewerControl.deleteMarks([targetMark]);
            createTargetSignature(field, newSignature);
        }
    }

    function updateSignatureAsync(field, targetMark) {
        var category = field.template === 'SignatureTemplate' ? 'signature' :
                       field.template === 'InitialsTemplate' ? 'initials' : null;

        targetMark = targetMark || viewer.viewerControl.getMarkById(field.targetId);

        // we should assume that since a signature was already created,
        // that we have a list of signatures

        var currentSignatureIdentifier;
        var targetMarkType = targetMark.getType();

        if (targetMarkType === PCCViewer.Mark.Type.FreehandSignature) {
            currentSignatureIdentifier = {
                type: 'path',
                path: targetMark.getPath()
            };
        } else if (targetMarkType === PCCViewer.Mark.Type.TextSignature) {
            currentSignatureIdentifier = {
                type: 'text',
                text: targetMark.getText(),
                fontName: targetMark.getFontName()
            };
        }

        var callbackName = Math.random().toString().replace(/\./g, '');
        viewer.eventStore.on(callbackName, onCallback);
        callbackQueue[callbackName] = function(ev, data) {
            var managedSignature = data.data;

            if (!managedSignature) {
                viewer.viewerControl.deleteMarks([targetMark]);
            } else {
                updateTargetSignature(field, targetMark, managedSignature);
            }
        };

        viewer.eventStore.trigger('ManageSignatures', {
            category: category,
            selectedSignature: currentSignatureIdentifier,
            onDone: callbackName
        });
    }

    function updateTargetMark(field) {
        var targetMark = viewer.viewerControl.getMarkById(field.targetId);

        switch (field.template) {
            case 'SignatureTemplate':
            case 'InitialsTemplate':
                updateSignatureAsync(field, targetMark);
                break;
            case 'TextTemplate':
                viewer.viewerControl.enterTextMarkEditingMode(targetMark);
                break;
            case 'CheckboxTemplate':
                viewer.viewerControl.deleteMarks([targetMark]);
                break;
            case 'DateTemplate':
                updateDateAsync(field, targetMark);
                break;
        }
    }

    function setTargetMark (field, targetMark) {
        disableMarkInteraction(targetMark);
        targetMark.setData(targetForKey, field.markId.toString());

        var stateValue = { fieldList: {} };
        stateValue.fieldList[field.markId] = {
            targetId: Number(targetMark.getId())
        };

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: stateValue
        });
    }

    function createTargetMark(field) {
        var targetMark;

        switch (field.template) {
            case 'SignatureTemplate':
            case 'InitialsTemplate':
                createSignatureAsync(field);
                break;
            case 'TextTemplate':
                if(field.multiline){
                    targetMark = viewer.viewerControl.addMark(field.pageNumber, PCCViewer.Mark.Type.TextRedaction);
                } else {
                    targetMark = viewer.viewerControl.addMark(field.pageNumber, PCCViewer.Mark.Type.TextInputSignature);
                }
                targetMark.setRectangle(field.rectangle);

                if (field.fontColor) { targetMark.setFontColor(field.fontColor); }
                if (field.fontName)  { targetMark.setFontName(field.fontName); }
                if (field.multiline && field.fontSize)  { targetMark.setFontSize(field.fontSize); }

                viewer.viewerControl.enterTextMarkEditingMode(targetMark);
                break;
            case 'CheckboxTemplate':
                targetMark = viewer.viewerControl.addMark(field.pageNumber, PCCViewer.Mark.Type.ImageStampRedaction);
                targetMark.setRectangle(field.rectangle);
                targetMark.setImage(checkboxImage);
                break;
            case 'DateTemplate':
                createDateAsync(field);
                break;
        }

        if (field.groupId) {
            toggleGroup(field);
        }

        if (targetMark) {
            setTargetMark(field, targetMark);
        }
    }

    function toggleGroup(field) {
        var summary = viewer.stateStore.getState('FormSummary').list || {},
            fieldList = viewer.stateStore.getState('FieldList').fieldList || {};

        // If the checkboxes don't allow multiple selections, delete all other target marks
        if (field.template === 'CheckboxTemplate' && summary[field.groupId] && !summary[field.groupId].data.multiple) {
            var targetMarks = _.chain(summary[field.groupId].fields)
                .map(function(fieldListField) {
                    if (fieldListField.markId !== field.markId && fieldList[fieldListField.markId].targetId) {
                        return viewer.viewerControl.getMarkById(fieldList[fieldListField.markId].targetId);
                    }
                })
                .compact()
                .value();

            viewer.viewerControl.deleteMarks(targetMarks);
        }
    }

    // When a page click event happens, update the form.
    function onPageClick(ev) {
        var target = ev.originalEvent.target || ev.originalEvent.srcElement;

        // Don't blur the selection if we're clicking on an already focused input
        if (target && typeof target.tagName === 'string') {
            if(target.tagName.toLowerCase() === 'input' ||
               target.tagName.toLowerCase() === 'textarea'){
                return;
            }
        }

        transitionFieldFocus(ev.mark, true);
    }

    // Remove focus from the last focused field and add it to a new one.
    function transitionFieldFocus(mark, isClick) {
        isClick = !!isClick;

        if (mark) {
            var list = viewer.stateStore.getState('FieldList');

            var id = Number(mark.getId());

            var field = _.find(list.fieldList, function (field) {
                // check if you have clicked on the required star or a target mark of this field
                return id === field.markId || id === field.targetId || id === field.requiredId;
            });

            // only act on fields, not other marks
            if (!field) { return; }

            // Only change focus if we need to
            var focusState = viewer.stateStore.getState('FocusField');

            if (focusState && focusState.lastActiveFieldMarkId) {
                var lastFocusedField = list.fieldList[focusState.lastActiveFieldMarkId];

                if (lastFocusedField.markId !== field.markId) {
                    blurPreviousField();
                }
            }

            focusField(field);

            if (isClick) {
                activateField(field);
            } else if (field.template === 'TextTemplate' || field.template === 'DateTemplate') {
                activateField(field);
            }
        } else {
            blurPreviousField();
        }
    }

    function activateField(field) {
        if (!field.targetId) {
            createTargetMark(field);
        } else {
            updateTargetMark(field);
        }
    }

    // Add focus to a form field.
    function focusField(field, fieldMark) {
        if (field.required && field.requiredId) {
            hideRequiredMark(field);
        }

        fieldMark = fieldMark || viewer.viewerControl.getMarkById(field.markId);
        fieldMark.setBorderColor(focusBorderColor);
        fieldMark.setBorderThickness(getBorderThickness(focusBorderThickness, fieldMark));

        viewer.eventStore.trigger('ModifyState', {
            state: 'FocusField',
            stateValue: {
                lastActiveFieldMarkId: field.markId
            }
        });
    }

    // Remove the focus from the last focused form field.
    function blurPreviousField() {
        var focusState = viewer.stateStore.getState('FocusField');

        if (focusState && focusState.lastActiveFieldMarkId) {
            var listState = viewer.stateStore.getState('FieldList');
            var field = listState.fieldList[focusState.lastActiveFieldMarkId];

            var fieldMark = viewer.viewerControl.getMarkById(field.markId);

            if (fieldMark.setBorderColor && fieldMark.setBorderThickness) {
                var color = fieldMark.getBorderColor();
                
                if (color !== defaultBorderColor && color !== errorBorderColor) {
                    fieldMark.setBorderColor(defaultBorderColor);
                    fieldMark.setBorderThickness(getBorderThickness(defaultBorderThickness, fieldMark));
                }
            }
            
            if (field.template === 'TextTemplate' && field.targetId) {
                viewer.viewerControl.enterTextMarkEditingMode();
            }

            if (field.required && field.requiredId && !field.isComplete) {
                // return the required star
                showRequiredMark(field);
            }

            if (field.isInvalid) {
                markFieldInvalid(field);
            } else {
                unmarkFieldInvalid(field);
            }
        }

        viewer.eventStore.trigger('ModifyState', {
            state: 'FocusField',
            stateValue: {
                lastActiveFieldMarkId: null
            }
        });
    }

    function completeRequiredMark(field, requiredMark) {
        requiredMark = requiredMark || viewer.viewerControl.getMarkById(field.requiredId);
        // we will treat this as a hide of the star for now
        hideRequiredMark(field);
    }

    function uncompleteRequiredMark(field, requiredMark) {
        requiredMark = requiredMark || viewer.viewerControl.getMarkById(field.requiredId);
        requiredMark.setImage(requiredImage);
        showRequiredMark(field, requiredMark);
    }

    // Hide the visual indicator that a form field is required to be completed.
    function hideRequiredMark(field, requiredMark) {
        requiredMark = requiredMark || viewer.viewerControl.getMarkById(field.requiredId);

        var image = requiredMark.getImage();

        if (image.id !== blankImage.id) {
            requiredMark.setImage(blankImage);
        }
    }

    // Add a visual indicator that a form field is required to be completed.
    function showRequiredMark(field, requiredMark) {
        requiredMark = requiredMark || viewer.viewerControl.getMarkById(field.requiredId);

        if (requiredMark.getImage().id !== requiredImage.id) {
            requiredMark.setImage(requiredImage);
        }
    }
    
    function markFieldInvalid(field) {
        var fieldMark = viewer.viewerControl.getMarkById(field.markId);
        
        var color = fieldMark.getBorderColor();
        if (color !== errorBorderColor && color !== focusBorderColor) {
            fieldMark.setBorderColor(errorBorderColor);
            fieldMark.setBorderThickness(getBorderThickness(focusBorderThickness, fieldMark));
            
            var message = PCCViewer.Language.data.overCharacterLimit;
            
            if (message) {
                viewer.eventStore.trigger('Notify', {
                    type: 'error',
                    message: message.replace(/\%n/g, field.characterLimit)
                });
            }
        }
    }
    
    function unmarkFieldInvalid(field) {
        var fieldMark = viewer.viewerControl.getMarkById(field.markId);
    
        var color = fieldMark.getBorderColor();
        if (color !== defaultBorderColor && color !== focusBorderColor) {
            fieldMark.setBorderColor(defaultBorderColor);
            fieldMark.setBorderThickness(getBorderThickness(defaultBorderThickness, fieldMark));
        }
    }

    var onMarkDataChange = viewer.throttle(function onDataChange(ev) {
        var newData = generateFieldList();

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: newData
        });
    }, 300);
    
    function onMarkChange(ev) {
        onMarkDataChange(ev);
        
        if (ev.mark.getData(targetForKey)) {
            // this was a change in the target mark, so mark the form as dirty
            onTargetMarkChange();
        }
    }
    
    function onMarkRemoved(ev) {
        var targetId = ev.mark.getData(targetForKey);

        // if this is not a target mark, ignore the delete
        if (!targetId) { return; }

        var data = viewer.stateStore.getState('FieldList') || {};
        var state = { fieldList: {} };
        var field = data.fieldList[targetId];

        field.targetId = null;
        field.isComplete = false;

        state[field.markId] = field;

        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: data
        });
        
        // this was a change in the target mark, so mark the form as dirty
        onTargetMarkChange();
    }

    // When a checklist item is selected, focus the corresponding field
    // in the form.
    function onFocusChecklistItemField(ev, data) {
        // Select the mark if it is not already selected.
        var selectedMarks = viewer.viewerControl.getSelectedMarks();

        if (!(selectedMarks.length === 1 && selectedMarks[0].getId() === data.markId)) {

            var mark = viewer.viewerControl.getMarkById(data.markId);
            var template = mark.getData('template');

            // iOS doesn't allow fields to be focused immediately the way we're doing it.
            // In order to remedy that, any field on the current page will be immediately
            // focused, any other mark will be scrolled to without focusing.
            // Other browsers behave as expected, so they will be scrolled to and focused.
            if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) && template === 'TextTemplate' && mark.pageNumber === viewer.viewerControl.getPageNumber()) {
                transitionFieldFocus(mark);
            } else {
                // scroll so if a mark is outside a zoomed-in area, it will be shown
                viewer.viewerControl.scrollToAsync(mark).then(function () {
                    if (isActive) {
                        transitionFieldFocus(mark);
                    }
                });
            }
        }
    }

    //keyboard event handler
    function onKeyCombinationsTriggered(ev, data) {
        var listState = viewer.stateStore.getState('FieldList'),
            focusState = viewer.stateStore.getState('FocusField');

        var displayFields = _.toArray(listState.fieldList).sort(function (a, b) {
            // sort based on the sorting attributes
            return (a.sortIndex !== b.sortIndex) ? a.sortIndex - b.sortIndex : 0;
        });
        
        var indexes = [];
        
        if (focusState && focusState.lastActiveFieldMarkId) {
            indexes = $.map(displayFields, function (obj, index) {
                if (obj.markId === focusState.lastActiveFieldMarkId) {
                    return index;
                }
            });
        }

        var field, currentField;

        //make sure the keys are that we want
        if (data.stateValue.keyCombinations === 'space') {
            currentField = displayFields[indexes[0]];
            
            if (currentField) {
                activateField(currentField);
            }
            
            return;
        }
        else if (data.stateValue.keyCombinations === 'tab' || data.stateValue.keyCombinations === 'return') {
            var next;
            if (indexes.length === 0) {
                next = 0;
            }
            else {
                next = (indexes[0] + 1 < displayFields.length) ? indexes[0] + 1 : displayFields.length - 1;
            }
            field = displayFields[next];
        }
        else if (data.stateValue.keyCombinations === 'shift+tab') {
            var previous;
            if (indexes.length === 0) {
                previous = 0;
            }
            else {
                previous = ((indexes[0] - 1) > 0 && (indexes[0] - 1) < displayFields.length) ? indexes[0] - 1 : 0;
            }
            field = displayFields[previous];
        }
        
        if (field) {
            var mark = viewer.viewerControl.getMarkById(field.markId);
            viewer.viewerControl.scrollToAsync(mark).then(function () {
                if (isActive) {
                    transitionFieldFocus(mark);
                }
            });
        }
    }

    function onBeforeUnload() {
        if (isInProgress) {
            return PCCViewer.Language.data.beforeUnload;
        }
    }

    function onFormLoaded() {
        // After the form has loaded, reset the progress status.
        isInProgress = false;
    }

    function onBurnForm() {
        // Once we start burning, the signer is done with the form
        isInProgress = false;
    }
    
    function onTargetMarkChange() {
        // When a target mark changes, mark the form as dirty
        isInProgress = true;
    }

    function attachEvents() {
        viewer.viewerControl.on(PCCViewer.EventType.MarkCreated, onMarkChange);
        viewer.viewerControl.on(PCCViewer.EventType.MarkChanged, onMarkChange);
        viewer.viewerControl.on(PCCViewer.EventType.PageDisplayed, onPageDisplayed);
        viewer.viewerControl.on(PCCViewer.EventType.MarkRemoved, onMarkRemoved);
        viewer.viewerControl.on(PCCViewer.EventType.Click, onPageClick);

        viewer.eventStore.on('DisplayForm', onDisplayForm);
        viewer.eventStore.on('StateModified', onStateModified);
        viewer.eventStore.on('FocusChecklistItem', onFocusChecklistItemField);
        viewer.eventStore.on('KeyCombinationsTriggered', onKeyCombinationsTriggered);

        viewer.onBeforeUnload.add(onBeforeUnload);
        viewer.eventStore.on('FormLoaded', onFormLoaded);
        viewer.eventStore.on('BurnForm', onBurnForm);
    }

    function detachEvents() {
        viewer.viewerControl.off(PCCViewer.EventType.MarkCreated, onMarkChange);
        viewer.viewerControl.off(PCCViewer.EventType.MarkChanged, onMarkChange);
        viewer.viewerControl.off(PCCViewer.EventType.PageDisplayed, onPageDisplayed);
        viewer.viewerControl.off(PCCViewer.EventType.MarkRemoved, onMarkRemoved);
        viewer.viewerControl.off(PCCViewer.EventType.Click, onPageClick);

        viewer.eventStore.off('DisplayForm', onDisplayForm);
        viewer.eventStore.off('StateModified', onStateModified);
        viewer.eventStore.off('FocusChecklistItem', onFocusChecklistItemField);
        viewer.eventStore.off('KeyCombinationsTriggered', onKeyCombinationsTriggered);

        viewer.onBeforeUnload.remove(onBeforeUnload);
        viewer.eventStore.off('FormLoaded', onFormLoaded);
        viewer.eventStore.off('BurnForm', onBurnForm);

        // unsubscribe all remaining events from the callback queue
        _.each(callbackQueue, function(val, key) {
            viewer.eventStore.off(key, onCallback);
            // clean up memory
            callbackQueue[name] = val = undefined;
        });
    }

    /**
     * @function module:fill-form-controller#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        isActive = false;
        isInProgress = false;
        detachEvents();
    };

    attachEvents();
}

/**
 * Creates the form controller module.
 * @param {Core} viewer The core viewer to which the module will attach.
 */
module.exports = function init(viewerObj) {
    return new FillFormController(viewerObj);
};
