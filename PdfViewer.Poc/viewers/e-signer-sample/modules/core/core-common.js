/* global module, require, _, $, PCCViewer */
/* jshint -W030 */

// require all of the reusable component modules
var TextInput = require('../elements/text-input.js');
var Dropdown = require('../elements/dropdown.js');
var ButtonSet = require('../elements/button-set.js');
var CheckboxCollection = require('../elements/checkbox-collection.js');

function ResizeTracker () {
    // Track all of the window resize callbacks so they can be detatched
    // when the viewer is destroyed.
    var windowResizeCallbacks = [],
        $window = $(window);

    // onWindowResize
    // Attach the supplied callback to jQuery's window resize event.
    // The callback is debounced at 300ms. This means that the callback
    // will be called only one time for any sequence of resize events where
    // each happens within 300ms of the previous event.
    function onWindowResize (callback) {
        var timeout;

        var debouncedCallback = function () {
            if (timeout) {
                clearTimeout(timeout);
            }

            timeout = setTimeout(callback, 300);
        };

        $window.on('resize', debouncedCallback);
        windowResizeCallbacks.push(debouncedCallback);

        return debouncedCallback;
    }
    
    this.add = onWindowResize;
    this.remove = function(func) {
        $window.off('resize', func);
    };
    this.destroy = function() {
        // detach window resize callbacks
        _.each(windowResizeCallbacks, function(cb) {
            $window.off('resize', cb);
        });
    };
}

