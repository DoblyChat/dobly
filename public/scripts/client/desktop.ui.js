define(['jquery', 'jquery-ui'], function($){
    'use strict';
    
    return function (desktop){
        var self = {};

        self.resize = (function () {
            var res = {};
            var objectsBorder = 2;

            res.stripAndCollaborationObjects = function() {
                var includeMargin = true;
                var bodyHeight = $('body').outerHeight(includeMargin);
                var headerHeight = $('#header').outerHeight(includeMargin);
                var $objects = $('#collaboration-objects');
                var objectsMargin = $objects.outerHeight(includeMargin) - $objects.innerHeight();

                var height = bodyHeight - headerHeight - objectsMargin - objectsBorder;
                $objects.height(height);
                $('#strip').height(height);
            };

            res.collaborationObjectBodies = function() {
                if (desktop.hasLeftCollaborationObject()) {
                    desktop.leftCollaborationObject().ui.resizeBody();
                }
            
                if (desktop.hasRightCollaborationObject()) {
                    desktop.rightCollaborationObject().ui.resizeBody();
                }
            };

            function tiles() {    
                var stripHeight = $('#strip').outerHeight(  );
                var newTileHeight = $('#new-tile').outerHeight();
                var newMesageBar = $('#new-message-bar').outerHeight();

                $('#tiles').height(stripHeight - newTileHeight - newMesageBar - objectsBorder);
            }

            res.tilesAndCollaborationObjectBodies = function() {
                res.collaborationObjectBodies();
                tiles();
            };

            return res;
        })();

        self.scroll = (function () {
            var scr = {};

            scr.setup = function() {
                scr.setupCollaborationObjects();
                scr.tiles();
            };

            scr.setupCollaborationObjects = function(){
                if (desktop.hasLeftCollaborationObject()) {
                    desktop.leftCollaborationObject().ui.scroll.setup();
                }
            
                if (desktop.hasRightCollaborationObject()) {
                    desktop.rightCollaborationObject().ui.scroll.setup();
                }
            };

            scr.tiles = function() {
                $('#tiles').nanoScroller({ sliderMaxHeight: 300, alwaysVisible: true });
            };

            scr.bottomTile = function() {
                $('#tiles').nanoScroller({ scroll: 'bottom' });
            };

            return scr;
        })();

        self.highlight = function(){
            var leftObs = desktop.leftCollaborationObject;
            var rightObs = desktop.rightCollaborationObject;

            setTimeout(function(){
                if (desktop.hasLeftCollaborationObject() && leftObs().unreadCounter() > 0) {
                    leftObs().ui.highlight(leftObs().unreadCounter());
                }
            
                if (desktop.hasRightCollaborationObject() && rightObs().unreadCounter() > 0) {
                    rightObs().ui.highlight(rightObs().unreadCounter());
                }
            }, 200);
        };

        self.setupStripDragAndDrop = function (){
            var currentSort;

            $('#tiles').find('.content').sortable({      
                handle: ".icon-move-handle",
                start: function(event, ui){
                    currentSort = { startIndex: ui.item.index(), stopIndex: -1 };
                },
                stop: function(event, ui){
                    currentSort.stopIndex = ui.item.index();
                    desktop.updateSort(currentSort.startIndex, currentSort.stopIndex);
                },
            });

            $('#tiles').disableSelection();
        };

        self.setup = function(){
            self.resize.stripAndCollaborationObjects();
            self.setupStripDragAndDrop();
        };

        self.updateCollaborationObjectUi = function(){
            self.resize.collaborationObjectBodies();
            self.scroll.setupCollaborationObjects();
            self.highlight();
        };

        self.show = function(){
            self.resize.tilesAndCollaborationObjectBodies();
            self.scroll.setup();
            self.setupStripDragAndDrop();
        };

        return self;
    };
});

