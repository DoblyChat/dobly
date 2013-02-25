function createViewModel(conversationsData, desktopData) {
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

  self.navigation = function() {
    var nav = {};

    nav.showingDesktop = ko.observable(true);
    nav.showingAll = ko.observable(false);
    nav.showingNewConvo = ko.observable(false);
    nav.showingNotificationSetup = ko.observable(false);

    nav.all = function() {
      self.allConversations.refresh();
      nav.showingDesktop(false);
      nav.showingNewConvo(false);
      nav.showingAll(true);
      nav.showingNotificationSetup(false);
    };

    nav.desktop = function() {
      nav.showingNewConvo(false);
      nav.showingAll(false);
      nav.showingDesktop(true);
      nav.showingNotificationSetup(false);
      self.desktop.resize.convoBody();
      self.desktop.scroll.setup();
      self.desktop.setupStripDragAndDrop();
    };

    nav.newConvo = function() {
      nav.showingAll(false);
      nav.showingDesktop(false);
      nav.showingNewConvo(true);
      nav.showingNotificationSetup(false);
    }

    nav.notificationSetup = function(){
      nav.showingDesktop(false);
      nav.showingNewConvo(false);
      nav.showingAll(false);
      nav.showingNotificationSetup(true);
    }

    return nav;
  }();

  self.allConversations = createAllConversations(self.desktop, self.navigation, self.conversations);

  self.newConversation = createNewConversation(self.navigation);

  self.addingNewConversation = ko.observable(false);

  socket.on('my_new_conversation', function(data) {
    var conversation = createConversation(data);
    self.conversations.push(conversation);
    self.desktop.addAndActivate(conversation);
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

  return self;
}