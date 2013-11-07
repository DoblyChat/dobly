define(['jquery'], function($){
    'use strict';
    
    return function (collaborationObjectUi) {
        var self = collaborationObjectUi || {};

        self.highlightTopMessages = function(messageCount) {
            $(self.getSelector('.collaboration-object-body .content .item'))
                .slice(0, messageCount)
                .effect("highlight", { color: '#E5FBFF' }, 2000);
        };

        self.showSearch = function() {
            toggleSearch();

            setTimeout(function() {
                $(self.getSelector('.collaboration-object-header > .search > .textbox > input')).focus();
            }, 400);
        };

        function toggleSearch() {        
            self.resizeBodyFromHeaderChange(function() {
                $(self.getSelector('.collaboration-object-header > .search')).toggle();
                $(self.getSelector('.collaboration-object-header > .info')).hide();
            });
        }

        self.hideSearch = function() {
            toggleSearch();
        };

        return self;
    };
});

