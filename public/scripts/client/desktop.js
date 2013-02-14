function createDesktop(data, allConversations){
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
    for(var c = 0; c < allConversations.length; c++){
      if(allConversations[c].id == id){
        return allConversations[c];
      }
    }
  }

  self.leftConversation = ko.observable(null);

  self.rightConversation = ko.observable(null);

  self.hasLeftConversation = ko.computed(function(){
    return self.leftConversation() !== null;
  });

  self.hasRightConversation = ko.computed(function(){
    return self.rightConversation() !== null;
  });

  function hasConversation(conversation){
    return self.conversations.indexOf(conversation) >= 0;
  }

  self.add = function(conversation){
    if(!hasConversation(conversation)){
      self.persistNewConversation(conversation);
      self.conversations.push(conversation);
      self.resize.strip();
      if (!self.hasLeftConversation() || !self.hasRightConversation()) {
        focusLastConversation();
      }
    }
  };

  function focusLastConversation() {
    if (!self.hasLeftConversation()) {
      focusLeftConversationBy(self.conversations().length - 1);
    } 
    else if (!self.hasRightConversation()) {
      focusRightConversationBy(self.conversations().length - 1);
    }

    updateActiveConversations();
  }

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

  self.addAndFocus = function(conversation) {
    self.add(conversation);
    self.focus(conversation);
  }

  self.remove = function(conversation) {
    socket.emit('remove_from_desktop', { id: self.id, conversationId: conversation.id });
    var index = self.conversations.indexOf(conversation);
    self.conversations.splice(index, 1);
    self.resize.strip();
    if(conversation.focused()) {
      removeFocused(conversation, index);
    }
  };

  function removeFocused(conversation, index) {
    conversation.resetFocus();

    if (isLeft(conversation)) {
      focusLeftConversationBy(index);      
      focusRightConversationBy(index + 1);
    }
    else if (isRight(conversation)) {
      focusRightConversationBy(index);
    }   

    updateActiveConversations();
  }

  function focusRightConversationBy(index) {
    self.rightConversation(getConversationAt(index));
    if (self.hasRightConversation()) {
      self.rightConversation().focus('#convo-right');
    }
  }

  function focusLeftConversationBy(index) {
    self.leftConversation(getConversationAt(index));
    if (self.hasLeftConversation()) {
      self.leftConversation().focus('#convo-left');
      self.leftConversation().focusElement.newMessage();
    }
  }

  function getConversationAt(index){
    if (index >= self.conversations().length) {
      return null;
    } else {
      return self.conversations()[index];
    }
  }

  function isRight(conversation) {
    return conversation === self.rightConversation();
  }

  function isLeft(conversation) {
    return conversation === self.leftConversation();
  }

  self.focus = function(conversation) {
    var index = self.conversations.indexOf(conversation);
    var leftIndex = self.conversations.indexOf(self.leftConversation());

    if (index !== leftIndex) {
      changeFocusedConversations(index);
    }
  };

  function changeFocusedConversations(leftIndex) {
    clearFocus();
    focusLeftConversationBy(leftIndex);
    focusRightConversationBy(leftIndex + 1);
  }

  function clearFocus(){
    ko.utils.arrayForEach(self.conversations(), function(conversation){
      conversation.resetFocus();
    });
  };

  self.resize = function() {
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
    var scr = {};

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

  focusLeftConversationBy(0);
  focusRightConversationBy(1);

  self.setupStripDragAndDrop = function(){
    var currentSort;

    $('#convo-tiles').sortable({      
      handle: ".icon-move-handle",
      start: function(event, ui){
        currentSort = { startIndex: ui.item.index(), stopIndex: -1 };
      },
      stop: function(event, ui){
        currentSort.stopIndex = ui.item.index();

        if (currentSort.startIndex !== currentSort.stopIndex) {
          socket.emit('update_strip_order', { id: self.id, currentSort: currentSort });
          var conversation = self.conversations()[currentSort.startIndex];
          reorder(conversation);
          if (conversation.focused()) {
            changeFocusedConversations(currentSort.stopIndex);
          }
          else {
            checkIfItNeedsFocus();
          }
        }
      },
    });

    function reorder(conversation) {      
      self.conversations.splice(currentSort.startIndex, 1);
      self.conversations.splice(currentSort.stopIndex, 0, conversation);
    }

    function checkIfItNeedsFocus() {
      var leftFocusIndex = self.conversations.indexOf(self.leftConversation());

      if (leftFocusIndex + 1 === currentSort.stopIndex) {
        if (self.hasRightConversation()) {
          self.rightConversation().resetFocus();
        }
        focusRightConversationBy(leftFocusIndex + 1);
      }
    }

    $('.film-strip').disableSelection();
  };

  return self;
}