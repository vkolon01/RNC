var router = require('express').Router();
var Converted = require('../models/data');

router.get('/all/:numeralType',getAll);
router.delete('/remove/all',removeAll);

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

/**
 * This route removes the entire collection from the database.
 * @param req
 * @param res
 */
function removeAll(req,res){
    Converted.remove({},function(err){
        if(err) res.status(500).end(http.STATUS_CODES[500] + '\n' + err);
        res.status(200).end();
    })
}

module.exports = router;