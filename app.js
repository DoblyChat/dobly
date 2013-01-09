var express = require('express')
  , routes = require('./routes')
  , sockets = require('./sockets')
  , sessionStore = new express.session.MemoryStore()
  , app = express.createServer()
  , io = require('socket.io').listen(app)
  , mongo = require('mongoose')
  , path = require('path')
  , passport = require('passport')
  , security = require('./security');

// Configuration
app.configure(function(){
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.use(express.bodyParser());

  app.use(express.cookieParser());
  app.use(express.session({ store: sessionStore, secret: 'my secret token', key: 'express.sid' }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var port = process.env.PORT || 3000;
app.listen(port);

var databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';
mongo.connect(databaseUri);

// Security configuration
security.config(passport); 

// Seed data
if(process.argv.indexOf('seed') > -1){
  var seed = require('./seed');
  seed.set();
}

// Routes
routes.config(app);

// Socket IO
sockets.config(io, sessionStore);
