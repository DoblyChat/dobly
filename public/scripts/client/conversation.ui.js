function createConversationUi() {
    var self = {};

    self.init = function(getSelector){
        self.getSelector = getSelector;
    };

    self.resizeBody = function() {
        var convoHeight = $('#convos').innerHeight();
        var headerHeight = headerOuterHeight();
        var footerHeight = $(self.getSelector('.convo-footer')).outerHeight();  
        $(self.getSelector('.convo-body')).height(convoHeight - headerHeight - footerHeight);
    };

    function headerOuterHeight() {
        return $(self.getSelector('.convo-header')).outerHeight();
    }

    self.bodyHeight = function() {
        return $(self.getSelector('.convo-body')).height();
    }

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
        }

        scroll.stop = function() {
            $(self.getSelector('.nano')).nanoScroller({ stop: true });
        };

        scroll.flash = function() {
            $(self.getSelector('.nano')).nanoScroller({ flash: true });
        }

        return scroll;
    })();

    self.highlight = function(messageCount) {
        $(self.getSelector('.convo-body .content .message'))
            .slice(-messageCount)
            .effect("highlight", { color: '#E5FBFF' }, 2000);
    };

    self.highlightTopMessages = function(messageCount) {
        $(self.getSelector('.convo-body .content .message'))
            .slice(0, messageCount)
            .effect("highlight", { color: '#E5FBFF' }, 2000);
    };

    self.showSearch = function() {
        toggleSearch();

        setTimeout(function() {
            $(self.getSelector('.convo-header > .search > .textbox > input')).focus();
        }, 400);
    }

    function toggleSearch() {
        var origHeaderHeight = headerOuterHeight();
        $(self.getSelector('.convo-header > div')).toggle();
        var newHeaderHeight = headerOuterHeight();

        var scrollOffset = $(self.getSelector('.convo-body > .content')).scrollTop();
        self.resizeBody();
        self.scroll.adjustToOffset(scrollOffset + (newHeaderHeight - origHeaderHeight));
    }

    self.hideSearch = function() {
        toggleSearch();
    }

    return self;
}