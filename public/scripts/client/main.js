define(['jquery', 'knockout', 'socket-io', 'client/viewModel', 'client/timeout', 'client/group', 'client/routing', 'client/data'], 
        function($, ko, io, createViewModel, createTimeout, createGroup, routing, data) {
    'use strict';
    
    (function(global){
        global.app = {};

        var maxReconnects = 5;

        global.app.socket = io.connect(global.location.origin, {
            'max reconnection attempts': maxReconnects,
            'sync disconnect on unload': true
        });

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
            global.app.user = data.currentUser;
            global.app.inFocus = true;
            
            global.app.group = createGroup(data.group);
            routing.bind();

            var viewModel = createViewModel(data.collaborationObjects, data.desktop);

            ko.applyBindings(viewModel);
            global.app.desktop = viewModel.desktop;

            initUi();
            
            var timeout = createTimeout(maxReconnects, global);
            timeout.startPing();
        }

        function initUi(){
            routing.routeTo('desktop');
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