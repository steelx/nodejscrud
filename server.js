// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

var morgan   = require('morgan');
var mongoose = require('mongoose');

var _ = require('lodash');//lodash underscore
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User = require('./models/User');


// =======================
// configuration =========
// =======================
var port = process.env.PORT || 3000; // used to create, sign, and verify tokens
mongoose.connect(config.database, function (error) {
    if (error) {
        console.log(error);
    }
}); // connect to database & initiate mongoose

app.set('superSecret', config.secret); // secret variable


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();
var protectedRouter = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here

//POST username password to get token
router.route('/login')
    .post(function (req, res, next) {
        // find the user
        User.findOne({
            username: req.body.username
        }, function(err, user) {

            if (err) {return next(err);}

            if (!user) {
                return res.status(400).json({ message: 'Authentication failed. User not found.' });
            } else if (user) {

                user.comparePasswords(req.body.password, function (err, isMatch) {
                    if(err || !isMatch) {
                        return res.status(400).json({ message: 'Authentication failed. Wrong password.' });
                    }
                    createToken(user, res);
                });

            }
        });
    });

// route middleware to verify a token
protectedRouter.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.status(400).json({ message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});

// on routes that end in /contacts
// ----------------------------------------------------
router.route('/register')
    // create a contacts route (accessed at POST http://localhost:8080/api/register)
    .post(function(req, res, next) {
        // Get the documents collection
        console.log('Incoming POST req');

        User.findOne({
            username: req.body.username
        }, function(err, user) {
            var msg = 'Username already exists!';
            if (err) return next(err);

            if (user) {
                return res.status(400).json({message: msg});
            }

            // Get the contact data passed from the form
            var newUser = new User({
                name: req.body.name,
                username: req.body.username,
                password: req.body.password
            });

            newUser.save(function (err) {
                if (err) {
                    return res.send(err);
                }
                // saved!
                res.status(200).send(newUser.toJSON());
            });
        });

    });

function createToken(user, res) {
    var token = jwt.sign(user, app.get('superSecret'), {
        expiresInMinutes: 1440 // expires in 24 hours
    });

    // return the information including token as JSON
    res.status(200).json({
        message: 'Enjoy your token!',
        token: token,
        isAdmin: !!user.admin
    });
}

protectedRouter.route('/contacts')
    // get all the contacts (accessed at GET http://localhost:8080/api/contacts)
    .get(function(req, res, next) {

        User.find({}, function(err, users) {
            var userMap = {};
            if (err) {
                return res.send(err);
            }

            users.forEach(function(user) {
                delete user.password;
                userMap[user._id] = user;
            });
            res.status(200).json(userMap);
        });

    });

protectedRouter.route('/contacts/:id')
    .get(function(req, res, next) {

        User.find({ _id: new mongoose.Types.ObjectId(req.params.id)}, function(err, user) {
            if (err) {
                return res.send(err);
            }

            res.status(200).json(user);
        });

    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use('/api', protectedRouter);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port localhost:' + port + '/api');
