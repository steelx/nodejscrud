// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var mongodb   = require('mongodb');
var dburl = 'mongodb://localhost:27017/contactsdb';
var MongoClient = mongodb.MongoClient;
var _ = require('lodash');//lodash underscore

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

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

// on routes that end in /contacts
// ----------------------------------------------------
router.route('/contacts')
    // create a contacts route (accessed at POST http://localhost:8080/api/contacts)
    .post(function(req, res) {
        console.log('req.body', req.body);

        MongoClient.connect(dburl, function(err, db){
            if (err) {res.send(err);}

            // Get the documents collection
            console.log('Incoming POST req');
            var collection = db.collection('contacts');

            // Get the contact data passed from the form
            var contact = {
                name : req.body.name,
                email : req.body.email,
                phone : req.body.phone
            };

            if(_.isEmpty(req.body)){
                res.json({ error: 'res body empty.' });
                db.close();
            } else {
                // Insert the student data into the database
                collection.insert([contact], function (err){
                    if (err) {res.send(err);}
                    res.json({ message: 'Contact created!' });
                    // Close the database
                    db.close();
                });
            }
        });

    })

    // get all the contacts (accessed at GET http://localhost:8080/api/contacts)
    .get(function(req, res) {
        // Connect to the DB
        MongoClient.connect(dburl, function (err, db) {
            if (err) {res.send(err);}

            // We are connected
            console.log('Incoming GET req to ', dburl);

            // Get the documents collection
            var collection = db.collection('contacts');

            // Find all students
            collection.find({}).toArray(function (err, result) {
                if (err) {
                    res.send(err);
                } else if (result.length) {
                    console.log('contacts json sent');
                    res.json(result);
                } else {
                    res.send('No contacts found');
                }
                //Close connection
                db.close();
            });
        });

    });

router.route('/contacts/:id')
    // get the single contact (accessed at GET http://localhost:8080/api/contacts/:id)
    .get(function(req, res) {
        //console.log(req.params.id);
        // Connect to the DB
        MongoClient.connect(dburl, function (err, db) {
            if (err) {res.send(err);}

            // We are connected
            console.log('Incoming GET req for ', req.params);

            // Get the documents collection
            db.collection('contacts').find({"_id": new mongodb.ObjectID(req.params.id)}).toArray(function(err, result){
                if (err) {
                    res.send(err);
                } else if (result.length) {
                    res.json(result);
                } else {
                    res.send('No contacts found');
                }
                //Close connection
                db.close();
            });
        });
    })
    // update the single contact (accessed at UPDATE http://localhost:8080/api/contacts/:id)
    .put(function(req, res) {
        // Connect to the DB
        MongoClient.connect(dburl, function (err, db) {
            if (err) {res.send(err);}

            // We are connected
            console.log('Incoming PUT req for ', req.params);

            // Get the documents collection
            db.collection('contacts').updateOne(
                {"_id": new mongodb.ObjectID(req.params.id)},
                {
                    $set: { "name": req.body.name, "email": req.body.email, "phone": req.body.phone },
                    $currentDate: { "lastModified": true }
                },
                function(err, result) {
                    if (err) {res.send(err);}

                    res.json(result);
                    db.close();
                }
            );
        });
    })
    // delete the single contact (accessed at DELETE http://localhost:8080/api/contacts/:id)
    .delete(function(req, res) {
        // Connect to the DB
        MongoClient.connect(dburl, function (err, db) {
            if (err) {res.send(err);}

            // We are connected
            console.log('Incoming DELETE req for ', req.params);

            // Get the documents collection
            db.collection('contacts').deleteMany(
                {"_id": new mongodb.ObjectID(req.params.id)},
                function(err, result) {
                    if (err) {res.send(err);}

                    res.json(result);
                    db.close();
                }
            );
        });
    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port localhost:' + port + '/api');