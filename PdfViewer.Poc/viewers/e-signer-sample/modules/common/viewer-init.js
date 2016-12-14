/* global $, jQuery, _, require */

var sampleConfig = require('./sample-config.js');
var pccESignerElement;
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
    var pccESigner = pccESignerElement.pccESigner(options);
    if(options.onViewerCreation){
        options.onViewerCreation(pccESigner);
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
        documentID: args[0],
        language: args[1],
        formDefinitionId: args[2],
        formRoleId: args[3]
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
    var filename = (window.pccViewerConfig && window.pccViewerConfig.templateDocumentId) ? window.pccViewerConfig.templateDocumentId : query.document;
    var form = (window.pccViewerConfig && window.pccViewerConfig.formDefinitionId) ? window.pccViewerConfig.formDefinitionId : query.form;
    var formRole = (window.pccViewerConfig && window.pccViewerConfig.formRoleId) ? window.pccViewerConfig.formRoleId : query.role;
    
    var demoConfig = {
        imageHandlerUrl: sampleConfig.imageHandlerUrl,
        resourcePath: sampleConfig.resourcePath
    };

    _.extend(demoConfig, customConfig);
    
    $.when(getJson(sampleConfig.languageFile)).done(function (language) {
        if (!form) {
            embedViewer({error: language.errorFormNotSpecified});
            return;
        }

        $.when(
            demoConfig.documentID || (filename ? createSessionFromName(filename, language.errorFormNotFound) : createSessionFromForm(form, language.errorFormNotFound)), // args[1]
            language, // args[1]
            form, // args[2]
            formRole, // args[3]
            demoConfig)
            .done(buildViewerOptions);
    });
}

$(document).ready(function(){
    pccESignerElement = $('#pcc-viewer');
    // Checking if pcc-viewer element exist in the DOM
    // if not - custom embedding can be used
    if(pccESignerElement.length){
        getResourcesAndEmbedViewer();
    }
});
