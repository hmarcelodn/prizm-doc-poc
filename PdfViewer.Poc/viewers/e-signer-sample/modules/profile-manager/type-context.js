/* global module, require, $, _, PCCViewer */

require('./type-context.less');
var template = require('./type-context.html');

var fontLoader = (function(){
    var isLegacyBrowser = document.documentMode && document.documentMode === 8,
        fonts = {
        // Web fonts
        'PT Serif': { useInLegacy: true },
        'Fira Sans': { useInLegacy: true },

        'Cedarville Cursive': { useInLegacy: false },
        'Dancing Script': { useInLegacy: true },

        'La Belle Aurore': { useInLegacy: false },
        'Sacramento': { useInLegacy: true },

        'Pacifico': { useInLegacy: true },
        'Italianno': { useInLegacy: true },

        'Grand Hotel': { useInLegacy: true },
        'Great Vibes': { useInLegacy: true }
    };

    function load(){
        // Create a preloader div
        var preloader = document.createElement('div'),
            style = preloader.style,
            div;

        // Make sure the preloader is reasonably hidden
        style.position = 'absolute';
        style.top = style.left = '0';
        style.width = style.height = '0px';
        style.fontSize = '1px';
        // Note: do not set zIndex to 0, as that would cause some browsers not to preload

        _.each(returnNames(), function(name){
            // create a temporary div
            div = document.createElement('div');
            div.innerHTML = 'a';
            div.style.fontFamily = '"' + name + '"';

            // add it to the preloader
            preloader.appendChild(div);
        });

        // Append the preloader to the body
        document.body.appendChild(preloader);

        // Remove the preloader on the next event loop
        setTimeout(function(){
            document.body.removeChild(preloader);
        }, 0);
    }

    // Gets a list of all the fonts.
    function returnNames() {
        // filter out non-legacy fonts in legacy browsers
        return _.filter(_.keys(fonts), function(el){
            return !isLegacyBrowser  || fonts[el].useInLegacy;
        });
    }

    return {
        preLoad: load,
        names: returnNames,
        isLegacyBrowser: isLegacyBrowser
    };
})();

// execute this once on document ready
$(document).ready(function(){
    fontLoader.preLoad();
});

// puts dom elements into columns
function placeIntoColumns (parentElement, childrenArray) {
    var Column = function(){
        var col = document.createElement('div');
        // makes 2 columns
        col.className = 'pcc-esign-column';
        return col;
    };

    var columns = [ Column(), Column() ];
    var columnsClone = [].concat(columns);

    _.forEach(childrenArray, function(child){
        // take first column
        var col = columnsClone.shift();
        // place child inside it
        col.appendChild(child);
        // put back in as last column
        columnsClone.push(col);
    });

    _.forEach(columns, function(col){
        parentElement.appendChild(col);
    });
}

// create a custom text signature context
function getTextContext ($previews, $textInput) {
    var fonts = fontLoader.names(),
        previewsArray = [],
        selectedFont = 'Times New Roman';
    // set default selected font
    if (fonts.length > 0) {
        selectedFont = fonts[0];
    }

    function generatePreview(fontName, text){
        var div = document.createElement('div');

        div.className = 'pcc-esign-text-preview';
        // Note: IE8 requires that the font have a fallback
        div.style.fontFamily = '"' + fontName + '", cursive';
        div.setAttribute('data-pcc-font-name', fontName);

        // make sure to escape all text
        var textNode = document.createTextNode(text);
        div.appendChild(textNode);

        return div;
    }

    var $input = (function() {
        var $ti = $textInput,
            // find the correct event name based on the browser
            eventName = ('oninput' in $ti.get(0)) ? 'input' : 'propertychange';

        $ti.on(eventName, function(ev) {
            if (ev.originalEvent.propertyName && ev.originalEvent.propertyName !== 'value') {
                // if this is an old IE propertyChange event for anything other than 'value', ignore it
                return;
            }

            // reset the html
            $previews.html('');

            var value = $ti.val();

            // Don't generate anything if the input is empty
            if (!value) {
                return;
            }

            previewsArray = _.map(fonts, function(fontName){
                return generatePreview(fontName, value);
            });

            placeIntoColumns($previews.get(0), previewsArray);
        });

        return $ti;
    })();

    $previews.on('click', '.pcc-esign-text-preview', function(ev){
        _.forEach(previewsArray, function(el){
            $(el).removeClass('pcc-esign-text-active');
        });
        $(this).addClass('pcc-esign-text-active');
        selectedFont = this.getAttribute('data-pcc-font-name');
    });
    
    $input.focus();

    function destroy() {
        $previews.off();
        $input.off();
    }
    
    // return an object similar to PCCViewer.SignatureControl
    return {
        done: function(){
            var returnVal = {
                type: 'text',
                text: $input.val(),
                fontName: selectedFont
            };
            
            destroy();
            return returnVal;
        },
        clear: function(){
            $input.val('');
            $previews.html('');
            $input.focus();
        },
        cancel: function(){
            destroy();
        }
    };
}

function TypingContext(elem, data) {
    var $elem = $(elem).html(template({
        language: PCCViewer.Language.data,
        category: data.category
    }));
    
    var $previews = $elem.find('[data-pcc-signature-previews]');
    var $input = $elem.find('[data-pcc-esign="textInput"]');
    
    return getTextContext($previews, $input);
}

module.exports = function init(parentElem, data) {
    return new TypingContext(parentElem, data);
};
