function createConversationResizing(getSelector) {
  var self = {};

  self.body = function() {
    var convoHeight = $('#convos').innerHeight();
    var titleHeightLeft = $(getSelector('.convo-header')).outerHeight();
    var newMessageHeightLeft = $(getSelector('.convo-new-message')).outerHeight();  
    $(getSelector('.convo-body')).height(convoHeight - titleHeightLeft - newMessageHeightLeft);
  };

  return self;
}

function createConversationScrolling(getSelector) {
  var self = {};

  self.setup = function() {
    self.adjust();
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

  self.adjust = function() {
    $(getSelector('.nano')).nanoScroller({ scroll: 'bottom' });
  };

  self.stop = function() {
    $(getSelector('.nano')).nanoScroller({ stop: true });
  };

  return self;
}

function createConversationHighlight(getSelector){
  var self = {};

  self.highlight = function(messageCount){
    $(getSelector('.convo-body .content .message')).slice(-messageCount).effect("highlight", {}, 1000);
  }

  return self;
}