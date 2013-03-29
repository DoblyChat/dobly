function createConversationUi(getSelector) {
  var self = {};

  self.resizeBody = function() {
    var convoHeight = $('#convos').innerHeight();
    var titleHeightLeft = $(getSelector('.convo-header')).outerHeight();
    var newMessageHeightLeft = $(getSelector('.convo-new-message')).outerHeight();  
    $(getSelector('.convo-body')).height(convoHeight - titleHeightLeft - newMessageHeightLeft);
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
      $(getSelector(".nano > .pane")).hoverIntent(config);
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
      $(getSelector('.nano')).nanoScroller({ scroll: 'bottom' });
    };

    scroll.stop = function() {
      $(getSelector('.nano')).nanoScroller({ stop: true });
    };

    return scroll;
  })();

  self.highlight = function(messageCount){
    $(getSelector('.convo-body .content .message')).slice(-messageCount).effect("highlight", {}, 1000);
  }

  return self;
}