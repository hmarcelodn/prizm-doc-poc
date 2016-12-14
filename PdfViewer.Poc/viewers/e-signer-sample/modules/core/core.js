/* global require, $, _, PCCViewer */

// this viewer uses fonts, so include them first
require('../common/_fonts.less');

(function(window, document){
    // include Less modules
    require('./core.less');

    // include the viewer init module here
    require('../common/viewer-init.js');

    // include the core template -- this is an underscore template
    var template = require('./core.html');

    // test if this browser supports media queries
    var mediaQueryCapable = (function(){
        return (window.matchMedia || window.msMatchMedia) ? true : false;
    })();

    // require the data persistence module
    var DataPersist = require('../data-persist/data-persist.js');
    
    // require the one-time-use modules
    var SVGIcons = require('../svg-icons/svg-icons.js');
    
    // Require core-common, which will include components
    var CoreCommon = require('../core/core-common.js');
    
    // require all of the viewer modules
    var EventStore = require('../event-store/event-store.js');
    var StateStore = require('../state-store/state-store.js');
    var FormSummary = require('../form-summary/form-summary.js');
    var PageNavigation = require('../page-navigation/page-navigation.js');
    var ZoomFit = require('../zoom-fit/zoom-fit.js');
    var FormController = require('../fill-form-controller/fill-form-controller.js');
    var Checklist = require('../fill-checklist/fill-checklist.js');
    var TemplateIO = require('../template-io/template-io.js');
    var TemplateNameHeader = require('../template-name-header/template-name-header.js');
    var ProfileManager = require('../profile-manager/profile-manager.js');
    var MainToolBar = require('../fill-main-toolbar/fill-main-toolbar.js');
    var FillProgress = require('../fill-progress/fill-progress.js');
    var DownloadSignedFormTrigger = require('../download-signed-form-trigger/download-signed-form-trigger.js');
    var DownloadSignedForm = require('../download-signed-form/download-signed-form.js');
    var DatePicker = require('../date-picker/date-picker.js');
    var KeyboardController = require('../keyboard-controller/keyboard-controller.js');
    var Notification = require('../notification/notification.js');

    /**
     * @class ESigner
     * @protected
     * @description
     * The e-signer viewer constructor.
     *
     * @requires event-store
     * @requires state-store
     *
     * @requires page-navigation
     * @requires zoom-fit
     * @requires template-io
     * @requires fill-form-controller
     * @requires template-name-header
     * @requires svg-icons
     * @requires data-persist
     * @requires profile-manager
     * @requires fill-main-toolbar
     * @requires fill-checklist
     * @requires fill-progress
     * @requires download-signed-form-trigger
     * @requires download-signed-form
     * @requires date-picker
     * @requires keyboard-controller
     * @requires notification
     *
     * @requires text-input
     * @requires dropdown
     * @requires button-set
     * @requires checkbox-collection
     *
     * @example
     * var viewer = $('#pcc-viewer').pccESigner(options);
     */
    function ESigner(elem, options){

        var viewer = this;

        this.options = options;

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
            $toolbarset: $elem.find('[data-pcc-toolbarset]'),
            $pageNav: $elem.find('[data-pcc-page-nav]'),
            $zoomFit: $elem.find('[data-pcc-zoomfit]'),
            $sidebar: $elem.find('[data-pcc-sidebar]'),
            $profile: $elem.find('[data-pcc-profile]'),
            $fillProgress: $elem.find('[data-pcc-fillprogress]'),
            $downloadSignedFormTrigger: $elem.find('[data-pcc-downloadsignedformtrigger]'),
            $downloadSignedForm: $elem.find('[data-pcc-download-signed-form-dialog]'),
            $notification: $elem.find('[data-pcc-notification]')
        };

        var parseIcons = SVGIcons.parseIcons;
        this.parseIcons = function(){
            parseIcons.apply(undefined, arguments);
            return this;
        };

        // initialize modules
        /**
         * @member ESigner#eventStore {module:event-store}
         */
        this.eventStore = EventStore();

        /**
         * @member ESigner#notification {module:notification}
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
         * @member ESigner#stateStore {module:state-store}
         */
        this.stateStore = StateStore(this);

        // initialize ViewerControl
        this.viewerControl = new PCCViewer.ViewerControl(this.viewerNodes.$pageList.get(0), this.options);

        // add all of the core-common utilities
        _.forEach(CoreCommon, function(func, name) {
            viewer[name] = func(viewer);
        });

        /**
         * @member ESigner#formSummary {module:form-summary}
         */
        this.formSummary = FormSummary(this);
        /**
         * @member ESigner#pageNavigation {module:page-navigation}
         */
        this.pageNavigation = PageNavigation(this, {
            elem: this.viewerNodes.$pageNav
        });
        /**
         * @member ESigner#zoomFit {module:zoom-fit}
         */
        this.zoomFit = ZoomFit(viewer, {
            elem: this.viewerNodes.$zoomFit
        });
        /**
         * @member ESigner#formController {module:form-controller}
         */
        this.formController = FormController(viewer);
        /**
         * @member ESigner#checklist {module:fill-checklist}
         */
        this.checklist = Checklist(viewer, {
            elem: this.viewerNodes.$sidebar
        });
        /**
         * @member ESigner#mainToolBar {module:fill-main-toolbar}
         */
        this.mainToolBar = MainToolBar(viewer, {
            elem: this.viewerNodes.$toolbarset
        });
        /**
         * @member ESigner#templateIO {module:template-io}
         */
        this.templateIO = TemplateIO(viewer);
        /**
         * @member ESigner#templateNameHeader {module:template-name-header}
         */
        this.templateNameHeader = TemplateNameHeader(viewer, {
            elem: viewer.viewerNodes.$header
        });
        /**
         * @member ESigner#profileManager {module:profile-manager}
         */
        this.profileManager = ProfileManager(viewer, {
            elem: viewer.viewerNodes.$profile
        });
        /**
         * @member ESigner#dataPersist {module:data-persist}
         */
        this.dataPersist = DataPersist(viewer);
        /**
         * @member ESigner#fillProgress {module:fill-progress}
         */
        this.fillProgress = FillProgress(viewer, {
            elem: this.viewerNodes.$fillProgress
        });
        /**
         * @member ESigner#datePicker {module:date-picker}
         */
        this.datePicker = DatePicker(viewer, {
            dateFormat: options.dateFormat || 'MM/DD/YYYY'
        });
        /**
         * @member ESigner#downloadSignedFormTrigger {module:download-signed-form-trigger}
         */
        this.downloadSignedFormTrigger = DownloadSignedFormTrigger(viewer, {
            elem: this.viewerNodes.$downloadSignedFormTrigger
        });
        /**
         * @member ESigner#downloadSignedForm {module:download-signed-form}
         */
        this.downloadSignedForm = DownloadSignedForm(viewer, {
            elem: this.viewerNodes.$downloadSignedForm
        });
        /**
         * @member ESigner#keyboardController {module:keyboard-controller}
         */
        this.keyboardController = KeyboardController(viewer);
        
        function onStateModified(ev, data) {
            if (data.state !== 'ChecklistVisibility') { return; }
            
            if (data.stateValue) {
                viewer.viewerNodes.$pageList.addClass('pcc-sidebar-offset');
                viewer.viewerNodes.$sidebar.addClass('pcc-open');
            } else {
                viewer.viewerNodes.$pageList.removeClass('pcc-sidebar-offset');
                viewer.viewerNodes.$sidebar.removeClass('pcc-open');
            }

            if (viewer.viewerControl.getPageLayout() === PCCViewer.PageLayout.Vertical) {
                viewer.viewerControl.fitContent(PCCViewer.FitType.FullWidth);
            }
        }

        function attachEvents() {
            viewer.eventStore.on('ModifyState', onStateModified);
        }

        function detachEvents() {
            viewer.eventStore.off('ModifyState', onStateModified);
        }

        attachEvents(viewer);

        /**
         * @function ESigner#destroy
         * @description
         * Destroys the viewer and all modules, and returns the parent DOM element
         * to its original state.
         */
        this.destroy = function destroy(){
            // destroy all modules
            detachEvents();
            viewer.formSummary.destroy();
            viewer.pageNavigation.destroy();
            viewer.zoomFit.destroy();
            viewer.formController.destroy();
            viewer.checklist.destroy();
            viewer.mainToolBar.destroy();
            viewer.templateIO.destroy();
            viewer.templateNameHeader.destroy();
            viewer.fillProgress.destroy();
            viewer.downloadSignedFormTrigger.destroy();
            viewer.downloadSignedForm.destroy();
            viewer.keyboardController.destroy();

            viewer.stateStore.destroy();
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

    // Use this key to get or set the viewer object associated with DOM element in which the viewer is embedded.
    var DATAKEY = "PCCViewer.Viewer";

    /**
     * A jQuery plugin to initialize a new {@link ESigner} viewer.
     * @function external:"jQuery.fn"#pccESigner
     * @param {external:"jQuery.fn"~configParameters} options
     * The configuration options used to initialize the viewer.
     *
     * @see {@link ESigner} for an example.
     */
    $.fn.pccESigner = function (options) {
        if (typeof options === 'undefined') {
            // If we are not given an options argument, return any existing viewer object associated with the
            // selected element.
            return this.data(DATAKEY);
        }
        else {
            // Create a new viewer
            var viewer = new ESigner(this, options);
            this.data(DATAKEY, viewer);
            return viewer;
        }
    };
})(window, document);
