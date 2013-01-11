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

  self.focus = function(convoSelector) {
    self.focused(true);

    self.resize = createConversationResizing(convoSelector);
    self.scroll = createConversationScrolling(convoSelector);
    
    self.resize.body();
    self.scroll.setup();
  };

  self.resetFocus = function() {
    if (self.scroll !== undefined) {
      self.scroll.stop();
    }

    self.focused(false);
  };

  self.topicSet = function(data, event) {
    if (enterKeyPressed(event) && self.topic().length > 0) {
      socket.emit('set_topic', { id: self.id, topic: self.topic() });
      self.settingTopic(false);
      self.resize.body();
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
    if (self.focused()) {
      self.scroll.adjust();
    } else {
      self.unreadCounter(self.unreadCounter() + 1);
    }
  }

  self.showUnreadCounter = ko.computed(function(){
    return self.unreadCounter() > 0;
  });

  function getSelector(cssSelector) {
    return selector + ' > ' + cssSelector;
  }

  return self;
}

function createConversationResizing(convoSelector) {
  var self = {};

  self.body = function() {
    var convoHeight = $('#convos').innerHeight();
    var titleHeightLeft = $(getSelector('.convo-header')).outerHeight();
    var newMessageHeightLeft = $(getSelector('.convo-new-message')).outerHeight();  
    $(getSelector('.convo-body')).height(convoHeight - titleHeightLeft - newMessageHeightLeft);
  };

  function getSelector(cssSelector) {
    return convoSelector + ' > ' + cssSelector;
  }

  return self;
}

function createConversationScrolling(convoSelector) {
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

  function getSelector(cssSelector) {
    return convoSelector + ' > ' + cssSelector;
  }

  return self;
}