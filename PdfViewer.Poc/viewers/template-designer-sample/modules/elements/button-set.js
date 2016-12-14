/* global module, require, $, _ */

// import the CSS
require('./button-set.less');

/**
 * @module button-set
 * @description
 * A set of UI buttons that interact as one group. The Button Set supports two modes: toggling
 * the buttons between the on and off state, as well as toggling through an arbitrary list of
 * ordered values.
 * 
 * In the on/off mode, each button will be turned to on when clicked. When one button is selected, 
 * it turns all other buttons that are in the on state to off.
 * 
 * In the arbitrary toggle mode, each button will cycle through its own toggle values. When one button
 * is selected, it will remove the active toggle value from any other button that currently has one.
 * Those buttons will be reset, and begin the cycle at the first toggle value the next time they are
 * clicked.
 * 
 * @example
 * <!-- In this example, the buttons toggle on and off -->
 *
 * <!--The following HTML includes a couple button set components with the same data-pcc-name
 * so that they are included in the same set. An element is specified as a button set by setting
 * the data-pcc-component attribute to "buttonset".-->
 * <button data-pcc-component="buttonset" 
 *         data-pcc-name="mousetools" 
 *         data-pcc-value="SignatureTemplate"
 *         class="pcc-button">
 *     <span data-pcc-icon="pcc-icon-signature"></span>
 *     <label>Signature</label>
 * </button>
 * <button data-pcc-component="buttonset" 
 *         data-pcc-name="mousetools" 
 *         data-pcc-value="InitialsTemplate"
 *         class="pcc-button">
 *     <span data-pcc-icon="pcc-icon-initials"></span>
 *     <label>Initials</label>
 * </button>
 * @example
 * <!-- In this example, the buttons toggle among arbitrary values -->
 * <button data-pcc-component="buttonset" 
 *         data-pcc-name="mousetools" 
 *         data-pcc-value="SignatureTemplate"
 *         data-pcc-toggle="on,sticky"
 *         class="pcc-button">
 *     <span data-pcc-icon="pcc-icon-signature"></span>
 *     <label>Signature</label>
 * </button>
 * @example
 * // Require the button set module.
 * var ButtonSet = require('../elements/button-set.js');
 * var mySet;
 * 
 * // Pass each button set element to the button set module to initialize each button.
 * // parent is the element that contains the button set elements.
 * $(parent).find('[data-pcc-component="buttonset"]').each(function() {
 *     // ButtonSet will return the entire set of buttons that have been added
 *     // using the same 'data-pcc-name' value
 *     mySet = ButtonSet(this);
 * });
 * 
 * mySet.on('change', function(ev, data) {
 *     // data about the buttonset
 *     console.log(data);
 * });
 */

var groups = {};
var activeClass = 'pcc-active';
var currentValue = {};

function destroyGroup(groupName) {
    groups[groupName].off();
    delete groups[groupName];
    delete currentValue[groupName];
}

function getNextToggleValue(current, values) {
    var currentIndex = _.indexOf(values, current);
    var nextIndex;
    
    if (currentIndex + 1 === values.length) {
        nextIndex = 0;
    } else {
        nextIndex = currentIndex + 1;
    }
    
    return values[nextIndex];
}

function setValueState($parent, $group, groupName, data, currentOverride) {
    var isActive;
    
    if (currentOverride !== undefined && currentOverride === data.pccValue) {
        $group.pccElements.removeClass(activeClass);
        $parent.addClass(activeClass);
        isActive = true;
    } else if ($parent.hasClass(activeClass)) {
        $group.pccElements.removeClass(activeClass);    
        isActive = false;
    } else {
        $group.pccElements.removeClass(activeClass);
        $parent.addClass(activeClass);
        isActive = true;
    }

    currentValue[groupName] = isActive ? data.pccValue : null;

    $group.trigger('change', {
        group: groupName,
        value: currentValue[groupName]
    });
}

function setToggleState($parent, $group, groupName, data, currentOverride) {
    if (currentOverride) {
        // make sure that we use only valid override values
        currentOverride = _.contains(data.toggleValues, currentOverride) ? currentOverride : undefined;
    }
    
    var currentToggle = currentOverride || $parent.data('pccToggleValue'),
        nextToggle;
    
    if (!currentToggle) {
        nextToggle = data.toggleValues[0];
    } else {
        nextToggle = getNextToggleValue(currentToggle, data.toggleValues);
    }
    
    // we have to do both, due to the way jQuery tracks data
    $group.pccElements.removeData('pccToggleValue');
    $group.pccElements.removeAttr('data-pcc-toggle-value');
    $group.pccElements.removeClass($group.pccToggleClasses.join(' '));
    // write the new toggle value to the DOM
    $parent.attr('data-pcc-toggle-value', nextToggle);
    $parent.addClass('pcc-toggle-value-' + nextToggle.replace(/\s/g, ''));
    
    currentValue[groupName] = data.pccValue;
    
    $group.trigger('change', {
        group: groupName,
        value: data.pccValue,
        toggle: nextToggle
    });
}

