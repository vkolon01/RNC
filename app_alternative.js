var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var validator = require('validator');
var Promise = require('promise');
var toArabic = require('roman-numerals').toArabic;
var toRoman = require('roman-numerals').toRoman;

var Converted = mongoose.model('Converted',{arabic:String, roman:String});

// Connection to a local mongodb address.
mongoose.connect("mongodb://localhost:27017/numbers",function(err,db){
    if(!err){
        console.log("MongoDB connection successful");
    }
});
app.use(bodyParser.json());

app.get('/roman/:number',convert);
app.get('/arabic/:number',convert);
app.get('/all/:numeralType',getAll);
app.delete('/remove/all',removeAll);

/**
 *  Fetches the entire collection of previously converted numbers and returns in a type requested by the url parameter.
 *
 * @param req.params.numeralType given through url.
 * @returns {*}
 */
function getAll(req,res){
    var param = req.params.numeralType.toLowerCase();
    var result = [];
    if(param == 'arabic' || param == 'roman'){
        Converted.find({},function(err,collection){
            collection.forEach(function(element){
                if(param == 'arabic'){
                    result.push(element.arabic);
                }else{
                    result.push(element.roman);
                }
            });
            res.json(result);
        })
    }else{
        res.status(400).end();
    }
}

function removeAll(req,res){
    Converted.remove({},function(err){
        if(err) res.status(500).end(http.STATUS_CODES[500] + '\n' + err);
        res.status(200).end();
    })
}

function convert(req,res){
    var romanToArabic = false;
    var param =  req.params.number.toUpperCase();
    var roman = '';
    var arabic = 0;

    if(req.url.indexOf('arabic') != -1){ romanToArabic = true}
    Converted.findOne({$or:[{'roman': param},{'arabic': param}]},function(err,element){
        if(err) res.status(500).end(http.STATUS_CODES[500] + '\n' + err);
        if(!element){
            if(romanToArabic){
                roman = param;
                try{
                    arabic = toArabic(roman);
                    recordConversion(roman,arabic).then(function(data){
                        res.json({inputValue: roman,convertedValue: arabic})
                    },function(err) {
                        res.status(500).end(http.STATUS_CODES[500] + '\n' + err);
                    })
                }catch(ex){
                    res.status(400).end(http.STATUS_CODES[400] + '\n' + ex);
                }
            }else{
                arabic = param;
                try{
                    roman = toRoman(arabic);
                    recordConversion(roman,arabic).then(function(data){
                        res.json({inputValue: arabic,convertedValue: roman})
                    },function(err) {
                        res.status(500).end(http.STATUS_CODES[500] + '\n' + err);
                    })
                }catch(ex) {
                    res.status(400).end(http.STATUS_CODES[400] + '\n' + ex);
                }
            }
        }else{
            if(romanToArabic){
                res.json({inputValue: element.roman,convertedValue: element.arabic})
            }else{
                res.json({inputValue: Number(element.arabic),convertedValue: element.roman})
            }
        }
    });
}

/**
 * Stores the given parameters to MongoDB as conversion object.
 * @param roman
 * @param arabic
 */
function recordConversion(roman, arabic){
    return new Promise(function(fulfill,reject){
        var converted = new Converted({arabic: arabic, roman: roman});
        converted.save(function(err,data){
            if(err) reject(err);
            fulfill(data)
        });
    });
}
module.exports = app;