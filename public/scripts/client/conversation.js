function createConversation(data) {
  var self = {};

  self.id = data._id ? data._id : 0;
  self.topic = ko.observable(data.topic);
  self.createdBy = ko.observable(data.createdBy);
  self.unreadCounter = ko.observable(data.unread ? data.unread : 0);
  self.newMessage = ko.observable('');
  self.isLeft = ko.observable(false);
  self.isRight = ko.observable(false);
  
  self.messages = ko.observableArray([]);

  self.active = ko.observable(false);

  self.hasFocus = ko.observable(false);

  if(data.messages){
    for(var i = 0; i < data.messages.length; i++){
      self.messages.push(createMessage(data.messages[i]));
    }
  }

  self.lastMessages = ko.computed(function () {
    if(self.messages().length - 2 >= 0){
      return self.messages.slice(self.messages().length - 2);  
    }else{
      return self.messages();
    }
  });

  self.activateOnTheLeft = function() {
    self.isLeft(true);
    self.isRight(false);
    self.activate(".convo-left");
  };

  self.activateOnTheRight = function() {
    self.isRight(true);
    self.isLeft(false);
    self.activate(".convo-right");
  };

  self.activate = function(convoSelector) {
    self.active(true);

    var getSelector = function getSelector(cssSelector) {
      return convoSelector + ' > ' + cssSelector;
    }

    self.resize = createConversationResizing(getSelector);
    self.scroll = createConversationScrolling(getSelector);
    
    self.resize.body();
    self.scroll.setup();
  };  

  self.deactivate = function() {
    if (self.scroll !== undefined) {
      self.scroll.stop();
    }
    
    self.active(false);
    self.isRight(false);
    self.isLeft(false);
  };
  
  function thereIsANewMessage(){
    return self.newMessage().trim() !== '';
  }

  function getMessageData(){
      return { 
          content: self.newMessage(), 
          conversationId: self.id, 
          timestamp: new Date(),
          createdBy: app.user.username
      };
  }

  function sendMessageToServer(messageData){
    self.newMessage('');
    app.socket.emit('send_message', messageData);
  }

  self.addMessage = function(data){
    var msg = createMessage(data);
    self.messages.push(msg);
    
    if (self.active()) {
      self.scroll.adjust();
      emitMarkAsRead();
    } 
    
    if(!(app.inFocus && self.hasFocus())){
      self.unreadCounter(self.unreadCounter() + 1);  
    }
  }

  self.sendMessage = function (conversation, event) {    
    self.markAsRead();
    if (thereIsANewMessage() && common.enterKeyPressed(event) && !event.shiftKey) {
      var messageData = getMessageData();
      sendMessageToServer(messageData);
      self.addMessage(messageData);
      return false;
    } else {
      return true;
    }
  };

  self.showUnreadCounter = ko.computed(function(){
    return self.unreadCounter() > 0;
  });  

  self.hasFocus.subscribe(function(hasFocus){
    if(hasFocus){
        self.markAsRead();
    }
  });

  self.markAsRead = function(){
    if(self.unreadCounter() > 0){
      self.unreadCounter(0);
      emitMarkAsRead();
    }
  };

  function emitMarkAsRead(){
    app.socket.emit('mark_as_read', self.id);
  }

  return self;
}