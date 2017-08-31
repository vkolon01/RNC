var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var validator = require('validator');
var Promise = require('promise');

var convertedSchema = new mongoose.Schema({arabic:String, roman:String});
var Converted = mongoose.model('Converted',convertedSchema);

app.use(bodyParser.json());

app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Headers","Content-Type, Authorization");
    next();
});

app.get('/roman/:number',convert);
app.get('/all/:numeralType',getAll);

function getAll(req,res){
    return new Promise(function(fulfill,reject){
        var collection = [];
        Converted.find({},'-_id ' + req.params.numeralType,{lean:true},function(err,collection){
            res.json(collection);
        })
    });
}

/**
 *  Sends a converted number back to the user.
 *  Returns error code 400 if bad input.
 *
 * @param req
 * @param res
 */
function convert(req,res){
    var badInputError = 'Please provide input of type Integer (4999 or less) or Roman numeral for conversion';
    var param = req.params.number;
    if(isNaN(param)){
        console.log('not a number')
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


function intToRoman(integerNumber){
    return new Promise(function(fulfill,reject){
        var splitNumber = integerNumber.split('');
        var romanOnes = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
        var romanTens = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];
        var romanHundreds = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"];
        var romanThousends = ["", "M", "MM", "MMM", "MMMM"];
        var numberSize = splitNumber.length;
        var romanNumber = [];
        for(var i = numberSize; i > 0; --i){
            var curNum = parseInt(splitNumber[i-1]);
            if(i == numberSize){
                romanNumber.unshift(romanOnes[curNum])
            }else if(i == numberSize - 1){
                romanNumber.unshift(romanTens[curNum])
            }else if(i == numberSize -2){
                romanNumber.unshift(romanHundreds[curNum])
            }else{
                romanNumber.unshift(romanThousends[curNum])
            }
        }
        fulfill({arabic:integerNumber,roman:romanNumber.join("")}); //Returns a converted roman number with type string
    });
}

mongoose.connect("mongodb://localhost:27017/numbers",function(err,db){
    if(!err){
        console.log("MongoDB connection successful");
    }
});

var server = app.listen(5000,function(){
    console.log('Listening on port ' + server.address().port);
});