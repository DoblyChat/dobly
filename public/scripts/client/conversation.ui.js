define(['jquery', 'client/list.ui'], function($, createListUi){
    'use strict';
    
    return function () {
        var self = createListUi();

        self.highlight = function(messageCount) {
            $(self.getSelector('.list-body .content .item'))
                .slice(-messageCount)
                .effect("highlight", { color: '#E5FBFF' }, 2000);
        };

        self.highlightTopMessages = function(messageCount) {
            $(self.getSelector('.list-body .content .item'))
                .slice(0, messageCount)
                .effect("highlight", { color: '#E5FBFF' }, 2000);
        };

        self.showSearch = function() {
            toggleSearch();

            setTimeout(function() {
                $(self.getSelector('.list-header > .search > .textbox > input')).focus();
            }, 400);
        };

        function toggleSearch() {        
            self.resizeBodyFromHeaderChange(function() {
                $(self.getSelector('.list-header > .search')).toggle();
                $(self.getSelector('.list-header > .info')).hide();
            });
        }

        self.hideSearch = function() {
            toggleSearch();
        };

        return self;
    };
});

