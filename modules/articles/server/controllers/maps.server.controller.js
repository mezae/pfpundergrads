'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    path = require('path'),
    mongoose = require('mongoose'),
    Mapping = mongoose.model('Mapping'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a map
 */
exports.create = function(req, res) {
    var map = new Mapping(req.body);

    map.save(function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(map);
        }
    });
};

/**
 * Show the current map
 */
exports.read = function(req, res) {
    res.json(req.map);
};

/**
 * Update a map
 */
exports.update = function(req, res) {
    var map = req.map;

    map.map = req.body.map;

    map.save(function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(map);
        }
    });
};

/**
 * Delete an map
 */
exports.delete = function(req, res) {
    var map = req.map;

    map.remove(function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(map);
        }
    });
};

/**
 * List of Mappings
 */
exports.list = function(req, res) {
    Mapping.find().sort('-created').exec(function(err, maps) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(maps);
        }
    });
};

/**
 * Mapping middleware
 */
exports.mapByID = function(req, res, next, id) {
    Mapping.findById(id).exec(function(err, map) {
        if (err) return next(err);
        if (!map) return next(new Error('Failed to load map ' + id));
        req.map = map;
        next();
    });
};