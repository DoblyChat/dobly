function createNavigationModule(viewModel) {
    var nav = {};

    nav.showingDesktop = ko.observable(true);
    nav.showingAll = ko.observable(false);
    nav.showingNewConvo = ko.observable(false);
    nav.showingNotificationSetup = ko.observable(false);

    nav.all = function() {
      viewModel.allConversations.refresh();
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
      viewModel.desktop.resize.convoBody();
      viewModel.desktop.scroll.setup();
      viewModel.desktop.setupStripDragAndDrop();
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
}