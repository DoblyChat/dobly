'use strict';

var express = require('express')
  , routes = require('./lib/routes')
  , sockets = require('./lib/sockets')
  , MongoStore = require('connect-mongo')(express)
  , app = express.createServer()
  , io = require('socket.io').listen(app)
  , mongo = require('mongoose')
  , path = require('path')
  , passport = require('passport')
  , security = require('./lib/security')
  , less = require('less-middleware');


var databaseUri = process.env.MONGOLAB_URI;
mongo.connect(databaseUri);

var sessionStore = new MongoStore({
  mongoose_connection: mongo.connections[0],
});

// Configuration
app.configure(function(){
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.use(express.bodyParser());

  app.use(express.cookieParser());
  app.use(express.session({ store: sessionStore, secret: 'viva venezuela!', key: 'express.sid', cookie: { maxAge: 10800000 } }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);

  express.static.mime.define({'application/x-font-woff': ['woff']});
});

app.configure('development', function(){
  app.use(less({ 
    src: __dirname + '/public',
    force: true,
    debug: true
  }));

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

  app.locals({
    production_mode: false
  });
});

app.configure('staging', prodConfig);
app.configure('production', prodConfig);

function prodConfig(){
    app.use(express.compress());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.errorHandler({ dumpExceptions: true }));

    app.locals({
        production_mode: true
    });
}

var port = process.env.PORT;
app.listen(port);

// Security configuration
security.config(passport);

// Routes
routes.config(app);

// Socket IO
sockets.config(io, sessionStore);
