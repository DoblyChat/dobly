var Conversation = require('../models/conversation');

exports.index = function(req, res){
  res.render('index', { title: 'my chat app' });
};

exports.log_in = function(req, res){
	var name = req.body.name;
  	req.session.name = name;
  	res.redirect('/conversations');
};

exports.get_conversations = function(req, res){
	Conversation.find(function(err, conversations){
		res.render('conversations', { conversations: conversations,
									  title: 'conversations'});
	});
}

exports.post_conversations = function(req, res){
	var conversation = new Conversation();
	conversation.topic = req.body.topic;
	conversation.save();

	res.redirect('/conversations/' + conversation.id + '/messages');
}

exports.get_messages = function(req, res){
	var conversation = Conversation.findById(req.params.id, function(err, conversation){
		req.session.conversation_id = req.params.id;
		res.render('messages', { title: 'messages', 
    							 name: req.session.name,
    							 conversation: conversation });
	});
}