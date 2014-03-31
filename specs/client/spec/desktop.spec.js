define(['squire'], function(Squire){
    'use strict';

    describe("desktop", function() {

        var desktop, createDesktop, desktopData, allCollaborationObjects, testCollaborationObject,
            routingMock, uiMock, socketMock, createDesktopUiMock, dbMock;

        beforeEach(function(){
            routingMock = jasmine.createSpyObj('routing', ['subscribe']);
            
            allCollaborationObjects = testDataAllCollaborationObjects();

            dbMock = {
                getCollaborationObjects: function(){
                    return allCollaborationObjects;
                }
            };

            uiMock = {
                show: jasmine.createSpy('show'),
                scroll: {
                    tiles: jasmine.createSpy('tiles')
                },
                updateCollaborationObjectUi: jasmine.createSpy('update-collaboration-object-ui')
            };

            createDesktopUiMock = jasmine.createSpy('createDesktopUi').andCallFake(function(){
                return uiMock;
            });

            socketMock = createMockSocket();
            
            var done = false;

            runs(function(){
                var injector = new Squire();
                injector.mock('client/routing', routingMock);
                injector.mock('client/desktop.ui', function(){
                    return createDesktopUiMock;
                });
                injector.mock('client/socket', socketMock);
                injector.mock('client/collaboration-object.db', dbMock);

                injector.require(['client/desktop'], function(createDesktopFunc){
                    createDesktop = function(data){
                        return createDesktopFunc(data);
                    };

                    done = true;
                });
            });

            waitsFor(function(){
                return done;
            });
        });

        describe("3 collaboration objects", function() {

            var firstCollaborationObject, secondCollaborationObject, thirdCollaborationObject;

            beforeEach(function() {
                desktopData = {
                    _id: '1',
                    userId: '2',
                    collaborationObjects: [ 'A', 'C', 'E' ]
                };

                firstCollaborationObject = allCollaborationObjects[0];
                secondCollaborationObject = allCollaborationObjects[2];
                thirdCollaborationObject = allCollaborationObjects[4];

                desktop = createDesktop(desktopData);         
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

                it('ui', function(){
                    expect(createDesktopUiMock).toHaveBeenCalledWith(desktop);
                    expect(desktop.ui).toBe(uiMock);
                });

                it('showing', function(){
                    expect(desktop.showing()).toBe(false);
                });

                it('subscribes', function(){
                    expect(routingMock.subscribe).toHaveBeenCalled();
                    var args = routingMock.subscribe.mostRecentCall.args;

                    expect(args[0]).toBe('conversations');
                    expect(args[1]).toBe(desktop.showing);
                    args[2]();
                    expect(desktop.ui.show).toHaveBeenCalled();
                });
            }); 

            describe("add", function() {
                
                it("adds but does not activate", function() {
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
                    expect(socketMock.emit).not.toHaveBeenCalled();
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
                    desktop.remove(thirdCollaborationObject);

                    expectSocketEmitRemoveFromDesktop('1','E');
                    expect(desktop.collaborationObjects().length).toBe(2);
                    expect(desktop.leftCollaborationObject()).toEqual(firstCollaborationObject);
                    expect(desktop.rightCollaborationObject()).toEqual(secondCollaborationObject);
                    expect(desktop.ui.updateCollaborationObjectUi).not.toHaveBeenCalled();
                    expect(desktop.ui.scroll.tiles).toHaveBeenCalled();
                });

                it("first collaboration object", function() {
                    desktop.remove(firstCollaborationObject);

                    expectSocketEmitRemoveFromDesktop('1','A');
                    expect(desktop.collaborationObjects().length).toBe(2);
                    expect(desktop.leftCollaborationObject()).toEqual(secondCollaborationObject);
                    expect(desktop.rightCollaborationObject()).toEqual(thirdCollaborationObject);
                    expect(firstCollaborationObject.active()).toBe(false);
                    expectDesktopUiToHaveBeenCalled(desktop);
                });
            });

            describe('sort', function(){
                var indexZero, indexOne, indexTwo;

                beforeEach(function(){
                    indexZero = desktop.collaborationObjects()[0];
                    indexOne = desktop.collaborationObjects()[1];
                    indexTwo = desktop.collaborationObjects()[2];
                    spyOn(desktop, 'changeActiveCollaborationObjects');
                });

                function verifyOrder(first, second, third){
                    expect(desktop.collaborationObjects()[0]).toBe(first);
                    expect(desktop.collaborationObjects()[1]).toBe(second);
                    expect(desktop.collaborationObjects()[2]).toBe(third);
                }

                it('does not update if the start index equals the stop index', function(){
                    desktop.updateSort(9, 9);
                    expect(socketMock.emit).not.toHaveBeenCalled();
                });

                it('updates sort', function(){
                    desktop.updateSort(1, 2);
                    expect(socketMock.emit).toHaveBeenCalledWith('update_strip_order', {
                        id: desktop.id,
                        currentSort: {
                            startIndex: 1,
                            stopIndex: 2
                        }
                    });

                    verifyOrder(indexZero, indexTwo, indexOne);
                });

                it('keeps as active and activates the object to the right', function(){
                    indexZero.activeValue = true;
                    desktop.updateSort(0, 2);
                    verifyOrder(indexOne, indexTwo, indexZero);
                    expect(desktop.changeActiveCollaborationObjects).toHaveBeenCalledWith(2);
                });

                it('activates object if moved after an active object', function(){
                    indexZero.activeValue = true;
                    desktop.updateSort(1, 0);
                    verifyOrder(indexOne, indexZero, indexTwo);
                    expect(desktop.changeActiveCollaborationObjects).toHaveBeenCalledWith(0);
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

                desktop = createDesktop(desktopData);

                firstCollaborationObject = allCollaborationObjects[1];
                secondCollaborationObject = allCollaborationObjects[2];
            });

            describe("remove", function() {
                it("second collaboration object", function() {
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

                desktop = createDesktop(desktopData);

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

                desktop = createDesktop(desktopData);
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

        function expectDesktopUiToHaveBeenCalled(desktop) {
            expect(desktop.ui.updateCollaborationObjectUi).toHaveBeenCalled();
            expect(desktop.ui.scroll.tiles).toHaveBeenCalled();
        }

        function expectSocketEmitAddToDesktop(id, collaborationObjectId) {
            expect(socketMock.emit).toHaveBeenCalled();

            var arg0 = socketMock.emit.mostRecentCall.args[0];
            var arg1 = socketMock.emit.mostRecentCall.args[1];

            expect(arg0).toEqual('add_to_desktop');
            expect(arg1.id).toEqual(id);
            expect(arg1.collaborationObjectId).toEqual(collaborationObjectId);
        }

        function expectSocketEmitRemoveFromDesktop(id, collaborationObjectId) {
            expect(socketMock.emit).toHaveBeenCalled();

            var arg0 = socketMock.emit.mostRecentCall.args[0];
            var arg1 = socketMock.emit.mostRecentCall.args[1];

            expect(arg0).toEqual('remove_from_desktop');
            expect(arg1.id).toEqual(id);
            expect(arg1.collaborationObjectId).toEqual(collaborationObjectId);
        }
    });
});