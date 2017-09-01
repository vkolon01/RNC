var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var validator = require('validator');
var Promise = require('promise');

// Mongodb schema definition.
//var convertedSchema = new mongoose.Schema({arabic:String, roman:String});
var Converted = mongoose.model('Converted',{arabic:String, roman:String});

// Connection to a local mongodb address.
mongoose.connect("mongodb://localhost:27017/numbers",function(err,db){
    if(!err){
        console.log("MongoDB connection successful");
    }
});

app.use(bodyParser.json());

app.get('/roman/:number',convert);
app.get('/all/:numeralType',getAll);


// Collection of characters that represent the roman numeric system.
// The integer value of each roman numeral is the index of the array.
const numericSystem = {
    romanOnes : ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
    romanTens : ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"],
    romanHundreds : ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"],
    romanThousands : ["", "M", "MM", "MMM", "MMMM"]
};

/**
 *  Fetches the entire collection of previously converted numbers and returns in a type requested by the url parameter.
 *
 * @param req.params.numeralType given through url.
 * @returns {*}
 */
function getAll(req,res){
    return new Promise(function(fulfill,reject){
        var collection = [];
        Converted.find({},'-_id ' + req.params.numeralType,{lean:true},function(err,collection){
            res.json(collection);
        })
    });
}

/**
 * Converts the given input to either integer or roman numeral accordingly.
 * Returns JSON string of both, input value and converted value.
 *
 * @param req.params.number given through url.
 * @returns converted number back to the user.
 * @returns error code 400 if bad input.
 * @returns error code 500 if mongoDB error.
 */
function convert(req,res){
    var badInputError = 'Please provide input of type Integer (4999 or less) or Roman numeral for conversion';
    var param = req.params.number;
    if(isNaN(param)){
        if(typeof param === 'string'){
            romanToInt(param).then(function(result){
                res.json(result);
            });
        }else{
            res.status(400).end(http.STATUS_CODES[400] + '\n' + badInputError);
        }
    }else{
        if(validator.isInt(param)){
            if(param < 5000){
                intToRoman(param).then(function(result){
                    var newConverted = new Converted(result);
                    newConverted.save(function(err){
                        if(err) {
                            res.status(500).end(http.STATUS_CODES[500]);
                        }else{
                            res.json([param,result.roman]);
                        }
                    });
                },function(err){
                    res.status(400).end(http.STATUS_CODES[400] + '\n' + err);
                })
            }else{
                res.status(400).end(http.STATUS_CODES[400] + '\n' + badInputError);
            }
        }else{
            res.status(400).end(http.STATUS_CODES[400] + '\n' + badInputError);
        }
    }
}

function romanToInt(romanNumber){
    return new Promise(function(fulfill,reject){
        var splitNumber = romanNumber.toUpperCase().split('');
        var length = splitNumber.length;
        var result = [];

        for(var i = length - 1; i >= 0; i--){
            var curNum = 0;
            var composition = '';
            var integer = numericSystem.romanOnes.indexOf(splitNumber[i] + composition);
            if(integer != -1){
                composition = splitNumber[i] + composition;
            }else{
                result.unshift(curNum);
                composition = '';
            }
        }
        fulfill(result);
    });
}

/**
 * Separates the decimal into up to four parts (thousands,hundreds,tens and ones). Then converting each number according to the given alphabet.
 *
 * @param integerNumber
 * @returns {*}
 */
function intToRoman(integerNumber){
    return new Promise(function(fulfill,reject){
        var splitNumber = integerNumber.split('');
        var length = splitNumber.length;
        var romanNumber = [];

        for(var i = length; i > 0; --i){
            var curNum = parseInt(splitNumber[i-1]);
            if(i == length){
                romanNumber.unshift(numericSystem.romanOnes[curNum])
            }else if(i == length - 1){
                romanNumber.unshift(numericSystem.romanTens[curNum])
            }else if(i == length -2){
                romanNumber.unshift(numericSystem.romanHundreds[curNum])
            }else{
                romanNumber.unshift(numericSystem.romanThousands[curNum])
            }
        }
        fulfill({arabic:integerNumber,roman:romanNumber.join("")}); //Returns a converted roman number with type string
    });
}

var server = app.listen(5000,function(){
    console.log('Listening on port ' + server.address().port);
});