define(['jquery', 'nanoscroller', 'hoverIntent'], function($){
    'use strict';
    
    return function () {
        var self = {};

        self.init = function(getSelector){
            self.getSelector = getSelector;
        };

        self.resizeBody = function() {
            var listHeight = $('#lists').innerHeight();
            var headerHeight = headerOuterHeight();
            var footerHeight = $(self.getSelector('.list-footer')).outerHeight();  
            $(self.getSelector('.list-body')).height(listHeight - headerHeight - footerHeight);
        };

        function headerOuterHeight() {
            return $(self.getSelector('.list-header')).outerHeight();
        }

        self.bodyHeight = function() {
            return $(self.getSelector('.list-body')).height();
        };

        self.scroll = (function(){
            var scroll = {};

            scroll.setup = function() {
                scroll.adjust();
                setupHoverIntent();
            };

            function setupHoverIntent() {
                var config = {
                    over: thickBar,
                    timeout: 1000,
                    out: thinBar,
                };
                $(self.getSelector(".nano > .pane")).hoverIntent(config);
            }

            function thickBar() {
                $(this).addClass("thickBar");
                $(this).siblings(".pane").addClass("thickBar");
            }

            function thinBar() {
                $(this).removeClass("thickBar");
                $(this).siblings(".pane").removeClass("thickBar");
            }

            scroll.adjust = function() {
                $(self.getSelector('.nano')).nanoScroller({ scroll: 'bottom' });
            };

            scroll.adjustToOffset = function(offset){
                $(self.getSelector('.nano')).nanoScroller({ scrollTop: offset });
            };

            scroll.adjustToTop = function() {
                $(self.getSelector('.nano')).nanoScroller({ scroll: 'top' });  
            };

            scroll.stop = function() {
                $(self.getSelector('.nano')).nanoScroller({ stop: true });
            };

            scroll.flash = function() {
                $(self.getSelector('.nano')).nanoScroller({ flash: true });
            };

            return scroll;
        })();

        self.resizeBodyFromHeaderChange = function(changeHeaderHeight) {
            var origHeaderHeight = headerOuterHeight();
            changeHeaderHeight();
            var newHeaderHeight = headerOuterHeight();

            var scrollOffset = $(self.getSelector('.list-body > .content')).scrollTop();
            self.resizeBody();
            self.scroll.adjustToOffset(scrollOffset + (newHeaderHeight - origHeaderHeight));
        };

        self.toggleInfo = function(){
            self.resizeBodyFromHeaderChange(function() {
                $(self.getSelector('.list-header > .info')).toggle();
                $(self.getSelector('.list-header > .search')).hide();
            });
        };

        return self;
    };
});

