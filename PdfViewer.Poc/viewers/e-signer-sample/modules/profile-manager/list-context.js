/* global module, require, $, _, PCCViewer */

require('./list-context.less');
var template = require('./list-context.html');

function ListContext(elem, sigs, selectedSignature) {
    var $elem = $(elem),
        fragment = document.createDocumentFragment(),
        $div,
        signatureInUse = selectedSignature;
    
    var realSelectedSignature,
        selectedInsertedInList = false;
    
    var signatureHash = _.reduce(sigs, function(seed, val, idx){
        
        // first, figure out if this is the selected one
        if (!realSelectedSignature && selectedSignature &&
            selectedSignature.type === val.type &&
            selectedSignature[val.type] === val[val.type] &&
            selectedSignature.fontName === val.fontName) {
            // this is the selected signature
            realSelectedSignature = val;
        }
        
        // map all the signatures onto a key-value hash
        seed[idx + Math.random().toString().replace(/\./g, '')] = val;
        return seed;
    }, {});
    
    _.forEach(signatureHash, function(sig, key) {
        $div = $(document.createElement('div'));
        
        $div.html(template({
            language: PCCViewer.Language.data,
            signature: key,
            selected: sig === realSelectedSignature
        }));
        
        if (sig === realSelectedSignature) {
            // place the selected signature first
            fragment.insertBefore($div.get(0), fragment.firstChild);
            selectedInsertedInList = true;
        } else {
            // append any other signature to the end of the list
            fragment.appendChild($div.get(0));
        }
        
        // make sure SVG does not zoom in (only zoom out)
        var $preview = $div.find('[data-pcc-preview]');
        $preview.css({
            'max-width': sig.width ? sig.width + 'px' : '',
            'max-height': sig.height ? sig.height + 'px' : ''
        });
        
        PCCViewer.SignatureDisplay($preview.get(0), sig);
    });
    
    if (!selectedInsertedInList && selectedSignature && selectedSignature.type) {
        $div = $(document.createElement('div'));
        
        $div.html(template({
            language: PCCViewer.Language.data,
            signature: 'unknown',
            selected: true
        }));
        
        fragment.insertBefore($div.get(0), fragment.firstChild);
        PCCViewer.SignatureDisplay($div.find('[data-pcc-preview]').get(0), selectedSignature);
        signatureHash['unknown'] = selectedSignature;
        realSelectedSignature = selectedSignature;
    }
    
    $elem.empty().append(fragment);
    
    $elem.on('click', 'button', function(){
        var data = $(this).data(),
            whichButton = data.pccEsignButton,
            signatureKey = data.pccEsignFor;
        
        if (whichButton === 'delete') {
            deleteSignature(signatureKey);
        } else if (whichButton === 'update') {
            updateSignature(signatureKey);
        } else if (whichButton === 'remove') {
            removeSignature(signatureKey);
        }
    });
    
    function updateSignature(key) {
        signatureInUse = signatureHash[key];
    }
    
    function removeSignature(key) {
        signatureInUse = undefined;
    }
    
    function deleteSignature(key) {
        PCCViewer.Signatures.remove(signatureHash[key]);
        
        $elem.find('[data-pcc-esign-item=' + key + ']').hide();
        
        if (signatureHash[key] === realSelectedSignature) {
            removeSignature(key);
        }
    }
    
    function destroy() {
        $elem.off().empty();
        signatureHash = undefined;
    }
    
    this.done = function() {
        destroy();
        return signatureInUse;
    };
    this.cancel = destroy;
}

module.exports = function init(parentElem, signatureList, selectedSignature) {
    return new ListContext(parentElem, signatureList, selectedSignature);
};
