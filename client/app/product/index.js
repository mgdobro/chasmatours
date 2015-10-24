var app=angular.module("app",[]);
   
app.controller("PruebaController",['$scope','$timeout',function($scope,$timeout) {
  $scope.producidoEvento="NO";
   
  $timeout(function() {
    $scope.producidoEvento="SIIIIII";
  },3000);
   
}]);