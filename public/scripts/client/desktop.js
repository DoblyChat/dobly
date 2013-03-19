function createDesktop(data, allConversations){
  var self = {};

  self.id = data._id;

  self.conversations = ko.observableArray([]);
  self.renderedConversations = ko.observableArray([]);

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
      self.scroll.tiles();
      if (!self.hasLeftConversation() || !self.hasRightConversation()) {
        activateLastConversation();
      }
    }
  };

  function activateLastConversation() {
    if (!self.hasLeftConversation()) {
      activateLeftConversationBy(self.conversations().length - 1);
    } 
    else if (!self.hasRightConversation()) {
      activateRightConversationBy(self.conversations().length - 1);
    }
  }
  
  self.persistNewConversation = function(conversation) {
    socket.emit('add_to_desktop', { id: self.id, conversationId: conversation.id });
  };

  self.addAndActivate = function(conversation) {
    self.add(conversation);
    self.activate(conversation);
  }

  self.remove = function(conversation) {
    socket.emit('remove_from_desktop', { id: self.id, conversationId: conversation.id });
    var index = self.conversations.indexOf(conversation);
    self.conversations.splice(index, 1);
    if(conversation.active()) {
      removeActive(conversation, index);
    }
    self.scroll.tiles();
  };

  function removeActive(conversation, index) {
    conversation.deactivate();

    if (isLeft(conversation)) {
      activateLeftConversationBy(index);      
      activateRightConversationBy(index + 1);
    }
    else if (isRight(conversation)) {
      activateRightConversationBy(index);
    }
  }

  function activateLeftConversationBy(index) {
    self.leftConversation(getConversationAt(index));
    if (self.hasLeftConversation()) {
      renderConversationIfNeeded(self.leftConversation());
      self.leftConversation().activateOnTheLeft();
      setTimeout(function(){ self.leftConversation().hasFocus(true); }, 400);
    }
  }

  function activateRightConversationBy(index) {
    self.rightConversation(getConversationAt(index));
    if (self.hasRightConversation()) {
      renderConversationIfNeeded(self.rightConversation());
      self.rightConversation().activateOnTheRight();
    }
  }

  function renderConversationIfNeeded(conversation) {
    if (self.renderedConversations.indexOf(conversation) <= -1) {
      self.renderedConversations.push(conversation);
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

  self.activate = function(conversation) {
    var index = self.conversations.indexOf(conversation);
    var leftIndex = self.conversations.indexOf(self.leftConversation());

    if (index !== leftIndex) {
      self.changeActiveConversations(index);
    }
  };

  self.changeActiveConversations = function(leftIndex) {
    deactivateConversations();
    activateLeftConversationBy(leftIndex);
    activateRightConversationBy(leftIndex + 1);
  }

  function deactivateConversations(){
    ko.utils.arrayForEach(self.conversations(), function(conversation){
      conversation.deactivate();
      conversation.hasFocus(false);
    });
  };

  self.resize = createDesktopResize(self);
  self.scroll = createDesktopScroll(self);

  activateLeftConversationBy(0);
  activateRightConversationBy(1);

  return self;
}