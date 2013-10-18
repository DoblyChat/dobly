define(['jquery', 'nanoscroller', 'hoverIntent'], function($){
    'use strict';
    
    return function () {
        var self = {};

        self.init = function(getSelector){
            self.getSelector = getSelector;
        };

        self.resizeBody = function() {
            var collaborationObjectHeight = $('#collaboration-objects').innerHeight();
            var headerHeight = headerOuterHeight();
            var footerHeight = $(self.getSelector('.collaboration-object-footer')).outerHeight();  
            $(self.getSelector('.collaboration-object-body')).height(collaborationObjectHeight - headerHeight - footerHeight);
        };

        function headerOuterHeight() {
            return $(self.getSelector('.collaboration-object-header')).outerHeight();
        }

        self.bodyHeight = function() {
            return $(self.getSelector('.collaboration-object-body')).height();
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

            var scrollOffset = $(self.getSelector('.collaboration-object-body > .content')).scrollTop();
            self.resizeBody();
            self.scroll.adjustToOffset(scrollOffset + (newHeaderHeight - origHeaderHeight));
        };

        self.toggleInfo = function(){
            self.resizeBodyFromHeaderChange(function() {
                $(self.getSelector('.collaboration-object-header > .info')).toggle();
                $(self.getSelector('.collaboration-object-header > .search')).hide();
            });
        };

        self.highlight = function(messageCount) {
            $(self.getSelector('.collaboration-object-body .content .item'))
                .slice(-messageCount)
                .effect("highlight", { color: '#E5FBFF' }, 2000);
        };

        return self;
    };
});

