/* global module, require, $, _, PCCViewer */
/* jshint -W030 */

// require the CSS code and the HTML template
require('./profile-manager.less');
var template = require('./profile-manager.html');

var DrawingContext = require('./drawing-context.js');
var TypingContext = require('./type-context.js');
var ListContext = require('./list-context.js');

/**
 * @module profile-manager
 * @description Provides the ability to create and manage signatures.
 * @listens {@link module:event-store#CreateSignature}
 * @listens {@link module:event-store#ManageSignatures}
 * @example
 * var ProfileManager = require('profile-manager.js');
 * 
 * // a generic Viewer constructor
 * var myProfileManager = ProfileManager(this, {
 *     elem: document.getElementById('myProfileManager')
 * });
 */
function ProfileManager(viewer, options) {
    var $elem,
        nodes = {},
        components = {},
        context,
        onResize;

    function buildTemplate(mode, category, onBuildComplete) {
        $elem.html(template({
            mode: mode,
            category: category,
            language: PCCViewer.Language.data
        }));

        viewer.parseIcons($elem);

        initModule();
        
        if (onBuildComplete && typeof onBuildComplete === 'function') {
            onBuildComplete();
        }
        
        $elem.addClass('pcc-open');
    }
    
    function destroyTemplate() {
        components.setSigDefault && components.setSigDefault.off();
        components = {};
        
        if (context && context.cancel) {
            context.cancel();
            context = undefined;
        }
        
        $elem.off().empty().removeClass('pcc-open');
    }
    
    function setDefaultSignature(signature) {
        var all = PCCViewer.Signatures.toArray();
        _.each(all, function(savedSig) {
            
            if (savedSig === signature || 
                (savedSig.type === signature.type && 
                 savedSig.path === signature.path && 
                 savedSig.text === signature.text && 
                 savedSig.fontName === signature.fontName)) {

                // signatures are the same, so set the value to true
                // we use this to support passing in signature-like objects
                savedSig.lastSelected = true;
            } else {
                savedSig.lastSelected = false;
            }
        });

        signature.lastSelected = true;
        
        // since we changed the default, trigger a manual siganture save
        viewer.eventStore.trigger('PersistSignatures');
    }

    function getDismissCallback(data) {

        return function onDismiss(status, newSignature) {
            if (data && data.onDone && typeof data.onDone === 'string') {
                viewer.eventStore.trigger(data.onDone, {
                    status: status,
                    data: newSignature
                });
            }
        };
    }

    function attachSignatureBehavior(data) {
        var onDismiss = getDismissCallback(data);

        viewer.parseIcons($elem);
        components = viewer.parseComponents($elem);

        $elem
        .off()
        .on('click', '[data-pcc-save]', function() {
            var sig = context.done(),
                setDefault = !!components.setSigDefault.value().length;

            if (sig.path === 'M0,0' || sig.text === "") {
                // Do not save paths with no content or empty string text signatures.
                // The user probably pressed "Save" by mistake
                onDismiss('cancel');
                destroyTemplate();
                return;
            }

            sig.category = data.category;

            if (setDefault) {
                setDefaultSignature(sig);
            }

            PCCViewer.Signatures.add(sig);
            
            onDismiss('success', sig);
            destroyTemplate();
        })
        .on('click', '[data-pcc-cancel]', function() {
            
            // if there was a selected signature, return it successfully,
            // else execute a cancel
            if (data.selectedSignature) {
                onDismiss('success', data.selectedSignature);
            } else {
                onDismiss('cancel');
            }
            
            destroyTemplate();
        });
    }
    
    function drawNewSignature(ev, data) {
        buildTemplate('signature', data.category);
        
        context = DrawingContext(nodes.$viewContainer);
        
        attachSignatureBehavior(data);
        
        $elem.on('click', '[data-pcc-retry]', function() {
            context.clear();
            $(this).blur();
        });
    }
    
    function handleResize() {
        if (context && context.resize && typeof context.resize === 'function') {
            context.resize();
        }
    }
    
    function typeNewSignature(ev, data) {
        buildTemplate('signature', data.category);
        
        context = TypingContext(nodes.$viewContainer, data);
        
        attachSignatureBehavior(data);
    }
    
    function signatureDisambiguation(ev, data) {
        var onDismiss = getDismissCallback(data);

        buildTemplate('select', data.category);

        $elem
        .off()
        .on('click', '[data-pcc-signature]', function(){
            
            data.signatureType = $(this).data('pccSignature');
            createNewSignature(ev, data);
        })
        .on('click', '[data-pcc-cancel]', function() {

            // if there was a selected signature, return it successfully,
            // else execute a cancel
            if (data.selectedSignature) {
                onDismiss('success', data.selectedSignature);
            } else {
                onDismiss('cancel');
            }
            
            destroyTemplate();
        });
    }
    
    function createNewSignature(ev, data) {
        if (data.signatureType === 'FreehandSignature') {
            drawNewSignature(ev, data);
        } else if (data.signatureType === 'TextSignature') {
            typeNewSignature(ev, data);
        } else {
            signatureDisambiguation(ev, data);
        }
    }
    
    function onManageSignatures(ev, data) {
        data = data || {};
        
        var allSignatures = PCCViewer.Signatures.toArray();
        var displaySignatures = _.filter(allSignatures, function(sig) {
            return (data.category) ? 
                   (sig.category ? 
                        sig.category.toLowerCase() === data.category : 
                        false) : 
                   true;
        });

        // If the category doesn't have signatures, display the disambiguation view
        if (!displaySignatures.length) {
            return signatureDisambiguation(ev, data);
        }

        buildTemplate('manage', data.category);

        context = ListContext(nodes.$viewContainer, displaySignatures, data.selectedSignature || undefined);
        viewer.parseIcons($elem);

        function executeDone() {
            var managedSig = context.done();
            
            if (managedSig) {
                setDefaultSignature(managedSig);
            }
            
            if (data.onDone) {
                viewer.eventStore.trigger(data.onDone, {
                    data: managedSig,
                    status: managedSig ? 'success' : 'cancel'
                });
            }
            
            destroyTemplate();
        }
        
        $elem
        .off()
        .on('click', 'button', function(){
            var whichButton = $(this).data('pccEsignButton');
            
            switch (whichButton) {
                case 'done':
                case 'update':
                case 'remove':
                    executeDone();
                    break;
                case 'drawNew':
                    drawNewSignature(ev, data);
                    break;
                case 'typeNew':
                    typeNewSignature(ev, data);
                    break;
            }
        })
        .on('click', '[data-pcc-cancel]', function() {
            executeDone();
        });
    }

    function attachEvents() {
        viewer.eventStore.on('CreateSignature', createNewSignature);
        viewer.eventStore.on('ManageSignatures', onManageSignatures);
        
        onResize = viewer.onResize.add(handleResize);
    }

    function detachEvents() {
        viewer.eventStore.off('CreateSignature', createNewSignature);
        viewer.eventStore.off('ManageSignatures', onManageSignatures);
        
        viewer.onResize.remove(onResize);
        onResize = undefined;
    }

    function initModule() {
        nodes.$overlay = $elem.find('[data-pcc-overlay]');
        nodes.$backing = $elem.find('[data-pcc-overlay-backing]');
        nodes.$container = $elem.find('[data-pcc-overlay-container]');
        nodes.$content = $elem.find('[data-pcc-overlay-content]');
        
        nodes.$viewContainer = $elem.find('[data-pcc-view-container]');
    }

    /**
     * @method module:profile-manager#destroy
     * @description Destroys the module.
     */
    this.destroy = function destroy() {
        destroyTemplate();
        detachEvents();
        $elem.empty();
        
        components = nodes = undefined;
    };
    
    $elem = $(options.elem);
    
    attachEvents();
}

/**
 * Created the profile manager module.
 * @param {Core} viewer The core viewer to which the module will attach.
 * @param {Object} options An options abject.
 * @param {HTMLElement} options.elem The element in which the module UI will be inserted.
 */
module.exports = function init(viewer, options) {
    return new ProfileManager(viewer, options);
};
