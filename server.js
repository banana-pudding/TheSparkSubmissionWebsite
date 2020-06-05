// set up ======================================================================
// get all the tools we need
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var app = express();
var port = 443;

var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
var constants = require('./config/constants.js');
var printRequestModel = require('./app/models/printRequest');
var cleRequestModel = require('./app/models/cleRequest');
var adminRequestModel = require('./app/models/adminRequest');
var userModel = require('./app/models/user');
var payment = require('./config/payment.js');

var printHandler = require('./app/printHandler.js');
var cleHandler = require('./app/cleHandler.js');
var adminRequestHandler = require('./app/adminRequestHandler.js');


// configuration ===============================================================
mongoose.connect(constants.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating
app.use('/public', express.static(path.join(__dirname + '/public'))); //allow us to grab local files in the public directory

// required for passport
app.use(session({
    secret: 'istilllikethefactorymorethanthespark',
    resave: true,
    saveUninitialized: true
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, printHandler, cleHandler); // load our routes and pass in our app and fully configured passport
require('./app/printRoutes.js')(app, passport, userModel, adminRequestHandler, printHandler, printRequestModel, payment); // load our routes and pass in our app and fully configured passport
require('./app/userRoutes.js')(app, passport, userModel, adminRequestHandler, adminRequestModel, printRequestModel, cleRequestModel); // load our routes and pass in our app and fully configured passport
require('./app/cleRoutes.js')(app, passport, userModel, cleHandler, cleRequestModel); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
https.createServer({
    key: fs.readFileSync('./npserver2048.key'),
    cert: fs.readFileSync('./sparkorders_library_unt_edu_cert.cer'),
    passphrase: 'THEsparkMakerSPACE'
},app).listen(port, '0.0.0.0');

//http server to redirect to https
var http_server = http.createServer(function(req,res){    
    // 301 redirect (reclassifies google listings)
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80, '0.0.0.0');

console.log('The magic happens on port ' + port);

