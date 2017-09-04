var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

// Connection to a local mongodb address.
mongoose.connect("mongodb://localhost:27017/numbers",function(err,db){
    if(!err){
        console.log("MongoDB connection successful");
    }
});
mongoose.Promise = global.Promise;

app.use(bodyParser.json());

app.use(require('./controllers/accessor'));
app.use(require('./controllers/converter'));

module.exports = app;