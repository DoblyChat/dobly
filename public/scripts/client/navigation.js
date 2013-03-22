function createNavigationModule(viewModel) {
    var self = {};

    self.showingDesktop = ko.observable(true);
    self.showingAll = ko.observable(false);
    self.showingNewConvo = ko.observable(false);
    self.showingNotificationSetup = ko.observable(false);
    self.showingGroup = ko.observable(false);
    self.changingTopic = ko.observable(false);

    self.all = function() {
      viewModel.allConversations.refresh();
      self.showingDesktop(false);
      self.showingNewConvo(false);
      self.showingAll(true);
      self.showingNotificationSetup(false);
      self.showingGroup(false);
      self.changingTopic(false);
    };

    self.desktop = function() {
      self.showingNewConvo(false);
      self.showingAll(false);
      self.showingDesktop(true);
      self.showingNotificationSetup(false);
      self.showingGroup(false);
      self.changingTopic(false);
      viewModel.desktop.resize.tilesAndConversationBodies();
      viewModel.desktop.scroll.setup();
      setupStripDragAndDrop(viewModel.desktop);
    };

    self.newConvo = function() {
      self.showingAll(false);
      self.showingDesktop(false);
      self.showingNewConvo(true);
      self.showingNotificationSetup(false);
      self.showingGroup(false);
      self.changingTopic(false);
    };

    self.notificationSetup = function(){
      self.showingDesktop(false);
      self.showingNewConvo(false);
      self.showingAll(false);
      self.showingNotificationSetup(true);
      self.showingGroup(false);
      self.changingTopic(false);
    };

    self.group = function(){
      self.showingDesktop(false);
      self.showingNewConvo(false);
      self.showingAll(false);
      self.showingNotificationSetup(false);
      self.showingGroup(true);
      self.changingTopic(false);
    };

    self.showBack = function(){
      return self.showingAll() 
          || self.showingNewConvo() 
          || self.showingNotificationSetup()
          || self.showingGroup();
    };

    self.changeTopic = function(){
      self.showingAll(false);
      self.showingDesktop(false);
      self.showingNewConvo(false);
      self.showingNotificationSetup(false);
      self.showingGroup(false);
      self.changingTopic(true);
    }

    return self;
}