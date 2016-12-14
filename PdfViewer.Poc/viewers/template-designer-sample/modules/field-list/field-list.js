/* global module, require, $, _, PCCViewer */
/* jshint -W030 */

// require the CSS code and the HTML template
require('./field-list.less');
var template = require('./field-list.html');

var ListIconEnum = {
    SignatureTemplate: 'pcc-icon-signature',
    InitialsTemplate: 'pcc-icon-initials',
    TextTemplate: 'pcc-icon-text-box',
    DateTemplate: 'pcc-icon-calendar',
    CheckboxTemplate: 'pcc-icon-checkbox'
};

// figure out the correct events to use for drag interaction
var startEvent, moveEvent, endEvent, touchfix = false;
if (window.navigator.pointerEnabled) {
    startEvent = 'pointerdown';
    moveEvent = 'pointermove';
    endEvent = 'pointerup pointerleave';
    touchfix = true;
} else if (window.navigator.msPointerEnabled) {
    startEvent = 'MSPointerDown';
    moveEvent = 'MSPointerMove';
    endEvent = 'MSPointerUp MSPointerLeave';
    touchfix = true;
} else {
    startEvent = 'touchstart mousedown';
    moveEvent = 'touchmove mousemove';
    endEvent = 'touchend mouseup mouseleave';
}

function normalizeEvent(ev){
    if (ev.clientX && ev.clientY) {
        return ev;
    }

    if (ev.originalEvent.changedTouches) {
        ev.clientX = ev.originalEvent.changedTouches[0].clientX;
        ev.clientY = ev.originalEvent.changedTouches[0].clientY;
    } else if (/pointer/i.test(ev.type)) {
        ev.clientX = ev.originalEvent.clientX;
        ev.clientY = ev.originalEvent.clientY;
    }

    return ev;
}

function normalizedBB(dom) {
    var bb = dom.getBoundingClientRect();
    return {
        top: bb.top,
        left: bb.left,
        right: bb.right,
        bottom: bb.bottom,
        width: bb.width || bb.right - bb.left,
        height: bb.height || bb.bottom - bb.top
    };
}

function animate(func, preventDefault) {
    var frame = window.requestAnimationFrame || 
                window.mozRequestAnimationFrame || 
                window.webkitRequestAnimationFrame || 
                function (func) { return setTimeout(func, 16); };
    
    var waiting,
        args,
        that;
    
    return function(ev) {
        args = arguments;
        that = this;
        
        if (!waiting) {
            waiting = true;
            
            frame(function(){
                waiting = false;
                func.apply(that, args);
            });
        }
        
        if (preventDefault) {
            ev.preventDefault && ev.preventDefault();
            return false;
        }
    };
}

/**
 * @module field-list
 * @description Manages a list of fields and allows drag and drop reordering.
 * @fires {@link module:event-store#event:ModifyTemplateField}
 * @listens {@link module:event-store#event:StateModified} for "FieldList" state.
 * @example
 * var FieldList = require('field-list.js');
 * 
 * // a generic Viewer constructor
 * function Viewer(opts) {
 *     var myFieldList = FieldList(this, {
 *         elem: document.getElementById('myFieldList')
 *     });
 * }
 */
