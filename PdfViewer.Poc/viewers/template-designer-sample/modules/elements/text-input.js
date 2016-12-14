/* global module, require, $ */

// import the CSS
require('./text-input.less');

/**
 * @module text-input
 * @description
 * A text input.
 * @example
 * <!--The following HTML includes a text input component.
 * An element is specified as a text input by setting the data-pcc-component attribute
 * to "textinput".-->
 * <div data-pcc-component="textinput" data-pcc-name="displayName" class="pcc-textbox"></div>
 * @example
 * // Require the text input module.
 * var TextInput = require('../elements/text-input.js');
 *
 * // Pass each text input element to the text input module to initialize each text input.
 * // parent is the element that contains the text input element.
 * $(parent).find('[data-pcc-component="textinput"]').each(function() {
 *     TextInput(this);
 * });
 */

var placeholderClass = 'pcc-placeholder';

function placeholderPolyfill (input) {
    if (!('placeholder' in document.createElement('input'))){
        var placeholderVal = $(input).attr('placeholder');

        $(input)
            .val(placeholderVal)
            .addClass(placeholderClass)
            .on('focus', function (ev) {
                var $el = $(ev.target);
                if ($el.val() === placeholderVal) {
                    $el.val('').removeClass(placeholderClass);
                }
            })
            .on('blur', function (ev) {
                var $el = $(ev.target);
                if (!$el.val().length) {
                    $el.val(placeholderVal).addClass(placeholderClass);
                }
            });
    }
}

function attachBehavior($parent, errorElement) {
    /**
     * @member {module:event-store~on} module:text-input#on
     * @description Registers an event handler on the text input.
     */
    /**
     * @member {module:event-store~off} module:text-input#off
     * @description Removes an event handler from the text input.
     */
    
    var $input = $parent.find('input').css({
        width: '100%',
        position: 'relative'
    });
    
    $input.on('change', function(ev){
        $input.val($.trim($input.val()));
        $parent.trigger('change');
        return false;
    });
    
    $input.keyup(function(ev){
        if (ev.keyCode === 13) {
            $parent.trigger('submit');
            $input.blur();
            return false;
        }
    });

    // Fix for IE9 where deleting text doesn't trigger 'input' and IE8 where 'input' doesn't exist at all
    $input.on('input keyup', function() {
        $parent.trigger('input');
    });

    /**
     * @method module:text-input#value
     * @description Gets or sets the value of the text input.
     * @param {string} text The text to show in the text input.
     * @returns {Object} The text input element if a value is passed.
     * Otherwise, the current value is returned.
     */
    $parent.value = function(text) {
        if (text) {
            // set the string as the value
            $input.val(text).removeClass(placeholderClass);
        }
        
        if ($input.hasClass(placeholderClass)) {
            return $parent;
        } else {
            return $input.val.apply($input, arguments);
        }
    };
    
    /**
     * @method module:text-input#showError
     * @description Shows the specified text below the text input.
     * @param {string} error The error text to show below the text input.
     * @returns {HTMLElement} The text input element.
     */
    $parent.showError = function(error) {
        $(errorElement).empty();
        errorElement.appendChild(document.createTextNode(error));
        return $parent;
    };

    /**
     * @method module:text-input#hideError
     * @description Removes the text below the text input if showError was called previously to show
     * text below the text input.
     * @returns {HTMLElement} The text input element.
     */
    $parent.hideError = function() {
        $(errorElement).empty();
        return $parent;
    };

    $parent.dom = $parent.get(0);
    
    /**
     * @method module:text-input#destroy
     * @description Destroys the text input component.
     */
    $parent.destroy = function(){
        $input.off();
        $parent.off().empty();
    };
}

function embed (type, $parent, innerHtml) {
    var data = $parent.data();
    var strDom = '<input type="text" ' + 
        ((data.pccPlaceholder) ? 'placeholder="' + data.pccPlaceholder + '"' : '') + 
        ' />';
    
    $parent.html(strDom);
    
    var $input = $parent.find('input[placeholder]');
    if ($input.length) { placeholderPolyfill($input); }
    
    var errorElement = document.createElement('div');
    $parent.append(errorElement);
    $(errorElement).addClass('pcc-textinput-error');

    attachBehavior($parent, errorElement);

    return $parent;
}

/**
 * Parses and initalizes a text input.
 * @param {HTMLElement} el The parent element in which to parse for 
 * the text input component.
 * @returns {HTMLElement} The parsed text input element.
 */
module.exports = function init(el) {
    return embed('textinput', $(el), $(el).html());
};