function BreakpointDetection(viewer) {
    // Breakpoint detection in JS, to ensure that we can provide necessary behavior 
    // when appropriate.
    var breakpointEnum = {
        mobile: 'mobile',
        desktop: 'desktop',
        initial: 'initial'
    };
    
    var $detector = $(document.createElement('div'))
        .addClass('pcc-breakpoint-trigger')
        .appendTo(viewer.$elem);
    
    // Create a new resize tracker to use here, so there are no external dependencies
    var resizeTracker = new ResizeTracker();
    // Keep track of the last known breakpoint, so we can have fast lookups
    var latestBreakpoint = breakpointEnum.initial;
    
    function getBreakpoint() {
        var breakpoint = breakpointEnum.initial;

        // Chances are good that browsers with no getComputedStyle also don't support media queries.
        if (window.getComputedStyle) {
            var tag = window.getComputedStyle($detector.get(0),':after').getPropertyValue('content') || '';
            tag = tag.replace(/["']/g,''); // remove quotes in browsers that return them
            breakpoint = breakpointEnum[tag] || breakpoint;
        }

        latestBreakpoint = breakpoint;
        return breakpoint;
    }
    
    // Set the initial value
    latestBreakpoint = getBreakpoint();
    
    resizeTracker.add(function() {
        // Update the breakpoint when the window resizes.
        // This will be throttled a bit to same some costs on rapid events.
        getBreakpoint();
    });
    
    function destroy() {
        $detector.remove();
        resizeTracker.destroy();
    }
    
    return {
        values: breakpointEnum,
        latest: function getLatestBReakpoint() {
            return latestBreakpoint;
        },
        get: getBreakpoint,
        destroy: destroy
    };
}

function BeforeUnloadTracker() {

    // Track all of the window beforeunload callbacks so they can be detatched
    // when the viewer is destroyed.
    var windowBeforeUnloadCallbacks = [],
        $window = $(window);

    this.add = function (func) {
        windowBeforeUnloadCallbacks.push(func);
        $window.on('beforeunload', func);

        return func;
    };

    this.remove = function (func) {
        $window.off('beforeunload', func);
    };

    this.destroy = function () {
        // detach window beforeunload callbacks
        _.each(windowBeforeUnloadCallbacks, function(cb) {
            $window.off('beforeunload', cb);
        });
    };
}

function parseComponents(parent) {
    return _.reduce($(parent).find('[data-pcc-component]'), function(seed, el, i){
        var data = $(el).data(),
            name = data.pccName,
            type = data.pccComponent;

        switch (type) {
            case 'textinput':
                seed[name] = TextInput(el);
                break;
            case 'dropdown':
                seed[name] = Dropdown(el);
                break;
            case 'buttonset':
                seed[name] = ButtonSet(el);
                break;
            case 'checkboxcollection':
                seed[name] = CheckboxCollection(el);
                break;
        }

        return seed;
    }, {});
}

function OnReadyTracker(viewer) {
    var isReady = false;
    var viewerReadyQueue = [];
    
    var onViewerReady = function(){
        viewer.viewerControl.off(PCCViewer.EventType.ViewerReady, onViewerReady);
        viewer.isReady = true;

        // run all function queued for ViewerReady
        while(viewerReadyQueue.length) {
            viewerReadyQueue.pop()();
        }
    };

    viewer.viewerControl.on(PCCViewer.EventType.ViewerReady, onViewerReady);
    
    this.add = function(func) {
        if (typeof func !== 'function') { return; }

        if (isReady) {
            func();
        } else {
            viewerReadyQueue.push(func);
        }
    };
    this.destroy = function() {
        viewer.viewerControl.off(PCCViewer.EventType.ViewerReady, onViewerReady);    
    };
}

function OnPageCountReadyTracker(viewer) {
    var isReady = false;
    var pageCountReadyQueue = [];

    var onPageCountReady = function(){
        viewer.viewerControl.off(PCCViewer.EventType.PageCountReady, onPageCountReady);
        viewer.isPageCountReady = true;

        // run all function queued for PageCountReady
        while(pageCountReadyQueue.length) {
            pageCountReadyQueue.pop()();
        }
    };

    viewer.viewerControl.on(PCCViewer.EventType.PageCountReady, onPageCountReady);

    this.add = function(func) {
        if (typeof func !== 'function') { return; }

        if (isReady) {
            func();
        } else {
            pageCountReadyQueue.push(func);
        }
    };
    this.destroy = function() {
        viewer.viewerControl.off(PCCViewer.EventType.PageCountReady, onPageCountReady);
    };
}

function InteractionDismiss(viewer) {
    var viewerDom = viewer.$elem;
    
    // generate a new instance every time this function is called
    // it needs access to the dom element in which the viewing client is embedded
    return (function (){
        var onDismiss,
            noop = function(){};

        // keep track of window resizing and scrolling, so they can be trottled a bit
        var scrollTimeout,
            resizeTimeout,
            onScrollDismiss;

        function trackScroll(){
            if (scrollTimeout) {
                // don't register a new timeout if there is already one
                return;
            }

            // dismiss in a short amount of time
            scrollTimeout = setTimeout(function() {
                scrollTimeout = undefined;
                onScrollDismiss();
            }, 100);
        }
        function trackResize(){
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
                scrollTimeout = undefined;
            }

            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
                resizeTimeout = undefined;
            }

            // Overload the dismiss function. On mobile devices, opening the keyboard will trigger
            // a scroll and page resize -- note, this happens on Android but not iOS. When scroll happens
            // together with a page resize, do not dismiss. It is most likely due to the touch keboard opening
            // on the device.
            var origOnScrollDismiss = onScrollDismiss;
            onScrollDismiss = noop;
            resizeTimeout = setTimeout(function(){
                onScrollDismiss = origOnScrollDismiss;
            }, 800);
        }

        // keep track of the DOM element that will scroll, so we don't query for it multiple times
        // this will be the list of pages div
        var $scrollDom;

        function removeActiveListeners() {
            $(window).off('resize', trackResize);
            $scrollDom && $scrollDom.off('scroll', trackScroll);
            scrollTimeout = resizeTimeout = undefined;
            onDismiss = onScrollDismiss = noop;
        }

        return {
            add: function(dismissFunc) {
                $scrollDom = $(viewerDom).find('.pccPageListContainerWrapper');
                
                onDismiss = function(ev) {
                    dismissFunc(ev);
                };
                
                onScrollDismiss = function(){
                    onDismiss({ type: 'scroll' });
                };
                
                // add events that will dismiss the menu
                $scrollDom.on('scroll', trackScroll);
                $(window)
                    .scroll(trackScroll)
                    .on('resize', trackResize);
            },
            remove: function(){
                removeActiveListeners();
            }
        };
    })();
}

function throttle(func, time){
    var timeout;
    time = (typeof time === 'number' && !isNaN(time)) ? time : 0;
    
    return function throttledFunc(){
        var args = arguments,
            that = this;
        
        if (!timeout) {
            timeout = setTimeout(function throttleTimeout(){
                func.apply(that, args);
                timeout = that = args = undefined;
            }, time);
        }
    };
}

function deepMerge() {

    function merge(target, source) {

        // Merging an array simply means we copy the source to the target
        if (typeof source === 'object' && source instanceof Array) {
            target = source.slice();
        }

        // This is something other than an array so we copy it directly or deep merge if necessary
        else {

            for (var key in source) {

                // Delete any value passed as undefined
                if (typeof source[key] === 'undefined') {
                    delete target[key];
                }

                // Assign primitives, non-plain objects and null directly to the target
                else if (typeof source[key] !== 'object' || !$.isPlainObject(source[key]) || !source[key]) {
                    target[key] = source[key];
                }

                // Recursively integrate plain objects to the target
                else {
                    target[key] = merge(target[key] || {}, source[key]);
                }
            }
        }

        return target;
    }

    return _.reduce(arguments, merge);
}

