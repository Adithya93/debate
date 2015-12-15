"use strict";
angular.module('biATM', [])
  .service("accountService", function($http) {
    this.account = $http.get('/api/getAccounts').then(function(res) {
      console.log(res);
      return res.data;
    });
  })
  .controller("accountController", function($scope, accountService) {
    $scope.getAccount = function() {
      accountService.account.then(function(res) {
        $scope.account = res[0];
      });
    };
    $scope.getAccount();
    $scope.$watch('account', function(newVal, oldVal) {
      // fetching user from server takes a while, so we want to watch this for change and broadcast on change
      if (newVal !== oldVal) {
        $scope.$broadcast('accountLoad', {
          "val": newVal
        });
        console.log("change " + JSON.stringify(newVal));
      }
    });
  });
