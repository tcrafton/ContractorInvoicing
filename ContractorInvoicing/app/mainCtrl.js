(function () {
    'use strict';

    function MainCtrl($state, $stateParams) {
        /* jshint validthis:true */
        var vm = this;

        vm.tabs = [
            { text: 'Import Data', state: '.dataImport', index: 0 },
            { text: 'Reports', state: '.reports', index: 1 },
            { text: 'Review Data', state: '.dataReview', index: 2 }
        ];

        vm.activeTab = _.find(vm.tabs, function (tab) { return _.endsWith($state.current.name, tab.state) }).index;
    }

    angular.module('contractorInvoiceApp').controller('MainCtrl', MainCtrl);

    MainCtrl.$inject = ['$state', '$stateParams'];
})();