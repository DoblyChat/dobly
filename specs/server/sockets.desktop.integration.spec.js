describe('Sockets', function(){
	describe('Desktop - integration', function(){
		var desktopIo, Desktop, desktopId;

		beforeEach(function(done){
			desktopIo = require('../../sockets/desktop_io');
			Desktop = require('../../models/desktop');

			Desktop.create({
				userId: new mongo.Types.ObjectId()
			}, function(err, desktop){
				desktopId = desktop._id;
				done();
			});
		});

		afterEach(function(done){
			Desktop.findByIdAndRemove(desktopId, done);
		});

		it('adds a conversation to the desktop', function(done){
			var conversationId = new mongo.Types.ObjectId();
			var checkCompleted = false;

			runs(function(){
				desktopIo.addConversation({ id: desktopId, conversationId: conversationId });
			});

			waitsFor(function(){
				Desktop.findById(desktopId, function(err, desktop){
					checkCompleted = desktop.conversations.indexOf(conversationId) >= 0;
				});

				return checkCompleted;
			});

			runs(function(){
				done();
			});
		});

		describe('removes a conversation from the desktop', function(){
			var conversationId = new mongo.Types.ObjectId();
			var checkCompleted = false;

			beforeEach(function(done){
				Desktop.addConversation(desktopId, conversationId, done);
			});

			it('removes conversation', function(done){
				runs(function(){
					desktopIo.removeConversation({ id: desktopId, conversationId: conversationId });
				});

				waitsFor(function(){
					Desktop.findById(desktopId, function(err, desktop){
						checkCompleted = desktop.conversations.indexOf(conversationId) < 0;
					});

					return checkCompleted;
				});

				runs(function(){
					done();
				});
			});
		});

		describe('updates strip order', function(){
			var first, second;

			beforeEach(function(done){
				first = new mongo.Types.ObjectId();
				second = new mongo.Types.ObjectId();

				Desktop.addConversation(desktopId, first, function(err){
					Desktop.addConversation(desktopId, second, function(err){
						Desktop.findById(desktopId, function(err, desktop){
							expect(desktop.conversations.length).toBe(2);
							expect(desktop.conversations[0]).toEqual(first);
							expect(desktop.conversations[1]).toEqual(second);
							done();
						});
					});
				});
			});

			it('updates order', function(done){
				var checkCompleted = false;

				runs(function(){
					desktopIo.updateStripOrder({ id: desktopId, currentSort: { startIndex: 0, stopIndex: 1 } });
				});

				waitsFor(function(){
					Desktop.findById(desktopId, function(err, desktop){
						checkCompleted = desktop.conversations.indexOf(first) == 1 && desktop.conversations.indexOf(second) === 0;
					});

					return checkCompleted;
				});

				runs(function(){
					done();
				});
			});
		});
	});
});