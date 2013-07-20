define(['jquery', 'knockout', 'socket-io', 'client/viewModel', 'client/timeout'], function($, ko, io, createViewModel, createTimeout) {
    (function(global){
        global.app = {};

        var maxReconnects = 5;

        global.app.socket = io.connect(global.location.origin, {
            'max reconnection attempts': maxReconnects,
            'sync disconnect on unload': true
        });

        $(document).ready(function() {
            app.user = JSON.parse($('#currentUser').val());
            app.inFocus = true;

            var desktopData = JSON.parse($('#desktop').val());
            var conversationData = JSON.parse($('#conversations').val());
            var groupData = JSON.parse($('#group').val());
            
            var viewModel = createViewModel(conversationData, desktopData, groupData);

            ko.applyBindings(viewModel);
            global.app.desktop = viewModel.desktop;
            
            initUi();
            
            var timeout = createTimeout(maxReconnects, global);
            timeout.startPing();
        });

        $(global).focus(function() {
            global.app.inFocus = true;
        });

        $(global).blur(function() {
            global.app.inFocus = false;
        });

        $(global).resize(function() {
            global.app.desktop.ui.resize.stripAndConvos();
            global.app.desktop.ui.resize.tilesAndConversationBodies();
        });

        function initUi(){
            global.app.desktop.ui.setup();
            showRenderedElements();
            global.app.desktop.ui.resize.tilesAndConversationBodies();
            global.app.desktop.ui.scroll.setup();
        }

        function showRenderedElements(){
            $('#main-timer').hide();
            $('.top-links').show();
            $('#content').show();
            global.app.desktop.ui.highlight();
        }
    })(window);
});