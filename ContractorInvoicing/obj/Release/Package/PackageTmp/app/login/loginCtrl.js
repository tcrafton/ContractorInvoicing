(function () {
    "use strict";

    angular
        .module("contractorInvoiceApp")
        .controller("LoginCtrl",
            ["$http",
                "$state",
                'dataFactory',
                LoginCtrl]);

    function LoginCtrl($http, $state, dataFactory) {
        var vm = this;

        vm.validateUser = validateUser;

        function validateUser(userName, userPass) {

            var validUser;

            var request = dataFactory.getIsValidUser(userName, userPass, 'CI')
                .then(function (response) {
                    validUser = response.data;
                    if (validUser.USER_NAME) {
                        sessionStorage.setItem('CIUser', validUser.UserName);                        
                        sessionStorage.setItem('CIRole', validUser.Role);
                        sessionStorage.setItem('CIEmpID', validUser.EMPLOYEEID);
                    }
                })
                .then(function () {
                    var operator = sessionStorage.getItem('CIUser');        
                    if (operator !== null) {
                        $state.go("main.dataImport");
                    } else {
                        vm.invalidLogin = "Invalid username and/or password, please try again."
                    }
                })
                .catch(function (err) {
                    console.log(err);
                });
        }

    }
}());
