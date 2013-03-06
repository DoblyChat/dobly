function createNavigationModule(viewModel) {
    var self = {};

    self.showingDesktop = ko.observable(true);
    self.showingAll = ko.observable(false);
    self.showingNewConvo = ko.observable(false);
    self.showingNotificationSetup = ko.observable(false);
    self.showingGroup = ko.observable(false);

    self.all = function() {
      viewModel.allConversations.refresh();
      self.showingDesktop(false);
      self.showingNewConvo(false);
      self.showingAll(true);
      self.showingNotificationSetup(false);
      self.showingGroup(false);
    };

    self.desktop = function() {
      self.showingNewConvo(false);
      self.showingAll(false);
      self.showingDesktop(true);
      self.showingNotificationSetup(false);
      self.showingGroup(false);
      viewModel.desktop.resize.convoBody();
      viewModel.desktop.scroll.setup();
      setupStripDragAndDrop(viewModel.desktop);
    };

    self.newConvo = function() {
      self.showingAll(false);
      self.showingDesktop(false);
      self.showingNewConvo(true);
      self.showingNotificationSetup(false);
      self.showingGroup(false);
    };

    self.notificationSetup = function(){
      self.showingDesktop(false);
      self.showingNewConvo(false);
      self.showingAll(false);
      self.showingNotificationSetup(true);
      self.showingGroup(false);
    };

    self.group = function(){
      self.showingDesktop(false);
      self.showingNewConvo(false);
      self.showingAll(false);
      self.showingNotificationSetup(false);
      self.showingGroup(true);
    };

    self.showBack = function(){
      return self.showingAll() 
          || self.showingNewConvo() 
          || self.showingNotificationSetup()
          || self.showingGroup();
    };

    return self;
}