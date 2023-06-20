(function () {
    'use strict';

    var app = angular.module('contractorInvoiceApp', [
        'ngResource',
        'ngSanitize',
        'ngLoadingSpinner',

        // 3rd Party Modules
        'ui.bootstrap',
        'ui.router',
        'ui.mask',
        'angularUtils.directives.dirPagination',
        'angularSpinner',
        'xeditable',
        'ui.grid',
        'ui.grid.resizeColumns',
        'ui.grid.edit',
        'ui.grid.selection',
        'ui.grid.cellNav',
        'ui.grid.exporter',

        // Custom Modules
        'common.services'

    ]);

    app.run(function (editableOptions) {
        editableOptions.theme = 'bs3';
    });

    app.run(function ($rootScope, $location, $state, LoginService) {
        $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
            var validUser = sessionStorage.getItem("CIUser");

            if (!validUser && toState.name !== 'login') {
                $state.go("login");
                event.preventDefault();
                return;
            }
        });
    });

    app.config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise("/login");

            var startDate = moment().add(-14, 'days').format("MM/DD/YYYY");
            var endDate = moment().format("MM/DD/YYYY");

            $stateProvider

                // Login
                .state('login', {
                    url: '/login',
                    templateUrl: 'app/login/login.html',
                    controller: 'LoginCtrl as vm'
                })

                // Main
                .state("main", {
                    url: "/main",
                    abstract: true,
                    templateUrl: "app/main.html",
                    controller: 'MainCtrl',
                    controllerAs: 'vm'
                })

                // Reports
                .state("main.reports", {
                    url: "/reports",
                    views: {
                        'tabContent': {
                            templateUrl: "app/main/reportView.html",
                            controller: "ReportCtrl as vm",
                            resolve: {
                                dataFactory: 'dataFactory',

                                companies: function (dataFactory) {
                                    return dataFactory.getVendorsToInvoice();
                                }
                            }
                        }
                    }
                })

                // Data Import
                .state("main.dataImport", {
                    url: "/dataImport",
                    views: {
                        'tabContent': {
                            templateUrl: "app/main/dataImportView.html",
                            controller: "DataImportCtrl as vm",
                            resolve: {
                                dataFactory: 'dataFactory',

                                companies: function (dataFactory) {
                                    return dataFactory.getVendorsToInvoice();
                                }
                            }
                        }
                    }
                })

                // Review
                .state("main.dataReview", {
                    url: "/dataReview",
                    views: {
                        'tabContent': {
                            templateUrl: "app/main/ReviewView.html",
                            controller: "ReviewCtrl as vm",
                            resolve: {
                                dataFactory: 'dataFactory',

                                invoices: function (dataFactory) {
                                    return dataFactory.getContractorInvoiceSummaries(startDate, endDate);
                                }
                            }
                        }
                    }
                });
        }
    ]);

    app.controller('LoginController', function ($scope, $rootScope, $stateParams, $state, LoginService) {
        $rootScope.title = "Contractor Invoicing";

        $scope.formSubmit = function () {
            if (LoginService.login($scope.username, $scope.password)) {
                $scope.error = '';
                $scope.username = '';
                $scope.password = '';
                $state.transitionTo('main');
            } else {
                $scope.error = "Incorrect username/password !";
            }
        };

    });

    app.factory('LoginService', function () {
        var admin = 'admin';
        var pass = 'pass';
        var isAuthenticated = false;

        return {
            login: function (username, password) {
                isAuthenticated = username === admin && password === pass;
                return isAuthenticated;
            },
            isAuthenticated: function () {
                return isAuthenticated;
            }
        };

    });

    angular.module('contractorInvoiceApp')
        .directive('datetimepickerNeutralTimezone', function () {
            return {
                restrict: 'A',
                priority: 1,
                require: 'ngModel',
                link: function (scope, element, attrs, ctrl) {
                    ctrl.$parsers.push(function (value) {
                        var date = new Date(value.getTime() - (60000 * value.getTimezoneOffset()));
                        return date;
                    });
                }
            };
        });

    app.directive('dateFormat', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelCtrl) {
                //Angular 1.3 insert a formater that force to set model to date object, otherwise throw exception.
                //Reset default angular formatters/parsers
                ngModelCtrl.$formatters.length = 0;
                ngModelCtrl.$parsers.length = 0;
            }
        };
    });

}());