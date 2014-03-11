define(['jquery', 'knockout', 'client/viewModel', 'client/timeout', 'client/routing', 'client/data'], 
        function($, ko, createViewModel, createTimeout, routing, data) {
    'use strict';
    
    (function(global){
        global.app = {};

        var maxReconnects = 5;

        $(global)
            .focus(function() {
                global.app.inFocus = true;
            })
            .blur(function() {
                global.app.inFocus = false;
            })
            .resize(function() {
                global.app.desktop.ui.resize.stripAndCollaborationObjects();
                global.app.desktop.ui.resize.tilesAndCollaborationObjectBodies();
            });

        function start(){
            global.app.inFocus = true;
            
            routing.bind();

            var viewModel = createViewModel(data.collaborationObjects, data.desktop);

            ko.applyBindings(viewModel);
            global.app.desktop = viewModel.desktop;

            initUi();
            
            var timeout = createTimeout(global);
            timeout.startPing();
        }

        function initUi(){
            routing.routeTo('conversations');
            global.app.desktop.ui.setup();
            showRenderedElements();
            global.app.desktop.ui.resize.tilesAndCollaborationObjectBodies();
            global.app.desktop.ui.scroll.setup();
        }

        function showRenderedElements(){
            $('#main-timer').hide();
            $('.top-links').show();
            $('#content').show();
            global.app.desktop.ui.highlight();
        }

        start();
    })(window);
});