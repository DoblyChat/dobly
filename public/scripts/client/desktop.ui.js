function createDesktopResize(desktop) {
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
      desktop.leftConversation().resize.body();
    }
    
    if (desktop.hasRightConversation()) {
      desktop.rightConversation().resize.body();
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
};

function createDesktopScroll(desktop) {
  var scr = {};

  scr.setup = function() {
    scr.setupConvos();
    scr.tiles();
  };

  scr.setupConvos = function(){
    if (desktop.hasLeftConversation()) {
      desktop.leftConversation().scroll.setup();
    }
    
    if (desktop.hasRightConversation()) {
      desktop.rightConversation().scroll.setup();
    }
  }

  scr.tiles = function() {
    $('#convo-tiles').nanoScroller({ sliderMaxHeight: 300, alwaysVisible: true });
  };

  scr.bottomTile = function() {
    $('#convo-tiles').nanoScroller({ scroll: 'bottom' });
  }

  return scr;
};

function setupStripDragAndDrop(desktop){
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