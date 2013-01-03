function createConversation(data) {
  var self = {};

  self.id = data._id;
  self.topic = ko.observable(data.topic);
  self.settingTopic = ko.observable(false);
  self.createdBy = data.createdBy;
  self.unreadCounter = ko.observable(data.unread ? data.unread : 0);
  self.newMessage = ko.observable('');
  
  self.messages = ko.observableArray([]);

  self.focused = ko.observable(false);

  if(data.messages){
    for(var i = 0; i < data.messages.length; i++){
      addMessage(data.messages[i]);
    }
  }

  self.lastMessages = ko.computed(function () {
    if(self.messages().length - 2 >= 0){
      return self.messages.slice(self.messages().length - 2);  
    }else{
      return self.messages();
    }
  });

  self.topicSet = function(data, event) {
    if (enterKeyPressed(event) && self.topic().length > 0) {
      socket.emit('set_topic', { id: self.id, topic: self.topic() });
      self.settingTopic(false);
      setTimeout(function () { $('.convo-new-message textarea').focus(); }, 400);
      return false;
    }
    else {
      return true;
    }
  };

  function enterKeyPressed(event) {
    var keyCode = (event.which ? event.which : event.keyCode);
    return keyCode === 13;
  }

  function addMessage(data){
    var msg = createMessage(data);
    self.messages.push(msg);
  }

  self.sendMessage = function (data, event) {    
    if (enterKeyPressed(event)) {
      sendMessageToServer();
      return false;
    } else {
      return true;
    }
  };

  function sendMessageToServer(){
    var data = 
    { 
        content: self.newMessage(), 
        conversationId: self.id, 
        timestamp: new Date(),
    };

    self.newMessage('');
    socket.emit('send_message', data);
  }

  self.receiveMessage = function(message){
    addMessage(message);
    if(!self.focused()){
      self.unreadCounter(self.unreadCounter() + 1);
    }
  }

  self.showUnreadCounter = ko.computed(function(){
    return self.unreadCounter() > 0;
  });

  return self;
};