'use strict';

/**
 * @ngdoc overview
 * @name flyersremorseApp
 * @description
 * # flyersremorseApp
 *
 * Main module of the application.
 */
angular
  .module('app', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/chart', {
        templateUrl: 'views/chart.html',
        controller: 'ChartCtrl'
      })
        .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })

  .service('searchRequest', function ($rootScope) {
    var searchParameters;
    return {
        getProperties: function () {
            return searchParameters;
        },
        setProperties: function(value) {
            searchParameters = value;
        }
    };
});

