var mongoose = require('mongoose');

var Converted = mongoose.model('Converted',{arabic:String, roman:String});

module.exports = Converted;
