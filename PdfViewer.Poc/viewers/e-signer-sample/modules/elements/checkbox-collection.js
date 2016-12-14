/* global module, $ */

/**
 * @module checkbox-collection
 * @description
 * A set of UI checkboxes that interact as one group.
 * @example
 * <!--The following HTML includes a checkbox collection component containing a single checkbox.
 * An element is specified as a checkbox collection by setting the data-pcc-component attribute
 * to "checkboxcollection".-->
 * <span data-pcc-component="checkboxcollection" 
 *         data-pcc-name="required"
 *         data-pcc-value="required"
 *         data-pcc-label="Required"
 *         class="pcc-margin"></span>
 * @example
 * // Require the checkbox collection module.
 * var CheckboxCollection = require('../elements/checkbox-collection.js');
 *
 * // Pass each checkbox collection element to the checkbox collection module to initialize each checkbox.
 * // parent is the element that contains the checkbox collection element.
 * $(parent).find('[data-pcc-component="checkboxcollection"]').each(function() {
 *     CheckboxCollection(this);
 * });
 */

var groups = {};

function destroyGroup(groupName) {
    if (groups[groupName]) {
        groups[groupName].off();
        delete groups[groupName];
    }
}

function value(groupName, newValue) {
    var $group = groups[groupName];
    if (newValue === undefined) {
        var checked = [];
    
        $group.pccElements.each(function(i, el){
            var $inputEl = $(el).find('input');
            if ($inputEl.is(':checked') === true) {
                checked.push($(el).data().pccValue);
            }
        });

        return checked;
    }
    else {
        $group.pccElements.each(function(i, el){
            var checkboxValue = $(el).data().pccValue;
            var checkTheBox = checkboxValue === newValue || $.inArray(checkboxValue, newValue) > -1;
            $(el).find('input').prop('checked', checkTheBox);
        });
  
        $group.trigger('change', {
            group: groupName,
            value: newValue
        });

        return $group;
    }
}

// defined a new checkbox collection
function newCheckboxCollection(groupName, $elem) {
    /**
     * @member {module:event-store~on} module:checkbox-collection#on
     * @description Registers an event handler on the checkbox collection.
     */
    /**
     * @member {module:event-store~off} module:checkbox-collection#off
     * @description Removes an event handler from the checkbox collection.
     */
    var wrapper = $({});
    
    /**
     * @member {Object} module:checkbox-collection.pccElements
     * @description The checkbox elements in the checkbox collection.
     */
    wrapper.pccElements = $elem;
    
    /**
     * @method module:checkbox-collection#destroy
     * @description Destroys the checkbox collection component.
     */
    wrapper.destroy = function(){
        destroyGroup(groupName);
    };

    /**
     * @method module:checkbox-collection#value
     * @description Gets or sets the values of the checkbox collection.
     * The values are specified in the HTML for each checkbox using the data-pcc-value attribute.
     * @param {Array} val An array of values to check the corresponding checkbox elements.
     * @returns {Object} The checkbox collection element if a value is passed.
     * Otherwise, an array of the values that correspond to the currently checked checkboxes is returned.
     */
    wrapper.value = function(val){
        return value(groupName, val);
    };
    
    return wrapper;
}

// build a group of checkboxes
function addToGroup($elem, groupName) {
    if (groups[groupName]) {
        groups[groupName].pccElements = groups[groupName].pccElements.add($elem);
    } else {
        groups[groupName] = newCheckboxCollection(groupName, $elem);
    }
}

function attachBehavior($parent) {
    var data = $parent.data();
    var $group, isActive;
    
    var groupName = data.pccName || (new Date()).getTime() + '_' + Math.random().toString().slice(-2);
    addToGroup($parent, groupName);
    
    // adding the auto-generated group name if a group did not exist
    if (!data.pccName) {
        $parent.data('pccGroup', groupName);
    }
    
    var $input = $parent.find('input');
    
    $parent.on('click', function(ev) {
        $group = groups[groupName];
        
        isActive = $input.is(":checked");
        
        $group.trigger('change', {
            group: groupName,
            value: isActive ? data.pccValue : null
        });
    });
    
    if (data.pccChecked !== undefined) {
        $input.prop('checked', true);
    }
    
    return groups[groupName];
}

function embed (type, $parent, innerHtml) {
    var domStr = '<input type="checkbox" {{id}} />';
    var label = $parent.data('pccLabel');
    
    if (label) {
        var tempId = Math.random().toString().replace(/\./g, '');
        domStr = domStr.replace('{{id}}', 'id="' + tempId + '"');
        domStr += '<label for="' + tempId + '">' + label + '</label>';
    } else {
        domStr = domStr.replace('{{id}}', '');
    }
    
    $parent.html(domStr);
    return attachBehavior($parent);
}

/**
 * Parses and initializes a checkbox collection.
 * @param {HTMLElement} el The parent element in which to parse for 
 * the checkbox collection component.
 * @returns {HTMLElement} The parsed checkbox collection element.
 */
module.exports = function init(el) {
    return embed('checkboxcollection', $(el), $(el).html());
};
