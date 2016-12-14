/* global $, jQuery, _, require */

var sampleConfig = require('./sample-config.js');
var pccTemplateDesignerElement;
var customConfig = window.pccViewerConfig || {};
// extend the sample config with all of the custom options
_.extend(sampleConfig, customConfig);

var query = (function parseQuery(){
    var query = {};
    var temp = window.location.search.substring(1).split('&');
    for (var i = temp.length; i--;) {
        var q = temp[i].split('=');
        query[q.shift()] = decodeURIComponent(q.join('='));
    }
    return query;
})();

function embedViewer(options) {
    var pccTemplateDesigner = pccTemplateDesignerElement.pccTemplateDesigner(options);
    if(options.onViewerCreation){
        options.onViewerCreation(pccTemplateDesigner);
    }
}

function createSessionFromName(filename, errorMessage) {
    return $.ajax({
        url: sampleConfig.imageHandlerUrl + '/CreateSession',
        data: {
            document: filename
        },
        cache: false
    }).then(
        function success(response) {
            return response.viewingSessionId || response.documentID;
        },
        function error(response) {
            embedViewer({error: errorMessage});
        }
    );
}
function createSessionFromForm(formDefinitionId, errorMessage) {
    return $.ajax({
        url: sampleConfig.imageHandlerUrl + '/CreateSession',
        data: {
            form: formDefinitionId
        },
        cache: false
    }).then(
        function success(response) {
            return response.viewingSessionId || response.documentID;
        },
        function error(response) {
            embedViewer({error: errorMessage});
        }
    );
}

function buildViewerOptions(){
    var args = [].slice.call(arguments);

    var optionsOverride = args.pop(); // always next to last arg

    var options = {
        documentDisplayName: args[0],
        documentID: args[1],
        language: args[2],
        templateDocumentId: args[0],
        formDefinitionId: args[3]
    };

    embedViewer(_.extend(options, optionsOverride));
}

function getJson(fileName) {
    return jQuery.ajax({ url: fileName })
        .then(
            function success(response) {
                // IIS Express will not use the correct MIME type for json, so we may need to parse it as a string        
                if (typeof response === 'string') {
                    return JSON.parse(response);
                }

                return response;
            },
            function error() {
                embedViewer({error: 'Unable to load ' + fileName});
            }
        );
}

function getResourcesAndEmbedViewer() {
    var filename = (window.pccViewerConfig && window.pccViewerConfig.templateDocumentId) ? window.pccViewerConfig.templateDocumentId : query.document || 'sample.doc';
    var form = (window.pccViewerConfig && window.pccViewerConfig.formDefinitionId) ? window.pccViewerConfig.formDefinitionId : query.form;
    
    var demoConfig = {
        imageHandlerUrl: sampleConfig.imageHandlerUrl,
        resourcePath: sampleConfig.resourcePath,
        signatureDateFormat: 'MM/DD/YYYY',
        markHandleMode: 'HideCornerHandlesWhenClose',
        languageFile: sampleConfig.languageFile
    };
    
    _.extend(demoConfig, customConfig);
    
    $.when(getJson(sampleConfig.languageFile)).done(function (language) {
        $.when(
            filename, // args[0]
            demoConfig.documentID || (form? createSessionFromForm(form, language.errorFormNotFound) : createSessionFromName(filename, language.errorFormNotFound)), // args[1]
            language, // args[2]
            form,
            demoConfig)
            .done(buildViewerOptions);
    });
}

$(document).ready(function(){
    pccTemplateDesignerElement = $('#pcc-viewer');
    // Checking if pcc-viewer element exist in the DOM
    // if not - custom embedding can be used
    if(pccTemplateDesignerElement.length) {
        getResourcesAndEmbedViewer();
    }
});
