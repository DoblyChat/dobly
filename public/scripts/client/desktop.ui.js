function createDesktopResize(desktop) {
  var res = {};

  res.dualConvo = function() {
    var includeMargin = true;
    var bodyHeight = $('body').outerHeight(includeMargin);
    var headerHeight = $('#header').outerHeight(includeMargin);
    var stripHeight = $('#strip').outerHeight(includeMargin);
    var convosMargin = $('#convos').outerHeight(includeMargin) - $('#convos').innerHeight();

    $('#convos').height(bodyHeight - headerHeight - stripHeight - convosMargin);
  };

  res.convoBody = function() {
    if (desktop.hasLeftConversation()) {
      desktop.leftConversation().resize.body();
    }
    
    if (desktop.hasRightConversation()) {
      desktop.rightConversation().resize.body();
    }
  };

  res.strip = function() {
    var tileWidth = $('#new-convo-tile').outerWidth();
    var standardMargin = 10;
    var newConvoTile = 1;
    var tileCount = desktop.conversations().length + newConvoTile;
    $('#strip').width((tileWidth * tileCount) + (standardMargin * (tileCount - 1)));
  };

  return res;
};

function createDesktopScroll(desktop) {
  var scr = {};

  scr.setup = function() {
    if (desktop.hasLeftConversation()) {
      desktop.leftConversation().scroll.setup();
    }
    
    if (desktop.hasRightConversation()) {
      desktop.rightConversation().scroll.setup();
    }
  };

  return scr;
};

function setupStripDragAndDrop(desktop){
  var currentSort;

  $('#convo-tiles').sortable({      
    handle: ".icon-move-handle",
    start: function(event, ui){
      currentSort = { startIndex: ui.item.index(), stopIndex: -1 };
    },
    stop: function(event, ui){
      currentSort.stopIndex = ui.item.index();

      if (currentSort.startIndex !== currentSort.stopIndex) {
        socket.emit('update_strip_order', { id: desktop.id, currentSort: currentSort });
        var conversation = desktop.conversations()[currentSort.startIndex];
        reorder(conversation);
        if (conversation.active()) {
          changeActiveConversations(currentSort.stopIndex);
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

    if (movedToTheRightOfActiveConversation(leftActiveIndex)) {
      if (desktop.hasRightConversation()) {
        desktop.rightConversation().deactivate();
      }
      activateRightConversationBy(leftActiveIndex + 1);
    }

    function movedToTheRightOfActiveConversation(leftActiveIndex){
      return leftActiveIndex + 1 === currentSort.stopIndex;
    }
  }

  $('.film-strip').disableSelection();
};