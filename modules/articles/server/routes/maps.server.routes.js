'use strict';

/**
 * Module dependencies.
 */
var mapsPolicy = require('../policies/maps.server.policy'),
    maps = require('../controllers/maps.server.controller');

module.exports = function(app) {
    // Articles collection routes
    app.route('/api/maps').all(mapsPolicy.isAllowed)
        .get(maps.list)
        .post(maps.create);

    // Single map routes
    app.route('/api/maps/:mapId').all(mapsPolicy.isAllowed)
        .get(maps.read)
        .put(maps.update)
        .delete(maps.delete);

    // Finish by binding the map middleware
    app.param('mapId', maps.mapByID);
};