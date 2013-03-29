function createDesktopUi(desktop){
  var self = {};

  self.resize = (function createDesktopResize() {
    var res = {};

    res.stripAndConvos = function() {
      var includeMargin = true;
      var bodyHeight = $('body').outerHeight(includeMargin);
      var headerHeight = $('#header').outerHeight(includeMargin);
      var convosMargin = $('#convos').outerHeight(includeMargin) - $('#convos').innerHeight();

      var height = bodyHeight - headerHeight - convosMargin;
      $('#convos').height(height);
      $('#strip').height(height);
    };

    res.conversationBodies = function() {
      if (desktop.hasLeftConversation()) {
        desktop.leftConversation().ui.resizeBody();
      }
      
      if (desktop.hasRightConversation()) {
        desktop.rightConversation().ui.resizeBody();
      }
    };

    function tiles() {    
      var stripHeight = $('#strip').outerHeight();
      var newTileHeight = $('#new-convo-tile').outerHeight();

      $('#convo-tiles').height(stripHeight - newTileHeight);
    };

    res.tilesAndConversationBodies = function() {
      res.conversationBodies();
      tiles();
    };

    return res;
  })();

  self.scroll = (function createDesktopScroll() {
    var scr = {};

    scr.setup = function() {
      scr.setupConvos();
      scr.tiles();
    };

    scr.setupConvos = function(){
      if (desktop.hasLeftConversation()) {
        desktop.leftConversation().ui.scroll.setup();
      }
      
      if (desktop.hasRightConversation()) {
        desktop.rightConversation().ui.scroll.setup();
      }
    }

    scr.tiles = function() {
      $('#convo-tiles').nanoScroller({ sliderMaxHeight: 300, alwaysVisible: true });
    };

    scr.bottomTile = function() {
      $('#convo-tiles').nanoScroller({ scroll: 'bottom' });
    }

    return scr;
  })();

  self.highlight = function(){
    var leftObs = desktop.leftConversation;
    var rightObs = desktop.rightConversation;

    setTimeout(function(){
      if (desktop.hasLeftConversation() && leftObs().unreadCounter() > 0) {
        leftObs().ui.highlight(leftObs().unreadCounter());
      }
      
      if (desktop.hasRightConversation() && rightObs().unreadCounter() > 0) {
        rightObs().ui.highlight(rightObs().unreadCounter());
      }
    }, 200);
  };

  self.setupStripDragAndDrop = function (){
    var currentSort;

    $('#convo-tiles .content').sortable({      
      handle: ".icon-move-handle",
      start: function(event, ui){
        currentSort = { startIndex: ui.item.index(), stopIndex: -1 };
      },
      stop: function(event, ui){
        currentSort.stopIndex = ui.item.index();

        if (currentSort.startIndex !== currentSort.stopIndex) {
          app.socket.emit('update_strip_order', { id: desktop.id, currentSort: currentSort });
          var conversation = desktop.conversations()[currentSort.startIndex];
          reorder(conversation);
          if (conversation.active()) {
            desktop.changeActiveConversations(currentSort.stopIndex);
          }
          else {
            checkIfItNeedsToBeActivated();
          }
        }
      },
    });

    function reorder(conversation) {      
      desktop.conversations.splice(currentSort.startIndex, 1);
      desktop.conversations.splice(currentSort.stopIndex, 0, conversation);
    }

    function checkIfItNeedsToBeActivated() {
      var leftActiveIndex = desktop.conversations.indexOf(desktop.leftConversation());

      if (movedAfterActiveConversation(leftActiveIndex)) {
        desktop.changeActiveConversations(leftActiveIndex);
      }

      function movedAfterActiveConversation(leftActiveIndex){
        return leftActiveIndex + 1 === currentSort.stopIndex;
      }
    }

    $('#convo-tiles').disableSelection();
  };

  $(window).load(function() {
    self.resize.tilesAndConversationBodies();
    self.scroll.setup();
  });

  $(window).resize(function() {
    self.resize.stripAndConvos();
    self.resize.tilesAndConversationBodies();
  });

  self.setup = function(){
    self.resize.stripAndConvos();
    self.setupStripDragAndDrop();
  }

  self.updateConversationUi = function(){
    self.resize.conversationBodies();
    self.scroll.setupConvos();
    self.highlight();
  };

  self.show = function(){
    self.resize.tilesAndConversationBodies();
    self.scroll.setup();
    self.setupStripDragAndDrop();
  }

  return self;
}