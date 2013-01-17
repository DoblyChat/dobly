function createViewModel(conversationsData, desktopData) {
  var self = {};
  
  self.conversations = ko.observableArray([]);
  for(var i = 0; i < conversationsData.length; i++){
    self.conversations.push(createConversation(conversationsData[i]));
  }

  self.desktop = createDesktop(desktopData, self.conversations());

  socket.on('receive_message', function(data) {
    ko.utils.arrayForEach(self.conversations(), function(conversation){
      if(data.conversationId === conversation.id){
        conversation.receiveMessage(data);
      }
    });
  });

  self.navigation = function(){
    var nav = {};

    nav.showingDesktop = ko.observable(true);

    nav.all = function(){
      self.allConversations.refresh();
      nav.showingDesktop(false);
    };

    nav.desktop = function(){
      nav.showingDesktop(true);
      self.desktop.resize.convoBody();
      self.desktop.setupStripDragAndDrop();
    };

    return nav;
  }();

  self.allConversations = createAllConversations(self.desktop, self.navigation, self.conversations);

  socket.on('my_new_conversation', function(data) {
    for(var c = 0; c < self.conversations().length; c++){
      if(self.conversations()[c].id == 0){
        var conversation = self.conversations()[c];
        conversation.id = data._id;
        conversation.topic(data.topic);
        conversation.createdBy(data.createdBy);
        desktop.persistNewConversation(conversation);
        conversation.settingTopic(false);
        setTimeout(function () { $('.convo-new-message textarea').focus(); }, 400);
        break;
      }
    }
  });

  socket.on('new_conversation', function(data){
    var conversation = createConversation(data);
    self.conversations.push(conversation);
    self.desktop.add(conversation);
    self.desktop.focus();
  });

  self.addNewConversation = function(){
    var conversation = createConversation({});
    self.conversations.push(conversation);
    conversation.settingTopic(true);

    self.desktop.addEmptyConversation(conversation);

    setTimeout(function () { $('.convo-header-topic-set input').focus(); }, 400);
  }

  return self;
}