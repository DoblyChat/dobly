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
  self.ui = createConversationUi();
  self.timestamp = common.formatTimestamp(data.timestamp);

  if(data.messages){
    for(var i = 0; i < data.messages.length; i++){
      self.messages.push(createMessage(data.messages[i], true));
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
    activate(".convo-left");
  };

  self.activateOnTheRight = function() {
    self.isRight(true);
    self.isLeft(false);
    activate(".convo-right");
  };

  function activate(convoSelector) {
    self.active(true);

    var getSelector = function getSelector(cssSelector) {
      return convoSelector + ' > ' + cssSelector;
    }

    self.ui.init(getSelector);
  };  

  self.deactivate = function() {
    if(self.active()){
      if (self.ui.scroll !== undefined) {
        self.ui.scroll.stop();
      }
      
      self.active(false);
      self.isRight(false);
      self.isLeft(false);
    }
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

  function sendMessageToServer(messageData, messageObj){
    self.newMessage('');
    app.socket.emit('send_message', messageData, function(){
      messageObj.confirmedSent(true);
    });
  }

  self.addMessage = function(messageObj){
    self.messages.push(messageObj);
    
    if (self.active()) {
      self.ui.scroll.adjust();
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
      var messageObj = createMessage(messageData, false);
      self.addMessage(messageObj);
      sendMessageToServer(messageData, messageObj);
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

    return true;
  };

  function emitMarkAsRead(){
    app.socket.emit('mark_as_read', self.id);
  }

  self.loadingMore = ko.observable(false);
  
  var allMessagesLoaded = ko.computed(function(){
    return data.totalMessages <= self.messages().length;
  }, self);

  var nextPage = 1;

  self.scrolled = function(conversation, event){
    if(!self.loadingMore() && event.target.scrollTop - 40 < 0 && !allMessagesLoaded()){
      var originalScrollHeight = event.target.scrollHeight;

      app.socket.emit('read_next_messages', { page: nextPage, conversationId: self.id }, function(messages){
        ko.utils.arrayForEach(messages, function(message){
          self.messages.unshift(createMessage(message, true));
        });

        self.ui.scroll.adjustToOffset(event.target.scrollHeight - originalScrollHeight - 80);
        nextPage += 1;
        self.loadingMore(false);

        self.ui.highlightTopMessages(messages.length);
      });

      self.loadingMore(true);
    }
  };

  return self;
}