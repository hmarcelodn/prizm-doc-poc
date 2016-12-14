/* global module, _, PCCViewer */

// the key to use in local storage
var signatureStorageKey = 'pccvEsignSignatures';

var onInitCompleteQueue = [];
var initComplete = false;

// check if local storage is present and available
var hasLocalStorage = (window.localStorage && 
                       window.localStorage.getItem && 
                       window.localStorage.setItem && 
                       window.localStorage.removeItem);

// this function will execute immediately, in order to prepopulate the 
// signatures collection with saved data
(function() {
    function generateAddedOnInitFunction(count, callback) {
        return function() {
            count = count - 1;
            
            if (count === 0) {
                callback();
            }
        };
    }
    
    function getStoredSignatures() {
        if (!hasLocalStorage) { return []; }
        
        var signatures = window.localStorage.getItem(signatureStorageKey);

        if (typeof signatures === 'undefined' || signatures === null) {
            // create empty signatures object
            signatures = { values: [] };
        } else {
            // return current signatures object
            signatures = JSON.parse(signatures);
        }

        return signatures.values;
    }
    
    function setLoadingComplete() {
        initComplete = true;
            
        while(onInitCompleteQueue.length) {
            var func = onInitCompleteQueue.shift();
            func();
        }
    }
    
    function loadSignatures() {
        var signatures = getStoredSignatures();
        
        if (signatures.length === 0) {
            setLoadingComplete();
            return;
        }
        
        var onItemAdded = generateAddedOnInitFunction(signatures.length, function(){
            PCCViewer.Signatures.off('ItemAdded', onItemAdded);
            setLoadingComplete();
        });
        
        PCCViewer.Signatures.on('ItemAdded', onItemAdded);
        
        _.forEach(signatures, function(sig, i) {
            PCCViewer.Signatures.add(sig);
        });
    }
    
    loadSignatures();
})();
        
/**
 * @module data-persist
 * @description
 * Provides the ability to store state data in the browser's local storage.
 * 
 * **Note: this module is an example of a persistence module. It presents potential security
 * concerns, in that it may allow users to store sensitive information in non-secure browser
 * storage. Please make sure this module fits your security model before using it in production.**
 * @listens {@link module:event-store#event:PersistSignatures}
 * @example
 * var DataPersist = require('data-persist.js');
 * 
 * // a generic Viewer constructor
 * var myDataPersist = DataPersist(viewer);
 */
function DataPersist(viewer) {
    function onSignatureChange(ev) {
        if (!hasLocalStorage) { return; }
        
        var signatures = PCCViewer.Signatures.toArray();
        var sigTemplate = { values: signatures };
        
        window.localStorage.setItem(signatureStorageKey, JSON.stringify(sigTemplate));
    }
    
    function attachEvents() {
        PCCViewer.Signatures.on('ItemAdded', onSignatureChange);
        PCCViewer.Signatures.on('ItemRemoved', onSignatureChange);
        viewer.eventStore.on('PersistSignatures', onSignatureChange);
    }

    function detachEvents() {
        PCCViewer.Signatures.off('ItemAdded', onSignatureChange);
        PCCViewer.Signatures.off('ItemRemoved', onSignatureChange);
        viewer.eventStore.off('PersistSignatures', onSignatureChange);
    }

    /**
     * @function module:data-persist#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        detachEvents();
    };
    
    if (initComplete) {
        attachEvents();
    } else {
        onInitCompleteQueue.push(attachEvents);
    }
}

/**
 * Created the data persistence module.
 * @param {Core} viewer The core viewer to which the module will attach.
 */
module.exports = function init(viewer) {
    return new DataPersist(viewer);
};
