var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var validator = require('validator');
var Promise = require('promise');

var Converted = mongoose.model('Converted',{arabic:String, roman:String});

// Connection to a local mongodb address.
mongoose.connect("mongodb://localhost:27017/numbers",function(err,db){
    if(!err){
        console.log("MongoDB connection successful");
    }
});
app.use(bodyParser.json());
/*
    Roman numerals are represented as one of these characters. 2 characters per part of arabic part.(2 characters for tens, 2 characters, for hundreds, etc)
    To represent a number that is not 1 or 5 the numbers are added to or subtracted from the neighbour symbols.
    for instance arabic number 4 would be IV. I-V. The numbers are always added to its neighbour on the right unless its smaller than the number on the right.
 */
var romanNumerals = [];
function RomanNumber(symbol,value){
    this.symbol = symbol;
    this.count = 0;
    this.modified = false;
    this.value = value;
}
function RomanOne(symbol,value){
    RomanNumber.call(this,symbol,value);
    this.editor = true;
    this.maxCount = 3;

}
function RomanFive(symbol,value){
    RomanNumber.call(this,symbol,value);
    this.editor = false;
    this.maxCount = 1;
}
var romanCharacters = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
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
    reset();
    var toArabic = false;
    if(req.url.indexOf('arabic') != -1){ toArabic = true}
    Converted.findOne({$or:[{'roman': req.params.number.toUpperCase()},{'arabic': req.params.number}]},function(err,element){
        if(err) res.status(500).end(http.STATUS_CODES[500] + '\n' + err);
        if(!element){
            var roman = '';
            var arabic = 0;
            var convertedValue = {};
            if(toArabic){
                roman = req.params.number.toUpperCase();
                romanToInt(roman).then(function(result){
                    arabic = result;
                    convertedValue = {inputValue: roman,convertedValue: arabic};
                    res.json(convertedValue);
                    recordConversion(roman,arabic);
                },function(err){
                    res.status(400).end(http.STATUS_CODES[400] + '\n' + err);
                })
            }else {
                arabic = req.params.number;
                intToRoman(arabic).then(function (result) {
                    roman = result;
                    convertedValue = {inputValue: Number(arabic),convertedValue: roman};
                    res.json(convertedValue);
                    recordConversion(roman,arabic);
                }, function (err) {
                    res.status(400).end(http.STATUS_CODES[400] + '\n' + err);
                });
            }
        }else{
            if(toArabic){
                res.json({inputValue: element.roman,convertedValue: element.arabic})
            }else{
                res.json({inputValue: Number(element.arabic),convertedValue: element.roman})
            }
        }
    });

}

/**
 * Converts the given input to either integer or roman numeral accordingly.
 * Returns JSON string of both, input value and converted value.
 *
 * @param param
 * @returns converted number back to the user.
 * @returns error code 400 if bad input.
 * @returns error code 500 if MongoDB produces error.
 */
function romanToInt(param){
    return new Promise(function(fulfill,reject){
        var errors = {
            badInput : 'Please provide input of roman numeral characters (I V X L C D or M)',
            IllegalFormation : 'Characters V, L and D on the left-hand side cannot be larger than characters on the right-hand side',
            maxCountReached : 'Character appeared more than the allowed threshold'
        };
        var result = 0;
        var lastValue = 0;
        var splitNumber = param.split('');
        //validateRomanNumber(splitNumber);
                for(var i = splitNumber.length - 1; i >= 0; i--) {
                    if (romanCharacters.indexOf(splitNumber[i]) != -1){
                        romanNumerals.forEach(function(romanValue) {
                            if (romanValue.symbol == splitNumber[i]) {
                                if (romanValue.count < romanValue.maxCount) {
                                    if (lastValue > romanValue.value) { // Checks if should subtract or add.
                                        if (romanValue.editor) {
                                            result -= romanValue.value;
                                        } else {
                                            reject(errors.IllegalFormation);
                                        }
                                    } else {
                                        romanValue.count++;
                                        result += romanValue.value;
                                    }
                                    lastValue = romanValue.value
                                } else {
                                    reject(errors.maxCountReached);
                                }
                            }
                        })
                    }else{
                        reject(errors.badInput);
                    }
                }
                console.log(result);
                fulfill(result);
    });
}

/**
 * Separates the decimal into up to four parts (thousands,hundreds,tens and ones). Then converting each number according to the given alphabet.
 *
 * @param param
 * @returns {*}
 */
function intToRoman(param){
    var badInputError = 'Please provide input of type Integer (between 0 and 3999)';
    return new Promise(function(fulfill,reject){
        if(validator.isInt(param) && param > 0 && param < 5000){
            var x = 0, z = x+1, count = 1;
            var result = [];
            var splitNumber = divideNumber(param);
            splitNumber.reverse();
            splitNumber.forEach(function(number){
                // Roman numerals rules
                if(number >= 1000){
                    result.unshift(romanNumerals[x].symbol.repeat(Number(String(number).charAt(0))))
                }else{
                    if(number >= romanNumerals[z].value){
                        if(number < romanNumerals[z+1].value - count){
                            result.unshift(romanNumerals[z].symbol + romanNumerals[x].symbol.repeat(Number(String(number - romanNumerals[z].value).charAt(0))))
                        }else{
                            result.unshift(romanNumerals[x].symbol + romanNumerals[z+1].symbol);
                        }
                    }
                    if(number == romanNumerals[z].value - count) { result.unshift(romanNumerals[x].symbol + romanNumerals[z].symbol);}
                    if(number < romanNumerals[z].value - count){ result.unshift(romanNumerals[x].symbol.repeat(Number(String(number).charAt(0))));}
                }
                x = x + 2; z = x + 1; count *= 10;
            });
            fulfill(result.join(""));
        }else{
            reject(badInputError);
        }
    })
}

/**
 * Used to separate a number into ones, tens, thousands, etc
 * @param num
 * @returns {*}
 */
function divideNumber(num){
    var result = [];
    if (num == 0) return [0];
    var count = 1;
    while (num > 0) {
        result.unshift((num % 10) * count);
        num = Math.floor(num / 10);
        count *= 10
    }
    return result;
}
/*
function validateRomanNumber(number){
    var structure = [];
    number.forEach(function(character){
        if(romanCharacters.indexOf(character) != -1){
            for(var i = 0; i < romanNumerals.length; i++){
                if(character == romanNumerals[i].symbol){
                    structure.unshift(romanNumerals[i]);
                }
            }
        }else{
            return false;
        }
    });
    console.log(structure);
    for(var i = 0; i < structure.length - 1; i++) {
        if (structure[i].maxCount == structure[i].count)return false;
        if(structure[i].editor){
            if(structure[i + 1].value > structure[i].value){
                structure[i + 1].modified = true;
            }
        }
    }
    console.log(structure);
}
*/
/**
 * Stores the given parameters to MongoDB as conversion object.
 * @param roman
 * @param arabic
 */
function recordConversion(roman, arabic){
    var converted = new Converted({arabic: arabic, roman: roman});
    converted.save();
}

/**
 * Resets the object counters.
 */
function reset(){
    romanNumerals = [new RomanOne(romanCharacters[0],1),new RomanFive(romanCharacters[1],5),new RomanOne(romanCharacters[2],10),new RomanFive(romanCharacters[3],50),new RomanOne(romanCharacters[4],100),new RomanFive(romanCharacters[5],500),new RomanOne(romanCharacters[6],1000)];
}

var server = app.listen(5000,function(){
    console.log('Listening on port ' + server.address().port);
});
