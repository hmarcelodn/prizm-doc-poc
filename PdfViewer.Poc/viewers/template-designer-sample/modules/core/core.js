/* global require, $, _, PCCViewer */

(function(window, document){
    // include Less moudes
    require('./core.less');
    
    // include the viewer init module here
    require('../common/viewer-init.js');
    
    // include the core template -- this is an underscore template
    var template = require('./core.html');
    
    // test if this browser supports media queries
    var mediaQueryCapable = (function(){
        return (window.matchMedia || window.msMatchMedia) ? true : false;
    })();
    
    // require the one-time-use modules
    var SVGIcons = require('../svg-icons/svg-icons.js');
    
    // Require core-common, which will include components
    var CoreCommon = require('../core/core-common.js');
    
    // require all of the viewer modules

    var EventStore = require('../event-store/event-store.js');
    var StateStore = require('../state-store/state-store.js');
    var FormTools = require('../form-tools/form-tools.js');
    var PageNavigation = require('../page-navigation/page-navigation.js');
    var ZoomFit = require('../zoom-fit/zoom-fit.js');
    var KeyboardController = require('../keyboard-controller/keyboard-controller.js');
    var FormController = require('../form-controller/form-controller.js');
    var FieldList = require('../field-list/field-list.js');
    var FieldEdit = require('../field-edit/field-edit.js');
    var MultipleSelection = require('../multiple-selection/multiple-selection.js');
    var TemplateIO = require('../template-io/template-io.js');
    var TemplateManager = require('../template-manager/template-manager.js');
    var Notification = require('../notification/notification.js');
    var GlobalSettingsTrigger = require('../global-settings-trigger/global-settings-trigger.js');
    var GlobalSettingsMenu = require('../global-settings-menu/global-settings-menu.js');


    /**
     * @class TemplateDesigner
     * @protected
     * @description
     * The template designer viewer constructor.
     *
     * @requires event-store
     * @requires state-store
     *
     * @requires form-tools
     * @requires page-navigation
     * @requires zoom-fit
     * @requires form-controller
     * @requires field-list
     * @requires field-edit
     * @requires multiple-selection
     * @requires notification
     * @requires template-io
     * @requires template-manager
     * @requires svg-icons
     * 
     * @requires text-input
     * @requires dropdown
     * @requires button-set
     * @requires checkbox-collection
     * @requires keyboard-controller
     *
     * @example
     * var viewer = $('#pcc-viewer').pccTemplateDesigner(options);
     */
    function TemplateDesigner(elem, options){
        var viewer = this;
        
        this.options = options;
        this.options.signatureDateFormat = this.options.signatureDateFormat || 'MM/DD/YYYY';

        var $elem = $(elem);
        $elem.addClass('pccv pcc-fullscreen');
        if (!mediaQueryCapable) {
            $elem.addClass('pcc-legacy');
        }
        this.$elem = $elem;
        
        // render the template
        $elem.html(template());

        this.viewerNodes = {
            $pageList: $elem.find('[data-pcc-pagelist]'),
            $header: $elem.find('[data-pcc-header]'),
            $formTools: $elem.find('[data-pcc-form-tools]'),
            $settingsTrigger: $elem.find('[data-pcc-settings-trigger]'),
            $pageNav: $elem.find('[data-pcc-page-nav]'),
            $zoomFit: $elem.find('[data-pcc-zoomfit]'),
            $sidebar: $elem.find('[data-pcc-sidebar]'),
            $templateManager: $elem.find('[data-pcc-template-manager]'),
            $notification: $elem.find('[data-pcc-notification]'),
            $globalSettingsMenu: $elem.find('[data-pcc-global-settings-menu]')
        };

        var parseIcons = SVGIcons.parseIcons;
        this.parseIcons = function(){
            parseIcons.apply(undefined, arguments);
            return this;
        };
        
        // initialize modules
        /**
         * @member TemplateDesigner#eventStore {module:event-store}
         */
        this.eventStore = EventStore();
        
        /**
         * @member TemplateDesigner#notification {module:notification}
        */
        this.notification = Notification(viewer, {
            elem: viewer.viewerNodes.$notification
        });

        // If unable to show the viewer because of an error, only load the modules necessary to show an error notification.
        if (options.error !== undefined) {
            viewer.eventStore.trigger('Notify', { type: 'error', message: options.error });
            return;
        }

        /**
         * @member TemplateDesigner#stateStore {module:state-store}
         */
        this.stateStore = StateStore(this);
        
        // initialize ViewerControl
        this.viewerControl = new PCCViewer.ViewerControl(this.viewerNodes.$pageList.get(0), this.options);
        
        // add all of the core-common utilities
        _.forEach(CoreCommon, function(func, name) {
            viewer[name] = func(viewer);
        });
        
        /**
         * @member TemplateDesigner#formTools {module:form-tools}
         */
        this.formTools = FormTools(this, {
            elem: this.viewerNodes.$formTools
        });
        /**
         * @member TemplateDesigner#pageNavigation {module:page-navigation}
         */
        this.pageNavigation = PageNavigation(this, {
            elem: this.viewerNodes.$pageNav
        });
        /**
         * @member TemplateDesigner#zoomFit {module:zoom-fit}
         */
        this.zoomFit = ZoomFit(viewer, {
            elem: this.viewerNodes.$zoomFit
        });
        /**
         * @member TemplateDesigner#keyboardController {module:keyboard-controller}
         */
        this.keyboardController = KeyboardController(viewer);
        /**
         * @member TemplateDesigner#formController {module:form-controller}
         */
        this.formController = FormController(viewer);
        /**
         * @member TemplateDesigner#fieldList {module:field-list}
         */
        this.fieldList = FieldList(viewer, {
            elem: this.viewerNodes.$sidebar
        });
        /**
         * @member TemplateDesigner#fieldEdit {module:field-edit}
         */
        this.fieldEdit = FieldEdit(viewer, {
            elem: this.viewerNodes.$sidebar
        });
        /**
         * @member TemplateDesigner#multipleSelection {module:multiple-selection}
         */
        this.multipleSelection = MultipleSelection(viewer, {
            elem: this.viewerNodes.$sidebar
        });
        /**
         * @member TemplateDesigner#templateIO {module:template-io}
         */
        this.templateIO = TemplateIO(viewer);
        /**
         * @member TemplateDesigner#templateManager {module:template-manager}
         */
        this.templateManager = TemplateManager(viewer, {
            elem: this.viewerNodes.$templateManager
        });

       /**
        * @member TemplateDesigner#globalSettingsTrigger {module:global-settings-trigger}
        */
        this.globalSettingsTrigger = GlobalSettingsTrigger(viewer, {
            elem: this.viewerNodes.$settingsTrigger
        });

        /**
        * @member TemplateDesigner#globalSettingsMenu {module:global-settings-menu}
        */
        this.globalSettingsMenu = GlobalSettingsMenu(viewer, {
            elem: viewer.viewerNodes.$globalSettingsMenu
        });


        /**

        /**
        * @function TemplateDesigner#destroy
        * @description
        * Destroys the viewer and all modules, and returns the parent DOM element
        * to its original state.
        */
        this.destroy = function destroy(){
            // destroy all modules
            viewer.formTools.destroy();
            viewer.pageNavigation.destroy();
            viewer.zoomFit.destroy();
            viewer.formController.destroy();
            viewer.fieldList.destroy();
            viewer.fieldEdit.destroy();
            viewer.multipleSelection.destroy();
            viewer.templateManager.destroy();
            viewer.templateIO.destroy();
            viewer.notification.destroy();
            viewer.globalSettingsTrigger.destroy();
            viewer.globalSettingsMenu.destroy();
            viewer.keyboardController.destroy();

            viewer.stateStore.destroy();
            
            viewer.onResize.destroy();
            viewer.onReady.destroy();
            
            // destroy viewer control and clear the DOM at the end
            viewer.viewerControl.destroy();
            // remove all classes that may have been added
            $elem.removeClass('pccv pcc-fullscreen pcc-legacy').empty();
            // remove all events in the event store
            viewer.eventStore.off();
        };
    }
    
    // Icons need to be initialized only once per web page.
    // However, it is safe to initialize more than once, as the module will
    // figure out that it has already executed.
    $(document).ready(function(){
        SVGIcons.init();
    });

    // Use this key to get or set the viewer object associated with DOM element 
    // in which the viewer is embedded.
    var DATAKEY = "PCCViewer.Viewer";
    
    /**
     * A jQuery plugin to initialize a new {@link TemplateDesigner} viewer.
     * @function external:"jQuery.fn"#pccTemplateDesigner
     * @param {external:"jQuery.fn"~configParameters} options
     * The configuration options used to initialize the viewer.
     * 
     * @see {@link TemplateDesigner} for an example.
     */
    // Expose the Viewer through a jQuery plugin
    $.fn.pccTemplateDesigner = function (options) {
        if (typeof options === 'undefined') {
            // If we are not given an options argument, return any existing viewer 
            // object associated with the selected element.
            return this.data(DATAKEY);
        }
        else {
            // Create a new viewer
            var viewer = new TemplateDesigner(this, options);
            this.data(DATAKEY, viewer);
            return viewer;
        }
    };
})(window, document);
