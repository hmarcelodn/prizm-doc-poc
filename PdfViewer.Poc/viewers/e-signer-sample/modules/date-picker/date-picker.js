/* global module, require, $, PCCViewer */

// require the CSS code and the HTML template
var Pikaday = require('./pikaday.js');
require('./date-picker.less');

var defaultDateFormat = 'MM/DD/YYYY';

// localization settings for Pikaday
var PikadayOptions = {
    i18n: {
        previousMonth : 'Previous Month',
        nextMonth     : 'Next Month',
        months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
        weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    }
};

function formatDate(date, template) {
    var hours = date.getHours(),
        period = (hours >= 12) ? 'pm' : 'am',
        adjustedHours = (hours > 12) ? hours - 12 : (hours === 0) ? 12 : hours,
        year = date.getFullYear().toString(),
        yearLength = year.length,
        shortYear = year.slice(yearLength - 2, yearLength);

    function padNumber(val) {
        val = val.toString();
        while(val.length < 2) {
            val = '0' + val;
        }
        return val;
    }

    return template
            .replace(/MM/, padNumber( date.getMonth() + 1 ))
            .replace(/M/, date.getMonth() + 1)
            .replace(/DD/, padNumber(date.getDate()))
            .replace(/D/, date.getDate())
            .replace(/YYYY/, year )
            .replace(/YY/, shortYear)
            .replace(/HH/, padNumber(hours))
            .replace(/H/, hours)
            .replace(/hh/, padNumber(adjustedHours))
            .replace(/h/, adjustedHours)
            .replace(/mm/, padNumber(date.getMinutes()))
            .replace(/m/, date.getMinutes())
            .replace(/a/, period)
            .replace(/A/, period.toUpperCase());
}

/**
 * @module date-picker
 * @description Provides a date picker UI.
 * @listens {@link module:event-store#CreateDate}
 * @listens {@link module:event-store#StateModified} for "FocusField" state.
 * @example
 * var DatePicker = require('date-picker.js');
 * 
 * // a generic Viewer constructor
 * var myDatePicker = DatePicker(this, {
 *     dateFormat: 'MM/DD/YYYY'
 * });
 */
function DatePicker(viewer, options) {
    var localPikadayOptions = $.extend(true, {}, PikadayOptions, { 
        i18n: PCCViewer.Language.data.datepicker 
    });
    
    var picker, input, elem, interactionDismiss = viewer.interactionDismiss();
    
    var format = options.dateFormat || defaultDateFormat;
    
    function getBoundingBox(elem) {
        var bb = elem.getBoundingClientRect();
        return {
            top: bb.top,
            bottom: bb.bottom,
            left: bb.left,
            right: bb.right,
            width: bb.width || bb.right - bb.left,
            height: bb.height || bb.bottom - bb.top
        };
    }
    
    function generatePickerDom(position) {
        var div = document.createElement('div');
        
        $(div).css({
            position: 'absolute',
            width: '260px',
            maxHeight: '255px',
            zIndex: 1000
        }).addClass('pcc-datepicker');
        
        return div;
    }
    
    function positionElement(elem, elemRect, positionRect) {
        var visibleRect = getBoundingBox(viewer.$elem.get(0));
        
        // try to position above the rectangle, aligned to the left
        var top = positionRect.y - elemRect.height, 
            left = positionRect.x;
        
        // position underneath if it goes above the visible area
        if (top < visibleRect.top) {
            top = positionRect.y + positionRect.height;
        }
        // position centered on top if that will go outside of visible area
        if (top + elemRect.height > positionRect.bottom) {
            top = ((positionRect.y + positionRect.height) / 2) - (elemRect.height / 2);
        }
        
        // align to the right if it goes outside of the visible area
        if (left + elemRect.width > visibleRect.right) {
            left = positionRect.x + positionRect.width - elemRect.width;
        }
        // center in visible area if right-aligned goes out of visible area
        if (left < visibleRect.left) {
            left = (visibleRect.width - elemRect.width) / 2;
        }
        
        elem.style.top = top - visibleRect.top + 'px';
        elem.style.left = left - visibleRect.left + 'px';
    }
    
    function initModule(position, onDate) {
        input = document.createElement('input');
        
        if (elem) {
            destroyPicker();
        }
        
        elem = generatePickerDom(position);
        viewer.$elem.append(elem);
        
        picker = new Pikaday({
            onSelect: onDate,
            container: elem,
            field: input,
            bound: false
        });
        
        // IE8 requires that this input be in the DOM in order to trigger events
        $(input).css({
            width: '0px',
            height: '0px',
            display: 'none'
        }).appendTo(document.body);
        
        // enable localization
        picker.config(localPikadayOptions);
        picker.draw();
        
        // position after all displaying is complete
        positionElement(elem, getBoundingBox(elem), position);
    }
    
    function destroyPicker() {
        if (picker && picker.destroy) {
            picker.destroy();
        }
        
        $(input).remove();
        $(elem).remove();
        elem = input = picker = undefined;
        
        interactionDismiss.remove();
        // reinitialize this, so we have a clean object
        interactionDismiss = undefined;
        interactionDismiss = viewer.interactionDismiss();
    }
    
    function onCreateDate(ev, data) {
        if (picker) {
            destroyPicker();
        }
        
        initModule(data.position || {}, function(date) {
            var dateString = formatDate(date, format);
            destroyPicker();
            
            if (data.onDone) {
                viewer.eventStore.trigger(data.onDone, {
                    status: 'success',
                    data: dateString
                });
            }
        });
        
        interactionDismiss.add(destroyPicker);
    }
    
    function onFocusStateModified(ev, data) {
        // we only care when a field is blurred
        if (data.state !== 'FocusField') { return; }
        if (data.stateValue.lastActiveFieldMarkId) { return; }
        
        destroyPicker();
    }
    
    function attachEvents() {
        viewer.eventStore.on('CreateDate', onCreateDate);
        viewer.eventStore.on('StateModified', onFocusStateModified);
    }

    function detachEvents() {
        viewer.eventStore.on('CreateDate', onCreateDate);
        viewer.eventStore.on('StateModified', onFocusStateModified);
    }
    
    /**
     * @function module:date-picker#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents();
        destroyPicker();
    };
    
    //initModule();
    attachEvents();
}

/**
 * Created the template name header module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options abject.
 * @param {external:"jQuery.fn"~DateFormat} options.dateFormat
 * The format string to use when providing the selected date.
 */
module.exports = function init(viewer, options) {
    options = options || {};
    return new DatePicker(viewer, options);
};
