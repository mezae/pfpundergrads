'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MappingSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String
    },
    map: {
        type: Array,
        default: []
    }
});

mongoose.model('Mapping', MappingSchema);