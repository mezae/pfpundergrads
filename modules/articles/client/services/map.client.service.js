'use strict';

//Mapping service used for communicating with the maps REST endpoints
angular.module('articles').factory('Mapping', ['$resource',
    function($resource) {
        return $resource('api/maps/:mapId', {
            mapId: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    }
]);