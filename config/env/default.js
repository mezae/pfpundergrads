'use strict';


module.exports = {
    app: {
        title: 'ProMoNo',
        description: 'streamline programs\' monthly numbers',
        keywords: 'MongoDB, Express, AngularJS, Node.js',
        googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID'
    },
    port: process.env.PORT || 3000,
    templateEngine: 'swig',
    sessionSecret: 'MEAN',
    sessionCollection: 'sessions'
};