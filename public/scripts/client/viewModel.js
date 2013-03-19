function createViewModel(conversationsData, desktopData, groupData) {
  var self = {};
  
  self.conversations = ko.observableArray([]);
  for(var i = 0; i < conversationsData.length; i++){
    self.conversations.push(createConversation(conversationsData[i]));
  }

  self.desktop = createDesktop(desktopData, self.conversations());

  self.notifier = createNotifier(self.desktop);

  socket.on('receive_message', function(message) {
    ko.utils.arrayForEach(self.conversations(), function(conversation){
      if(message.conversationId === conversation.id){
        receiveMessage(conversation, message);
      }
    });
  });

  function receiveMessage(conversation, message){
    conversation.addMessage(message);
    self.notifier.showDeskopNotification(conversation, message.createdBy + ': ' + message.content);
    self.desktop.add(conversation);
  }

  self.unreadCounter = ko.computed(function(){
    var unread = 0;
    ko.utils.arrayForEach(self.conversations(), function(conversation){
      unread += conversation.unreadCounter();
    });

    self.notifier.updateTitle(unread);
  });

  self.navigation = createNavigationModule(self);

  self.allConversations = createAllConversations(self.desktop, self.navigation, self.conversations);

  self.newConversation = createNewConversation(self.navigation);

  socket.on('my_new_conversation', function(data) {
    var conversation = createConversation(data);
    self.conversations.push(conversation);
    self.desktop.addAndActivate(conversation);
    self.desktop.scroll.bottomTile();
    conversation.hasFocus(true);
  });

  socket.on('new_conversation', function(data){
    var conversation = createConversation(data);
    self.conversations.push(conversation);
    self.desktop.add(conversation); 
  });

  self.addNewConversation = function(){
    self.navigation.newConvo();    
    self.newConversation.setup();
  }

  if(self.notifier.needsToAskForPermission()){
    self.navigation.notificationSetup();
  }

  self.cancelNotificationsSetup = function(){
    self.navigation.desktop();
  }

  self.allowNotificationsSetup = function(){
    self.notifier.setup();
    self.navigation.desktop();
  }

  self.group = createGroup(groupData);

  return self;
}