function FieldList(viewer, options) {
    // in this module, the $elem is the template content, not the parent
    var $elem = $('<div class="pcc-fieldlist-container"></div>')
        .html(template({ data: { language: PCCViewer.Language.data } }))
        .appendTo(options.elem);
    
    if (touchfix) {
        // this is required for the move events to be picked up correctly in IE using touch
        $elem.css('touch-action', 'none');
    }
    
    var isActive = true;
    var isInDNDMode = false;
    var components;
    
    var dndStarted = false,
        $dragParent,
        $first,
        $last,
        spacerElem,
        $spacer,
        $dragElem,
        dragOffset,
        dragBB,
        parentBB,
        elemBB,
        visibleBB;
    
    function rebaseSortIndices(state) {
        state = state || viewer.stateStore.getState('FieldList');
        
        // get an array of fields
        var fieldArr = _.map(state.fieldList, function(field) {
            return field;
        });

        // sort the array based on the current sort indices
        fieldArr.sort(function(a, b){
            return (a.sortIndex !== b.sortIndex) ? a.sortIndex - b.sortIndex : 0;
        });

        // calculate new indices in the same order
        var sortIndex = 0;
        var newFields = _.reduce(fieldArr, function(seed, field){
            sortIndex += 1;
            // we need to only update the sort index
            field.sortIndex = sortIndex;
            seed[field.markId] = field;
            return seed;
        }, {});

        return {
            fieldList: newFields
        };
    }
    
    function calculateChangingBoundingBoxes() {
        parentBB = normalizedBB($dragParent.get(0));
    
        visibleBB = {
            top: Math.max(parentBB.top, elemBB.top),
            bottom: Math.min(parentBB.bottom, elemBB.bottom)
        };
    }
    
    function initOnMove(ev) {
        spacerElem = document.createElement('div');
        spacerElem.className = 'pcc-spacer';

        $dragElem.addClass('pcc-drag');
        $dragParent = $dragElem.parent();
        $first = $dragParent.children().first();
        $last = $dragParent.children().last();

        dragBB = normalizedBB($dragElem.get(0));
        elemBB = normalizedBB($elem.get(0));
        
        calculateChangingBoundingBoxes();
        
        $spacer = $(spacerElem).css({
            height: dragBB.height
        }).insertAfter($dragElem);
        
        dragOffset = ev.clientY - dragBB.top;

        $dragElem.css({
            position: 'absolute',
            left: 0,
            width: '100%',
            zIndex: 100,
            opacity: 0.8,
        });
    }
    
    function performMoveCalculation(ev) {
        $dragElem.css({
            // hide so that we can figure out what element we are hovering over
            display: 'none'
        });
        
        var clientYToUse = ev.clientY;
        
        // figure out what element is underneath
        var dropTarget = document.elementFromPoint(parentBB.left, ev.clientY);
        
        if (!$.contains($dragParent.get(0), dropTarget)) {
            // we are dragging outside of the parent
            dropTarget = spacerElem;
        }
        
        var currentTargetBB = normalizedBB(dropTarget);
        
        if ($last.is(dropTarget)) {
            // we are over the last element
            if (ev.clientY > currentTargetBB.top + (currentTargetBB.height / 2)) {
                $last.after(spacerElem);
            }
        } else if (dropTarget !== spacerElem) {
            // the drop target is not the spacer
            
            // check whether we are at the top or the bottom of the current target
            if (ev.clientY < currentTargetBB.bottom - (currentTargetBB.height / 2)) {
                // we are in the top half of the drop target, so we will sort before this target
                $(spacerElem).insertBefore(dropTarget);
            } else {
                // we are in the bottom half of the target, so we will sort after this target
                $(spacerElem).insertAfter(dropTarget);
            }
        }
        
        // calculate where the top should be
        var newTop = clientYToUse - dragOffset - parentBB.top;
        
        // if we drag outside of the list, prevent the ghost from going outside, 
        // but also prevent it from snapping against the edge
        if ($spacer.prev().length === 0) {
            newTop = Math.max(newTop, 0);
        } else if ($spacer.next().length === 0) {
            newTop = Math.min(newTop, parentBB.height - dragBB.height);
        }
        
        // show the drag ghost again
        $dragElem.css({
            display: 'block',
            top: newTop
        });
    }
    
    var isScrolling = false,
        scrollDirection;
    function beginRecurringScrolling(ev, direction) {
        var scrollBy = 5;
        
        isScrolling = true;
        scrollDirection = direction || scrollDirection;
        
        var elem = $elem.get(0);
        
        // We won't use animation frames here, since they are already being
        // used by the drag/drop code. If we did, each frame would either update 
        // scrolling or drag/dop, and would make both operations look choppy.
        setTimeout(function(){
            if (!isActive) { return; }
            
            if (scrollDirection === 'up') {
                elem.scrollTop = elem.scrollTop - scrollBy;
            } else if (scrollDirection === 'down') {
                elem.scrollTop = elem.scrollTop + scrollBy;
            }
            
            calculateChangingBoundingBoxes();
            performMoveCalculation(ev);
            onMove(ev);
            
            if (isScrolling) {
                beginRecurringScrolling(ev);
            }
        }, 16);
    }
    
    function onMoveEach(ev) {
        // if the user is dragging really quickly, this could fire after the end event
        // it should occur during regular usage, but we'll still check to be safe
        if (!dndStarted) { return; }
        
        ev = normalizeEvent(ev);
        
        if (!spacerElem) {
            initOnMove(ev);
        }
        
        var scrollTrigger = 80;
        
        var elem = $elem.get(0);
        var scrollTop = elem.scrollTop;
        var scrollHeight = elem.scrollHeight;
        var clientHeight = elem.clientHeight;
        var hasScroll = scrollHeight > clientHeight;
        
        if (hasScroll && scrollTop !== 0 && ev.clientY < visibleBB.top + scrollTrigger) {
            // check if it is already scrolling
            if (!isScrolling) {
                // scroll up
                beginRecurringScrolling(ev, 'up');
            }
        } else if (hasScroll && (scrollTop + clientHeight < scrollHeight) && ev.clientY > visibleBB.bottom - scrollTrigger) {
            // scroll down
            if (!isScrolling) {
                beginRecurringScrolling(ev, 'down');
            }
        } else {
            isScrolling = false;
            scrollDirection = undefined;
        }
        
        if (ev.clientY < parentBB.top || ev.clientY > parentBB.bottom) {
            // we dragged outside of the container, so do nothing
            return;
        } 
        
        return performMoveCalculation(ev);
    }
    // optimize the animation so that we don't do work on every single mousemove
    var onMove = animate(onMoveEach, true);
    
    function onEnd(ev) {
        ev = normalizeEvent(ev);
        ev.preventDefault();
        
        // if the user is dragging really quickly, this could fire after the end event
        // it should occur during regular usage, but we'll still check to be safe
        if (!spacerElem) {
            initOnMove(ev);
        }
        
        var idKey = 'pccMarkId';
        
        var prevIndex, nextIndex, thisIndex,
            id, field;
        
        var $spacer = $(spacerElem);
        var $prev = $spacer.prev();
        var $next = $spacer.next();
        
        var fieldData = viewer.stateStore.getState('FieldList');
        
        // check for a previous field, and if we don't have one,
        // mark the dragged field as first
        if ($prev.length) {
            id = $prev.data(idKey);
            field = fieldData.fieldList[id];
            prevIndex = field.sortIndex;
        } else {
            id = $first.data(idKey);
            field = fieldData.fieldList[id];
            thisIndex = field.sortIndex / 2;
        }
        
        // check for a next field, and if we don't have one,
        // mark the dragged field as last
        if ($next.length) {
            id = $next.data(idKey);
            field = fieldData.fieldList[id];
            nextIndex = field.sortIndex;
        } else {
            id = $last.data(idKey);
            field = fieldData.fieldList[id];
            thisIndex = field.sortIndex + 2;
        }
        
        // calculate the new index if we have both a previous and next
        if (prevIndex && nextIndex) {
            thisIndex = (prevIndex + nextIndex) / 2;
        }
        
        var thisId = $dragElem.data(idKey);
        var thisField = fieldData.fieldList[thisId];
        
        var state = { fieldList: {} };
        
        if (thisIndex.toString().length < 18) {
            state.fieldList[thisField.markId] = {
                sortIndex: thisIndex
            };
        } else {
            // when we reach a number with 18 places, we need to rebase
            fieldData.fieldList[thisField.markId].sortIndex = thisIndex;
            state = rebaseSortIndices(fieldData);
        }
        
        viewer.eventStore.trigger('ModifyState', {
            state: 'FieldList',
            stateValue: state
        });
        
        // cleanup
        endDND();
        $prev = $next = field = id = fieldData = undefined;
        dndStarted = false;
        
        return false;
    }
    
    function beginDragAndDrop(ev) {
        ev = normalizeEvent(ev);
        ev.preventDefault();
        
        dndStarted = true;
        
        $(document.body)
            .on(moveEvent, onMove)
            .on(endEvent, onEnd);
        
        $dragElem = $(this);
        
        return false;
    }
    
    function attachDND() {
        $elem.off(startEvent);
        isInDNDMode = true;
        $elem.on(startEvent, '[data-pcc-field]', beginDragAndDrop);
        
        if (!$elem.hasClass('pcc-enable-drag')){
            $elem.addClass('pcc-enable-drag');
        }
    }
    function endDND() {
        $(document.body)
            .off(moveEvent, onMove)
            .off(endEvent, onEnd);
        
        $dragParent = $first = $last = spacerElem = $spacer = $dragElem = dragOffset = dragBB = parentBB = elemBB = visibleBB = undefined;
    }
    function detachDND() {
        isInDNDMode = false;
        endDND();
        $elem.off(startEvent);
        
        if ($elem.hasClass('pcc-enable-drag')){
            $elem.removeClass('pcc-enable-drag');
        }
    }
    
    function toggleDragAndDropMode(ev, data) {
        if (data.value) {
            attachDND();
        } else {
            detachDND();
        }
    }
    
    function teardownComponents() {
        if (components && components.dragTrigger) {
            components.dragTrigger.off();
            components.dragTrigger.destroy();
        }
        
        components = undefined;
    }
    
    function onStateModified(ev, data) {
        // we only care about a modified mark list
        if (data.state !== 'FieldList') { return; }

        teardownComponents();
        
        var fields = data.stateValue.fieldList;

        var displayFields = _.map(fields, function(field) {
            // convert the object to an array
            return field;
        }).sort(function(a, b) {
            return a.sortIndex - b.sortIndex;
        });

        // save scroll position in the list
        var currentScroll = $elem.get(0).scrollTop;

        // re-render the list
        $elem.html(template({
            data: {
                fields: displayFields,
                language: PCCViewer.Language.data,
                icons: ListIconEnum
            }
        }));
        viewer.parseIcons($elem);
        components = viewer.parseComponents($elem);
        components.dragTrigger.on('change', toggleDragAndDropMode);
        
        if (isInDNDMode) {
            attachDND();
            components.dragTrigger.value(true);
        }

        // match previous scroll position
        $elem.get(0).scrollTop = currentScroll;
    }
    
    function attachEvents(viewer, $elem) {
        viewer.eventStore.on('StateModified', onStateModified);

        $elem.on('click', '[data-pcc-field]', function(ev) {
            if (isInDNDMode) { return; }
            
            viewer.eventStore.trigger('ModifyTemplateField', {
                markId: $(this).data('pccMarkId')
            });
        });
    }

    function detachEvents(viewer, $elem) {
        viewer.eventStore.off('StateModified', onStateModified);
        detachDND();
        
        $elem.off();
        teardownComponents();
    }
    
    /**
     * @function module:field-list#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        isActive = false;
        isInDNDMode = false;
        detachEvents(viewer, $elem);
        $elem.remove();
    };
    
    attachEvents(viewer, $elem);    
}

/**
 * Creates the field list UI module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options object.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new FieldList(viewer, options);
};
