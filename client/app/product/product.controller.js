'use strict';

angular.module('meanordersApp')
  .controller('ProductCtrl', function ($scope, $http, Auth, User, $location, socket, Notification, dialogs) {

  	$scope.awesomeProducts = [];
    
    $scope.productsGrid = {
      enableFiltering: true,
      enableSorting: true,
      infiniteScrollRowsFromEnd: 40,
      infiniteScrollUp: true,
      infiniteScrollDown: true,
      rowHeight: 40,
      columnDefs: [
        { name: 'Product',field: 'name' },
        { name: 'Description',field: 'info' }, 
        { name: 'Actions',
            cellClass: 'ui-grid-vcenter',
            enableColumnMenu: false,
            enableFiltering: false,
            enableSorting: false,
            cellTemplate:'<button class="btn btn-primary" ng-click="grid.appScope.viewProduct(row.entity)">View</button> <button class="btn btn-danger" ng-click="grid.appScope.deleteProduct(row)">Delete</button>' }
      ],
      onRegisterApi: function( gridApi ) {
        $scope.grid1Api = gridApi;
      }
    };    

    $http.get('/api/products').success(function(awesomeProducts) {
      $scope.awesomeProducts = awesomeProducts;
      $scope.productsGrid.data = awesomeProducts;
    });

    $scope.deleteProduct = function(product) {
       var index = $scope.productsGrid.data.indexOf(product.entity);    
       var productName = product.entity.name;
       var dlg = dialogs.confirm();
       dlg.result.then(function(btn){
         $http.delete('/api/products/' + product.entity._id).success(function(product, $state) {
            $scope.productsGrid.data.splice(index, 1);
            Notification.success({message: 'Product ' + productName + ' Deleted', title: 'Delete operation'});
          })
       },function(btn){
            Notification.success({message: 'Product ' + productName + ' Delete cancelled', title: 'Delete operation'});
       });
       };
       
    $scope.viewProduct = function(product) {
       $location.path('/product/'+product._id+'/view');
       
    };

   
  })
  .controller('ProductViewCtrl',function ($scope,$location,  $http, $stateParams, Auth, User) {  

      $scope.product = '';

      $http.get('/api/products/' + $stateParams.id).success(function(product) {
          $scope.product = product;
      });
  
      $scope.cancel = function() {
       $location.path('/product');
    };    
     
  }).controller('ProductCreateController',function($scope,$state,$http,$stateParams, $location,Notification, dialogs){

    $scope.product= {};

    $scope.addProduct = function(){
      var productName = $scope.product.name;
      var dlg = dialogs.confirm();
       dlg.result.then(function(btn){
         $http.post('/api/products', $scope.product).success(function(product, $state) {
             Notification.success({message: 'Product ' + productName + ' created', title: 'Create operation'});
             $location.path('/product');
        })
       },function(btn){
            Notification.success({message: 'Product ' + productName + ' create cancelled', title: 'Create operation'});
       });
        
        };
    
    $scope.cancel = function() {
      $location.path('/product');
      Notification.success({message: 'Product create cancelled', title: 'Create operation'});
    }

  }).controller('ProductEditCtrl',function ($scope, $state, $http,  $location, $stateParams, Auth, User) {  

   $scope.product = '';

   $scope.updateProduct = function(){
        
        $http.put('/api/products/' + $stateParams.id, $scope.product).success(function(product, $state) {
            $location.path('/product');
        }
    )};

    $scope.loadProduct = function(){
          $http.get('/api/products/' + $stateParams.id).success(function(product) {
          $scope.product = product;
      });
    };

    $scope.loadProduct();
    
    $scope.cancel = function() {
        $http.get('/api/products/' + $stateParams.id).success(function(product) {
           $location.path('/product/'+product._id+'/view');
      });
    };

    
  });
