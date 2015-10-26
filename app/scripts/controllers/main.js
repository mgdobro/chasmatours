'use strict';

/**
 * @ngdoc function
 * @name flyersremorseApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the flyersremorseApp
 */
angular.module('app')
  .controller('MainCtrl',['$scope', '$location', 'searchRequest', function ($scope, $location, searchRequest) {

  	$scope.searchParams = {
  		origin: 'DFW',
  		arrival: 'LAS',
  		departureDate: '',
  		arrivalDate: '',
      lengthOfStay: '',
      endOfCalendar: ''
  	};

  	var $select = $('#origin_airport').selectize({
                valueField: 'code',
                labelField: 'code',
                searchField: 'code',
                options: [],
                create: false,
                onChange: function(value){
                  $scope.searchParams.origin = value;
                },
                render: {
                    option: function(item, escape) {
                        return '<div>' +
                             escape(item.code) + ' - ' + escape(item.name) + ' - ' + escape(item.city) +
                        '</div>';
                    }
                },
                load: function(query, callback) {
                    if (!query.length) return callback();
                    $.ajax({
                        url: 'http://bridge2.sabre.cometari.com/airports.php?code=' + encodeURIComponent(query.toUpperCase()),
                        type: 'GET',
                        error: function() {
                            callback();
                        },
                        success: function(res) {
                            callback(res);
                        }
                    });
                }
    });

	  var $select = $('#arrival_airport').selectize({
                valueField: 'code',
                labelField: 'code',
                searchField: 'code',
                options: [],
                create: false,
                onChange: function(value){
                  $scope.searchParams.arrival = value;
                },
                render: {
                    option: function(item, escape) {
                        return '<div>' +
                             escape(item.code) + ' - ' + escape(item.name) + ' - ' + escape(item.city) +
                        '</div>';
                    }
                },
                load: function(query, callback) {
                    if (!query.length) return callback();
                    $.ajax({
                        url: 'http://bridge2.sabre.cometari.com/airports.php?code=' + encodeURIComponent(query.toUpperCase()),
                        type: 'GET',
                        error: function() {
                            callback();
                        },
                        success: function(res) {
                            callback(res);
                        }
                    });
                }
    });

  $scope.plus7days = new Date();
  $scope.plus7days.setDate($scope.plus7days.getDate() + 7 );
  $scope.plus7days_date = ($scope.plus7days.toISOString()).substring(0,10);

  $scope.searchParams.departureDate = $scope.plus7days_date;

  $scope.plus14days = new Date();
  $scope.plus14days.setDate($scope.plus14days.getDate() + 14 );
  $scope.plus14days_date = ($scope.plus14days.toISOString()).substring(0,10);

  $scope.searchParams.arrivalDate = $scope.plus14days_date;

  $scope.earliestdeparture = '';

  if($scope.searchParams.departureDate === ""){
      $scope.earliestdeparture =  $scope.plus7days_date;
  }else{
      $scope.earliestdeparture = $scope.searchParams.departureDate;
  };

  $scope.latestdeparture = '';

  if($scope.searchParams.arrivalDate === ""){
      $scope.latestdeparture =  $scope.plus14days_date;
  }else{
      $scope.latestdeparture = $scope.searchParams.arrivalDate;
  };

  $scope.searchRequest = function(){
    $scope.getLengthOfStay();
    $scope.getEndOfCalendar();
    $scope.getStartIndexDay();
    $scope.getEndIndexDay();

    searchRequest.setProperties($scope.searchParams);
    $location.path('/chart').replace();
  };

  $scope.validateLengthOfStay = function(){
    $scope.getLengthOfStay();

    if($scope.searchParams.lengthOfStay > 16){
      return false;
    } else{
      return true;
    }
  }

  $scope.getLengthOfStay = function(){
    var departureDay = moment($scope.searchParams.departureDate);
    var arrivalDay = moment($scope.searchParams.arrivalDate);
    var length = arrivalDay.diff(departureDay);
    var d = moment.duration(length);
    $scope.searchParams.lengthOfStay = d._data.days;
  }

  $scope.getEndOfCalendar = function(){
    var endOfCalendarRaw = moment().add(60, 'days');
    var endOfCalendarFormat = endOfCalendarRaw.format("YYYY-MM-DD");
    $scope.searchParams.endOfCalendar = endOfCalendarFormat;
  }

  $scope.getStartIndexDay = function(){
    var currentDay = moment();
    var arrivalDay = moment($scope.searchParams.departureDate);
    var length = arrivalDay.diff(currentDay);
    var d = moment.duration(length);
    $scope.searchParams.startIndexDay = d._data.days;
  }

  $scope.getEndIndexDay = function(){
    $scope.searchParams.endIndexDay = $scope.searchParams.startIndexDay + 14;
  }

}]);