function value(groupName, newValue, toggleValue) {
    if (newValue === undefined) {
        return currentValue[groupName];
    }
    
    // allow true/false toggling
    if (!toggleValue && newValue === false) {
        newValue = null;
    }
    
    var $group = groups[groupName];
    currentValue[groupName] = newValue;
    
    if (newValue === null) {
        $group.pccElements.removeClass(activeClass);
        $group.pccElements.filter(':focus').blur();
        
        $group.trigger('change', {
            group: groupName,
            value: currentValue[groupName]
        });
    } else {
        var targetElem = _.find($group.pccElements, function(elem) {
            return elem.getAttribute('data-pcc-value') === newValue.toString();
        });
        
        if (!targetElem) { return $group; }
        
        var $target = $(targetElem);
        
        var targetData = $target.data() || {};
        
        // change the value based on the buttonset type
        if ($target.length && targetData.pccToggle) {
            targetData.toggleValues = targetData.pccToggle.split(',');
            setToggleState($target, $group, groupName, targetData, toggleValue);
        } else {
            setValueState($target, $group, groupName, targetData, newValue);   
        }
    }
    
    return $group;
}

// defined a new button set
function newButtonSet(groupName, $elem) {
    /**
     * @member {module:event-store~on} module:button-set#on
     * @description Registers an event handler on the button set.
     */
    /**
     * @member {module:event-store~off} module:button-set#off
     * @description Removes an event handler from the button set.
     */
    var wrapper = $({});
    
    /**
     * @member {Object} module:button-set.pccElements
     * @description The button elements in the button set.
     */
    wrapper.pccElements = $elem;
    
    /**
     * @method module:button-set#destroy
     * @description Destroys the button set component.
     */
    wrapper.destroy = function(){
        destroyGroup(groupName);
    };

    /**
     * @method module:button-set#value
     * @description Gets or sets the value of the button set.
     * The values are specified in the HTML for each button using the data-pcc-value attribute.
     * @param {string} val The value of the button to make active.
     * @returns {Object} The button set element if a value is passed.
     * Otherwise, the current value is returned.
     */
    wrapper.value = function(val, toggleValue) {
        return value(groupName, val, toggleValue);
    };
    
    currentValue[groupName] = null;

    return wrapper;
}

// build a group of buttons
function addToGroup($elem, groupName) {
    if (groups[groupName]) {
        groups[groupName].pccElements = groups[groupName].pccElements.add($elem);
    } else {
        groups[groupName] = newButtonSet(groupName, $elem);
    }
}

function attachBehavior($parent) {
    var data = $parent.data();
    var $group;
    
    var groupName = data.pccName || (new Date()).getTime() + '_' + Math.random().toString().slice(-2);
    addToGroup($parent, groupName);
    $group = groups[groupName];
    
    // adding the auto-generated group name if a group did not exist
    if (!data.pccName) {
        $parent.data('pccGroup', groupName);
    }
    
    var toggleValues;
    var toggleClasses = $group.pccToggleClasses || [];
    
    if (data.pccToggle) {
        toggleValues = data.pccToggle.split(',');
        data.toggleValues = toggleValues;
    }
    
    $parent.pccToggleValues = toggleValues;
    
    // add all new toggle classes
    _.forEach(toggleValues, function(val){
        toggleClasses.push('pcc-toggle-value-' + val.replace(/\s/g, ''));
    });
    toggleClasses = _.unique(toggleClasses);
    
    $group.pccToggleClasses = toggleClasses;
    
    $parent.on('click', function(ev) {
        if (toggleValues) {
            setToggleState($parent, $group, groupName, data);
        } else {
            setValueState($parent, $group, groupName, data);
        }
    });
    
    return groups[groupName];
}

function embed (type, $parent, innerHtml) {
    return attachBehavior($parent);
}

/**
 * Parses and initializes a button set.
 * @param {HTMLElement} el The parent element in which to parse for 
 * the button set component.
 * @returns {HTMLElement} The parsed button set element.
 */
module.exports = function init(el) {
    return embed('togglebutton', $(el), $(el).html());
};
