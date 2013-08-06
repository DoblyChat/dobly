define(['client/navigation'], function(createNavigationModule){ 
    'use strict';

    describe("navigation", function() {
        it("creates navigation module", function() {
            var nav = createNavigationModule();
            expect(nav.showingDesktop()).toBe(true);
            expect(nav.showingAll()).toBe(false);
            expect(nav.showingNewConvo()).toBe(false);
            expect(nav.showingNotificationSetup()).toBe(false);
            expect(nav.showingGroup()).toBe(false);
            expect(nav.changingTopic()).toBe(false);
        });

        it("all", function() {
            var viewModel = {
                allConversations: {
                    refresh: function() {},
                },
            };

            spyOn(viewModel.allConversations, 'refresh');
            var nav = createNavigationModule(viewModel);
            
            nav.all();

            expect(viewModel.allConversations.refresh).toHaveBeenCalled();
            expect(nav.showingDesktop()).toBe(false);
            expect(nav.showingAll()).toBe(true);
            expect(nav.showingNewConvo()).toBe(false);
            expect(nav.showingNotificationSetup()).toBe(false);
            expect(nav.showingGroup()).toBe(false);
            expect(nav.changingTopic()).toBe(false);
        });

        it("desktop", function() {
            var viewModel = {
                desktop: {
                    ui: {
                        show: function() {},
                    },
                },
            };

            spyOn(viewModel.desktop.ui, 'show');
            var nav = createNavigationModule(viewModel);
            nav.showingDesktop(false);

            nav.desktop();

            expect(viewModel.desktop.ui.show).toHaveBeenCalled();
            expect(nav.showingDesktop()).toBe(true);
            expect(nav.showingAll()).toBe(false);
            expect(nav.showingNewConvo()).toBe(false);
            expect(nav.showingNotificationSetup()).toBe(false);
            expect(nav.showingGroup()).toBe(false);
            expect(nav.changingTopic()).toBe(false);
        });

        it("new conversation", function() {
            var nav = createNavigationModule();

            nav.newConvo();

            expect(nav.showingDesktop()).toBe(false);
            expect(nav.showingAll()).toBe(false);
            expect(nav.showingNewConvo()).toBe(true);
            expect(nav.showingNotificationSetup()).toBe(false);
            expect(nav.showingGroup()).toBe(false);
            expect(nav.changingTopic()).toBe(false);
        });

        it("notification setup", function() {
            var nav = createNavigationModule();

            nav.notificationSetup();

            expect(nav.showingDesktop()).toBe(false);
            expect(nav.showingAll()).toBe(false);
            expect(nav.showingNewConvo()).toBe(false);
            expect(nav.showingNotificationSetup()).toBe(true);
            expect(nav.showingGroup()).toBe(false);
            expect(nav.changingTopic()).toBe(false);
        });

        it("group", function() {
            var nav = createNavigationModule();

            nav.group();

            expect(nav.showingDesktop()).toBe(false);
            expect(nav.showingAll()).toBe(false);
            expect(nav.showingNewConvo()).toBe(false);
            expect(nav.showingNotificationSetup()).toBe(false);
            expect(nav.showingGroup()).toBe(true);
            expect(nav.changingTopic()).toBe(false);
        });

        it("change topic", function() {
            var nav = createNavigationModule();

            nav.changeTopic();

            expect(nav.showingDesktop()).toBe(false);
            expect(nav.showingAll()).toBe(false);
            expect(nav.showingNewConvo()).toBe(false);
            expect(nav.showingNotificationSetup()).toBe(false);
            expect(nav.showingGroup()).toBe(false);
            expect(nav.changingTopic()).toBe(true);
        });

        it('does not attempt to "show" again if requested view is already shown', function(){
            var viewModel = {
                desktop: {
                    ui: {
                        show: function() {},
                    },
                },
            };

            spyOn(viewModel.desktop.ui, 'show');
            var nav = createNavigationModule(viewModel);
            nav.showingDesktop(true);
            nav.showingAll(true);
            nav.showingNewConvo(true);
            nav.showingNotificationSetup(true);
            nav.showingGroup(true);
            nav.changingTopic(true);

            nav.desktop();

            expect(viewModel.desktop.ui.show).not.toHaveBeenCalled();
            expect(nav.showingDesktop()).toBe(true);

            // Verify the state for all views did not change
            expect(nav.showingAll()).toBe(true);
            expect(nav.showingNewConvo()).toBe(true);
            expect(nav.showingNotificationSetup()).toBe(true);
            expect(nav.showingGroup()).toBe(true);
            expect(nav.changingTopic()).toBe(true);
        });
    });
});