function shadeColor(color, percent) {   
    var f = parseInt(color.slice(1),16),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = f >> 16,
        G = f >> 8 & 0x00FF,
        B = f & 0x0000FF,
        shadedColor = (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);

    return "#" + shadedColor;
}

module.exports = {
    parseComponents: function() {
        return parseComponents;
    },
    onResize: function resizer() {
        return new ResizeTracker();
    },
    onBeforeUnload: function() {
        return new BeforeUnloadTracker();
    },
    onReady: function(viewer) {
        return new OnReadyTracker(viewer);
    },
    onPageCountReady: function(viewer) {
        return new OnPageCountReadyTracker(viewer);
    },
    interactionDismiss: function(viewer) {
        return function(){
            return InteractionDismiss(viewer);
        };
    },
    throttle: function() {
        return throttle;
    },
    deepMerge: function() {
        return deepMerge;
    },
    shadeColor: function() {
        return shadeColor;
    },
    breakpoint: function(viewer) {
        return BreakpointDetection(viewer);
    }
};

/**
 * The jQuery plugin namespace.
 * @external "jQuery.fn"
 * @see {@link http://learn.jquery.com/plugins/|jQuery Plugins}
 */

/**
 * @member external:"jQuery.fn"~configParameters
 * 
 * @property {string} documentID
 * The `viewingSessionId` to use in `ViewerControl`.
 *
 * This identifier is generated by PCCIS. (For version 1 of the PCCIS REST API, see the service
 * `POST /PCCIS/V1/ViewingSession`.)
 *
 * Sample web tiers that ship with the viewing client demonstrate how to generate a viewing session and
 * pass it to the viewer.
 *
 * **This value is always required.**
 * 
 * @property {string} [templateDocumentId]
 * This parameter will be used when creating a template in order to associate
 * the template form with a document. When opening a form, the value of this parameter
 * will be used to identify the document associated with the `formDefinition`.
 *
 * **This value is required by the {@link TemplateDesigner}.**
 * 
 * @property {string} [formDefinitionId]
 * The `formDefinitionId` to be used when opening a form. Specifying this value
 * in the {@link TemplateDesigner} will cause it to open the specific form for
 * edition, while leaving the value out will cause it to create a new form.
 *
 * **This value is required by the {@link ESigner}.**
 * 
 * @property {string} [formRoleId]
 * The `formRoleId` to be used when opening a form. Specifying this value
 * in the {@link ESigner} will cause it to only create fields assigned to the
 * given form role.
 *
 * @property {external:"jQuery.fn"~DateFormat} [signatureDateFormat="MM/DD/YYYY"]
 * Specifies the date format that is stored when saving a template. When the e-signer loads a template,
 * it displays date signatures using the date format stored in the template.
 *
 * @property {object} language
 * Specifies the language to use for the text in the viewer. Use this option to localize the viewer.
 *
 * This property should be set to the contents of the file "viewer-assets/languages/en-US.json". Both the
 * e-signer and the template-designer ship with their own version of the language file. Each viewer
 * has a different set of language strings in the language file.
 *
 * **This value is always required.**
 *
 * @property {string} [imageHandlerUrl="../pcc.ashx"]
 * The end point of the web tier services that support the viewer.
 *
 * @property {function} [onViewerCreation]
 * This function is available for both  the ESigner and the TemplateDesigner, it will trigger when the viewer's DOM is ready to use. You can use one parameter inside this function, it will be an {@link ESigner} or a {@link TemplateDesigner} object depending on which viewing client you are using.
 *
 */

/**
 * @member external:"jQuery.fn"~DateFormat
 * @type {String}
 * @description
 * The format to use when displaying a date. The table below outlines the supported date format 
 * tokens and provides example output.
 *
 * | | Token | Output |
 * | ------ |:----:| ---------------:|
 * |Month|M|1 2 ... 11 12|
 * ||MM|01 02 ... 11 12|
 * |Day|D|1 2 ... 30 31|
 * ||DD|01 02 ... 30 31|
 * |Year|YY|70 71 ... 29 30|
 * ||YYYY|1970 1971 ... 2029 2030|
 * |Hour|H|0 1 ... 22 23|
 * ||HH|00 01 ... 22 23|
 * ||h|1 2 ... 11 12|
 * ||hh|01 02 ... 11 12|
 * |Minute|m|0 1 ... 58 59|
 * ||mm|00 01 ... 58 59|
 * |AM/PM|A|AM PM|
 * ||a|am pm|
 */
