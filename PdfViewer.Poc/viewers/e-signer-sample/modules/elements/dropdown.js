/* global module, $, require */

/**
 * @module dropdown
 * @description
 * A dropdown menu.
 * @example
 * <!--The following HTML includes a dropdown component. An element is specified 
 * as a dropdown by setting the data-pcc-component attribute to "dropdown". 
 * The dropdown options must be included as children elements, where the 
 * data-pcc-value attribute is used to specify the value of each option.-->
 * <div class="pcc-select" data-pcc-component="dropdown" data-pcc-name="font" data-pcc-default="Arial">
 *     <div data-pcc-value="Arial">Arial</div>
 *     <div data-pcc-value="Comic Sans">Comic Sans</div>
 *     <div data-pcc-value="Courier">Courier</div>
 *     <div data-pcc-value="Courier New">Courier New</div>
 *     <div data-pcc-value="Geneva">Geneva</div>
 *     <div data-pcc-value="Georgia">Georgia</div>
 *     <div data-pcc-value="Helvetica">Helvetica</div>
 *     <div data-pcc-value="Times">Times</div>
 *     <div data-pcc-value="Times New Roman">Times New Roman</div>
 *     <div data-pcc-value="Verdana">Verdana</div>
 * </div>
 * @example
 * // Require the dropdown module.
 * var Dropdown = require('../elements/dropdown.js');
 *
 * // Pass each dropdown element to the dropdown module to initialize each dropdown.
 * // parent is the element that contains the dropdown element.
 * $(parent).find('[data-pcc-component="dropdown"]').each(function() {
 *     Dropdown(this);
 * });
 */

require('./dropdown.less');

function attachBehavior($parent, $options) {
    /**
     * @member {module:event-store~on} module:dropdown#on
     * @description Registers an event handler on the dropdown.
     */
    /**
     * @member {module:event-store~off} module:dropdown#off
     * @description Removes an event handler from the dropdown.
     */

    var current;
    
    var valueList = $options.map(function(i, opt){
        return $(opt).attr('data-pcc-value');
    }).get();

    var dismissHandler = function() {
        $parent.find('.pcc-dropdown').removeClass('pcc-open');
        $(document.body).off('click', dismissHandler);
    };

    // Select box dropdown menu click
    $parent.on('click', '.pcc-arrow-down, .pcc-label', function (ev) {
        var $dropdownEl = $parent.find('.pcc-dropdown');
        $dropdownEl.toggleClass('pcc-open');

        if ($dropdownEl.hasClass('pcc-open') === true) {
            setTimeout(function() {
                $(document.body).on('click', dismissHandler);
            }, 0);
        }
    });

    $parent.on('click', '.pcc-dropdown div', function (ev) {
        var $target = $(ev.target);

        current = $target.data().pccValue;

        var label = $parent.find('.pcc-label');
        label.empty();
        label.html($target.clone());

        $parent.trigger('change', {
            value: current
        });

        $parent.find('.pcc-dropdown').removeClass('pcc-open');
        $(document.body).off('click', dismissHandler);
    });
    
    /**
     * @method module:dropdown#value
     * @description Gets or sets the value of the dropdown.
     * The values are specified in the HTML for each dropdown option using the data-pcc-value attribute.
     * @param {string} val The value of the dropdown option to select.
     * @returns {Object} The dropdown element if a value is passed.
     * Otherwise, the currently selected value is returned.
     */
    $parent.value = function(val) {
        if (val === undefined) {
            return current;
        }

        current = val;
        var selected = $parent.find('[data-pcc-value="' + val + '"]');
        var label = $parent.find('.pcc-label');
        label.empty();
        label.html(selected.clone());
        return $parent;
    };

    /**
     * @method module:dropdown#valueList
     * @description Gets an array of the values of the dropdown options.
     * @returns {Array} An array of the values of the dropdown options.
     */
    $parent.valueList = function(){
        return [].concat(valueList);
    };
    
    $parent.dom = $parent.get(0);
    
    /**
     * @method module:dropdown#destroy
     * @description Destroys the dropdown component.
     */
    $parent.destroy = function(){
        $parent.off().empty();
    };
}

function embed (type, $elem, innerHtml){
    // Set up the HTML based on the provided options.
    var $options = $elem.find('[data-pcc-value]');
    var label = document.createElement('div');
    $(label).addClass('pcc-label');
    $elem.append(label);
    var arrow = document.createElement('div');
    $(arrow).addClass('pcc-arrow-down');
    $elem.append(arrow);
    var dropdown = document.createElement('div');
    $(dropdown).addClass('pcc-dropdown');
    $options.each(function() {
        dropdown.appendChild(this);
    });
    $elem.append(dropdown);

    attachBehavior($elem, $options);

    var defaultValue = $elem.data().pccDefault;
    $elem.value(defaultValue);

    return $elem;
}

/**
 * Parses and initializes a dropdown component.
 * @param {HTMLElement} el The parent element in which to parse for 
 * the dropdown component.
 * @returns {HTMLElement} The parsed dropdown element.
 */
module.exports = function init (el) {
    return embed('dropdown', $(el), $(el).html());
};
