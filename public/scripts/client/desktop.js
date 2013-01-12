function createDesktop(data, conversations){
  var self = {};

  self.id = data._id;

  self.conversations = ko.observableArray([]);

  for(var i = 0; i < data.conversations.length; i++){
    var conversation = getConversationBy(data.conversations[i]);
    if(conversation){
      self.conversations.push(conversation);
    }
  }

  function getConversationBy(id){
    for(var c = 0; c < conversations.length; c++){
      if(conversations[c].id == id){
        return conversations[c];
      }
    }
  }

  self.leftConversationIndex = ko.observable(0);

  self.leftConversation = ko.computed(function(){
    return getConversationAt(self.leftConversationIndex());
  });

  self.rightConversation = ko.computed(function(){
    return getConversationAt(self.leftConversationIndex() + 1);
  });

  function getConversationAt(index){
    var conversation = self.conversations()[index];
    if(conversation){
      if(conversation.unreadCounter() > 0){
        conversation.unreadCounter(0);
        socket.emit('mark_as_read', conversation.id);
      }
    }
    return conversation;
  }

  self.hasLeftConversation = ko.computed(function(){
    return self.leftConversation() !== undefined;
  });

  self.hasRightConversation = ko.computed(function(){
    return self.rightConversation() !== undefined;
  });

  function hasConversation(conversation){
    return self.conversations.indexOf(conversation) >= 0;
  }

  self.add = function(conversation){
    if(!hasConversation(conversation)){
      self.persistNewConversation(conversation);
      self.conversations.push(conversation);
      self.resize.strip();
    }
  };

  self.addEmptyConversation = function(conversation) {
    self.conversations.push(conversation);
    self.resize.strip();
    self.focus(conversation);
    conversation.settingTopic.subscribe(function(newValue){
      self.resize.convoBody();
      self.scroll.setup();       
    });
  };

  self.persistNewConversation = function(conversation) {
    socket.emit('add_to_desktop', { id: self.id, conversationId: conversation.id });
  };

  self.addAndFocus = function(conversation){
    self.add(conversation);
    self.focus(conversation);
  }

  self.remove = function(conversation){
    socket.emit('remove_from_desktop', { id: self.id, conversationId: conversation.id });
    var index = self.conversations.indexOf(conversation);
    self.conversations.splice(index, 1);
    self.focus();
    self.resize.strip();
  };

  self.focus = function(leftConversation){
    clearFocus();

    if(leftConversation){
      self.leftConversationIndex(self.conversations.indexOf(leftConversation));
    }

    if(self.hasLeftConversation()){
      self.leftConversation().focus('#convo-left');
    }

    if(self.hasRightConversation()){
      self.rightConversation().focus('#convo-right');
    }

    updateActiveConversations();
  };

  function updateActiveConversations(){
    var activeConversations = [];
    if(self.hasLeftConversation()) activeConversations.push(self.leftConversation().id);
    if(self.hasRightConversation()) activeConversations.push(self.rightConversation().id);
    socket.emit('new_active_conversation', activeConversations);
  }

  function clearFocus(){
    ko.utils.arrayForEach(self.conversations(), function(conversation){
      conversation.resetFocus();
    });
  };

  self.resize = function() {
    var res = this;

    res.dualConvo = function() {
      var includeMargin = true;
      var bodyHeight = $('body').outerHeight(includeMargin);
      var headerHeight = $('#header').outerHeight(includeMargin);
      var stripHeight = $('#strip').outerHeight(includeMargin);
      var convosMargin = $('#convos').outerHeight(includeMargin) - $('#convos').innerHeight();

      $('#convos').height(bodyHeight - headerHeight - stripHeight - convosMargin);
    };

    res.convoBody = function() {
      if (self.hasLeftConversation()) {
        self.leftConversation().resize.body();
      }
      
      if (self.hasRightConversation()) {
        self.rightConversation().resize.body();
      }
    };

    res.strip = function() {
      var tileWidth = $('#new-convo-tile').outerWidth();
      var standardMargin = 10;
      var newConvoTile = 1;
      var tileCount = self.conversations().length + newConvoTile;
      $('#strip').width((tileWidth * tileCount) + (standardMargin * (tileCount - 1)));
    };

    return res;
  }();

  self.scroll = function() {
    var scr = this;

    scr.setup = function() {
      if (self.hasLeftConversation()) {
        self.leftConversation().scroll.setup();
      }
      
      if (self.hasRightConversation()) {
        self.rightConversation().scroll.setup();
      }
    };

    return scr;
  }();

  self.focus();

  self.setupStripDragAndDrop = function(){
    var currentSort;

    $('#convo-tiles').sortable({      
      handle: ".icon-move-handle",
      start: function(event, ui){
        currentSort = { startIndex: ui.item.index(), stopIndex: -1 };
      },
      stop: function(event, ui){
        currentSort.stopIndex = ui.item.index();
        socket.emit('update_strip_order', { id: self.id, currentSort: currentSort });
        clearFocus();
        reorder();
        self.focus();
      },
    });

    function reorder(){
      var conversation = self.conversations()[currentSort.startIndex];
      self.conversations.splice(currentSort.startIndex, 1);
      self.conversations.splice(currentSort.stopIndex, 0, conversation);
    }

    $('.film-strip').disableSelection();
  };

  return self;
}