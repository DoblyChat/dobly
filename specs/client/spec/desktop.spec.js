define(['client/desktop'], function(createDesktop){
    'use strict';

    describe("desktop", function() {

        var desktop;
        var desktopData;
        var allCollaborationObjects;
        var testCollaborationObject;

        describe("3 collaboration objects", function() {

            var firstCollaborationObject, secondCollaborationObject, thirdCollaborationObject;

            beforeEach(function() {
                desktopData = {
                    _id: '1',
                    userId: '2',
                    collaborationObjects: [ 'A', 'C', 'E' ]
                };

                allCollaborationObjects = testDataAllCollaborationObjects();
                desktop = createDesktop(desktopData, allCollaborationObjects);
                app.socket = createMockSocket();

                firstCollaborationObject = allCollaborationObjects[0];
                secondCollaborationObject = allCollaborationObjects[2];
                thirdCollaborationObject = allCollaborationObjects[4];
            });

            describe("creation", function() {

                it("id and loading", function() {
                    expect(desktop.id).toBe('1');
                    expect(desktop.loading()).toBe(false);
                });

                it("collaboration objects", function() {
                    expect(desktop.collaborationObjects().length).toBe(3);
                    expect(desktop.collaborationObjects()[0]).toEqual(firstCollaborationObject);
                    expect(desktop.collaborationObjects()[1]).toEqual(secondCollaborationObject);
                    expect(desktop.collaborationObjects()[2]).toEqual(thirdCollaborationObject);
                });

                it("rendered collaboration objects", function() {
                    expect(desktop.renderedCollaborationObjects().length).toBe(2);
                    expect(desktop.renderedCollaborationObjects()[0]).toEqual(firstCollaborationObject);
                    expect(desktop.renderedCollaborationObjects()[1]).toEqual(secondCollaborationObject);
                });

                it("left collaboration object", function() {
                    expect(desktop.leftCollaborationObject()).toEqual(firstCollaborationObject);
                    expect(desktop.leftCollaborationObject().activateOnTheLeft).toHaveBeenCalled();
                    expect(desktop.hasLeftCollaborationObject()).toBe(true);               
                });

                it("right collaboration objects", function() {
                    expect(desktop.rightCollaborationObject()).toEqual(secondCollaborationObject);
                    expect(desktop.rightCollaborationObject().activateOnTheRight).toHaveBeenCalled();              
                    expect(desktop.hasRightCollaborationObject()).toBe(true);              
                });
            }); 

            describe("add", function() {
                
                it("adds but does not activate", function() {
                    spyDesktopUi(desktop);
                    testCollaborationObject = allCollaborationObjects[1];
                    expect(desktop.collaborationObjects()).not.toContain(testCollaborationObject);

                    desktop.add(testCollaborationObject);

                    expect(desktop.hasLeftCollaborationObject()).toBe(true);
                    expect(desktop.hasRightCollaborationObject()).toBe(true);
                    expect(desktop.leftCollaborationObject()).not.toEqual(testCollaborationObject);
                    expect(desktop.rightCollaborationObject()).not.toEqual(testCollaborationObject);
                    expect(desktop.renderedCollaborationObjects()).not.toContain(testCollaborationObject);
                    expect(desktop.collaborationObjects()).toContain(testCollaborationObject);

                    expect(desktop.ui.scroll.tiles).toHaveBeenCalled();
                    expectSocketEmitAddToDesktop('1','B');
                });

                it("does not add same collaboration object", function() {
                    testCollaborationObject = firstCollaborationObject;
                    expect(desktop.collaborationObjects()).toContain(testCollaborationObject);
                    expect(desktop.collaborationObjects().length).toBe(3);

                    desktop.add(testCollaborationObject);

                    expect(desktop.collaborationObjects().length).toBe(3);
                    expect(app.socket.emit).not.toHaveBeenCalled();
                });
            }); 

            describe("add and activate", function() {
                it("adds and activates", function() {
                    spyOn(desktop, "add");
                    spyOn(desktop, "activate");
                    testCollaborationObject = firstCollaborationObject;

                    desktop.addAndActivate(testCollaborationObject);

                    expect(desktop.add).toHaveBeenCalledWith(testCollaborationObject);
                    expect(desktop.activate).toHaveBeenCalledWith(testCollaborationObject);
                });       
            });

            describe("activate", function() {
                it("activates", function() {
                    spyDesktopUi(desktop);
                    desktop.add(allCollaborationObjects[1]);
                    expect(desktop.collaborationObjects().length).toBe(4);
                    expect(desktop.collaborationObjects()[0]).toEqual(firstCollaborationObject);
                    expect(desktop.collaborationObjects()[1]).toEqual(secondCollaborationObject);
                    expect(desktop.collaborationObjects()[2]).toEqual(thirdCollaborationObject);
                    expect(desktop.collaborationObjects()[3]).toEqual(allCollaborationObjects[1]);

                    expect(desktop.leftCollaborationObject()).toEqual(firstCollaborationObject);
                    expect(desktop.rightCollaborationObject()).toEqual(secondCollaborationObject);

                    var testCollaborationObject = desktop.collaborationObjects()[2];

                    runs(function() {
                        desktop.activate(testCollaborationObject);
                    });

                    waitsFor(function() {
                        return testCollaborationObject.hasFocus() === true;
                    }, "test collaboration object should have focus", 450);

                    runs(function() {
                        expect(desktop.collaborationObjects()[0].deactivate).toHaveBeenCalled();
                        expect(desktop.collaborationObjects()[1].deactivate).toHaveBeenCalled();
                        expect(desktop.collaborationObjects()[2].deactivate).toHaveBeenCalled();
                        expect(desktop.collaborationObjects()[3].deactivate).toHaveBeenCalled();

                        expect(desktop.collaborationObjects()[0].hasFocus()).toBe(false);
                        expect(desktop.collaborationObjects()[1].hasFocus()).toBe(false);
                        expect(desktop.collaborationObjects()[2].hasFocus()).toBe(true);
                        expect(desktop.collaborationObjects()[3].hasFocus()).toBe(false);

                        expect(desktop.leftCollaborationObject()).toEqual(testCollaborationObject);
                        expect(desktop.rightCollaborationObject()).toEqual(desktop.collaborationObjects()[3]);

                        expect(desktop.renderedCollaborationObjects()).toContain(testCollaborationObject);
                        expect(desktop.renderedCollaborationObjects()).toContain(desktop.collaborationObjects()[3]);

                        expect(testCollaborationObject.activateOnTheLeft).toHaveBeenCalled();
                        expect(desktop.collaborationObjects()[3].activateOnTheRight).toHaveBeenCalled();

                        expect(desktop.loading()).toBe(false);
                        expect(desktop.ui.updateCollaborationObjectUi).toHaveBeenCalled();                 
                    });
                });   
            });

            describe("remove", function() {
                it("third collaboration object", function() {
                    spyDesktopUi(desktop);
                    
                    desktop.remove(thirdCollaborationObject);

                    expectSocketEmitRemoveFromDesktop('1','E');
                    expect(desktop.collaborationObjects().length).toBe(2);
                    expect(desktop.leftCollaborationObject()).toEqual(firstCollaborationObject);
                    expect(desktop.rightCollaborationObject()).toEqual(secondCollaborationObject);
                    expect(desktop.ui.updateCollaborationObjectUi).not.toHaveBeenCalled();
                    expect(desktop.ui.scroll.tiles).toHaveBeenCalled();
                });

                it("first collaboration object", function() {
                    spyDesktopUi(desktop);
                    
                    desktop.remove(firstCollaborationObject);

                    expectSocketEmitRemoveFromDesktop('1','A');
                    expect(desktop.collaborationObjects().length).toBe(2);
                    expect(desktop.leftCollaborationObject()).toEqual(secondCollaborationObject);
                    expect(desktop.rightCollaborationObject()).toEqual(thirdCollaborationObject);
                    expect(firstCollaborationObject.active()).toBe(false);
                    expectDesktopUiToHaveBeenCalled(desktop);
                });
            });
        });

        describe("2 collaboration objects", function() {

            var firstCollaborationObject, secondCollaborationObject;

            beforeEach(function() {
                desktopData = {
                    _id: '3',
                    userId: '2',
                    collaborationObjects: [ 'B', 'C' ]
                };

                allCollaborationObjects = testDataAllCollaborationObjects();
                desktop = createDesktop(desktopData, allCollaborationObjects);
                app.socket = createMockSocket();

                firstCollaborationObject = allCollaborationObjects[1];
                secondCollaborationObject = allCollaborationObjects[2];
            });

            describe("remove", function() {
                it("second collaboration object", function() {
                    spyDesktopUi(desktop);
                    
                    desktop.remove(secondCollaborationObject);

                    expectSocketEmitRemoveFromDesktop('3','C');
                    expect(desktop.collaborationObjects().length).toBe(1);
                    expect(desktop.leftCollaborationObject()).toEqual(firstCollaborationObject);
                    expect(desktop.hasRightCollaborationObject()).toBe(false);
                    expect(secondCollaborationObject.active()).toBe(false);
                    expectDesktopUiToHaveBeenCalled(desktop);
                });
            });
        });

        describe("1 collaboration object", function() {

            var firstCollaborationObject;

            beforeEach(function() {
                desktopData = {
                    _id: '1',
                    userId: '2',
                    collaborationObjects: [ 'B' ]
                };

                allCollaborationObjects = testDataAllCollaborationObjects();
                desktop = createDesktop(desktopData, allCollaborationObjects);

                firstCollaborationObject = allCollaborationObjects[1];
            });

            describe("creation", function() {

                it("collaboration objects", function() {
                    expect(desktop.collaborationObjects().length).toBe(1);
                    expect(desktop.collaborationObjects()[0]).toEqual(firstCollaborationObject);
                });

                it("rendered collaboration objects", function() {
                    expect(desktop.renderedCollaborationObjects().length).toBe(1);
                    expect(desktop.renderedCollaborationObjects()[0]).toEqual(firstCollaborationObject);
                });

                it("left collaboration object", function() {
                    expect(desktop.leftCollaborationObject()).toEqual(firstCollaborationObject);
                    expect(desktop.leftCollaborationObject().activateOnTheLeft).toHaveBeenCalled();
                    expect(desktop.hasLeftCollaborationObject()).toBe(true);                               
                });

                it("right collaboration objects", function() {
                    expect(desktop.rightCollaborationObject()).toBeNull();
                    expect(desktop.hasRightCollaborationObject()).toBe(false);                             
                });
            });     

            describe("add", function() {
                
                it("activates on the right", function() {
                    spyDesktopUi(desktop);
                    testCollaborationObject = allCollaborationObjects[4];
                    expect(desktop.collaborationObjects()).not.toContain(testCollaborationObject);

                    desktop.add(testCollaborationObject);

                    expect(desktop.hasLeftCollaborationObject()).toBe(true);
                    expect(desktop.hasRightCollaborationObject()).toBe(true);
                    expect(desktop.rightCollaborationObject()).toEqual(testCollaborationObject);
                    expect(desktop.renderedCollaborationObjects()[1]).toEqual(testCollaborationObject);

                    expectDesktopUiToHaveBeenCalled(desktop);
                    expectSocketEmitAddToDesktop('1','E');
                });
            });

            describe("remove", function() {
                it("first collaboration object", function() {
                    spyDesktopUi(desktop);
                    
                    desktop.remove(firstCollaborationObject);

                    expectSocketEmitRemoveFromDesktop('1','B');
                    expect(desktop.collaborationObjects().length).toBe(0);
                    expect(desktop.hasLeftCollaborationObject()).toBe(false);
                    expect(desktop.hasRightCollaborationObject()).toBe(false);
                    expect(firstCollaborationObject.active()).toBe(false);
                    expectDesktopUiToHaveBeenCalled(desktop);
                });
            });
        });

        describe("0 collaboration objects", function() {

            beforeEach(function() {
                desktopData = {
                    _id: '1',
                    userId: '2',
                    collaborationObjects: [ ]
                };

                allCollaborationObjects = testDataAllCollaborationObjects();
                desktop = createDesktop(desktopData, allCollaborationObjects);
            });

            describe("creation", function() {

                it("collaboration objects", function() {
                    expect(desktop.collaborationObjects().length).toBe(0);
                });

                it("rendered collaboration objects", function() {
                    expect(desktop.renderedCollaborationObjects().length).toBe(0);
                });

                it("left collaboration object", function() {
                    expect(desktop.leftCollaborationObject()).toBeNull();
                    expect(desktop.hasLeftCollaborationObject()).toBe(false);
                });

                it("right collaboration objects", function() {
                    expect(desktop.rightCollaborationObject()).toBeNull();
                    expect(desktop.hasRightCollaborationObject()).toBe(false);
                });
            });

            describe("add", function() {
                
                it("activates on the left", function() {
                    spyDesktopUi(desktop);
                    testCollaborationObject = allCollaborationObjects[2];
                    expect(desktop.collaborationObjects()).not.toContain(testCollaborationObject);

                    desktop.add(testCollaborationObject);

                    expect(desktop.hasLeftCollaborationObject()).toBe(true);
                    expect(desktop.hasRightCollaborationObject()).toBe(false);
                    expect(desktop.leftCollaborationObject()).toEqual(testCollaborationObject);
                    expect(desktop.renderedCollaborationObjects()[0]).toEqual(testCollaborationObject);               

                    expectDesktopUiToHaveBeenCalled(desktop);
                    expectSocketEmitAddToDesktop('1','C');
                });
            });     
        });

        function testDataAllCollaborationObjects() {
            var collaborationObjectsTestData = [
                createMockCollaborationObject('A'),
                createMockCollaborationObject('B'),
                createMockCollaborationObject('C'),
                createMockCollaborationObject('D'),
                createMockCollaborationObject('E'),
            ];

            return collaborationObjectsTestData;
        }

        function createMockCollaborationObject(collaborationObjectId) {
            var self = {};

            self.id = collaborationObjectId;

            self.activeValue = false;
            self.activateOnTheLeft = jasmine.createSpy('activateOnTheLeft').andCallFake(function() {
                self.activeValue = true;
            });
            self.activateOnTheRight = jasmine.createSpy('activateOnTheRight').andCallFake(function() {
                self.activeValue = true;
            });
            self.deactivate = jasmine.createSpy('deactivate').andCallFake(function() {
                self.activeValue = false;
            });
            self.active = function() {
                return self.activeValue;
            };

            self.hasFocusValue = false;
            self.hasFocus = function(value) {
                if (typeof(value) === 'undefined') {
                    return self.hasFocusValue;
                } else {                    
                    self.hasFocusValue = value;
                }
            };

            return self;
        }

        function spyDesktopUi(desktop) {
            desktop.ui = jasmine.createSpyObj('ui', ['scroll','updateCollaborationObjectUi']);
            desktop.ui.scroll = jasmine.createSpyObj('scroll', ['tiles']);
        }

        function expectDesktopUiToHaveBeenCalled(desktop) {
            expect(desktop.ui.updateCollaborationObjectUi).toHaveBeenCalled();
            expect(desktop.ui.scroll.tiles).toHaveBeenCalled();
        }

        function expectSocketEmitAddToDesktop(id, collaborationObjectId) {
            expect(app.socket.emit).toHaveBeenCalled();

            var arg0 = app.socket.emit.mostRecentCall.args[0];
            var arg1 = app.socket.emit.mostRecentCall.args[1];

            expect(arg0).toEqual('add_to_desktop');
            expect(arg1.id).toEqual(id);
            expect(arg1.collaborationObjectId).toEqual(collaborationObjectId);
        }

        function expectSocketEmitRemoveFromDesktop(id, collaborationObjectId) {
            expect(app.socket.emit).toHaveBeenCalled();

            var arg0 = app.socket.emit.mostRecentCall.args[0];
            var arg1 = app.socket.emit.mostRecentCall.args[1];

            expect(arg0).toEqual('remove_from_desktop');
            expect(arg1.id).toEqual(id);
            expect(arg1.collaborationObjectId).toEqual(collaborationObjectId);
        }
    });
});