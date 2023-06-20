(function () {
    'use strict';

    angular
        .module('contractorInvoiceApp')
        .controller('ReviewCtrl',
            ['$scope',
                'appSettings',
                'dataFactory',
                'invoices',
                ReviewCtrl]);

    function ReviewCtrl($scope, appSettings, dataFactory, invoices) {
        var vm = this;           

        vm.invoices = invoices.data;
        vm.removeInvoice = removeInvoice;
        vm.update = update;

        toastr.options = appSettings.toastrErrorOptions;

        const today = new Date();
        const start = new Date().setDate(today.getDate() - 14);
        vm.startDate = new Date(start);
        vm.endDate = new Date();

        function update() {
            getInvoiceSummaries();
        }

        function getInvoiceSummaries() {
            let startDate = moment(vm.startDate).format("MM/DD/YY");
            let endDate = moment(vm.endDate).format("MM/DD/YY");

            dataFactory.getContractorInvoiceSummaries(startDate, endDate)
                .then(function (response) {
                    vm.invoices = response.data;
                });
        }

        function removeInvoice(invoiceDate, contractor) {
            let dateToRemove = moment(invoiceDate).format("MM/DD/YY");
            let startDate = moment(vm.startDate).format("MM/DD/YY");
            let endDate = moment(vm.endDate).format("MM/DD/YY");
            dataFactory.removeInvoiceForContractor(contractor, dateToRemove)
                .then(function (response) {
                    dataFactory.getContractorInvoiceSummaries(startDate, endDate)
                        .then(function (response) {
                            vm.invoices = response.data;
                        });
                });
        }

        // Calender 
        $scope.today = function () {
            $scope.dt = new Date();
        };
        $scope.today();

        $scope.clear = function () {
            $scope.dt = null;
        };

        $scope.inlineOptions = {
            customClass: getDayClass,
            minDate: new Date(),
            showWeeks: true
        };

        $scope.dateOptions = {
            //  dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(2030, 5, 22),
            minDate: new Date(),
            startingDay: 1
        };

        $scope.toggleMin = function () {
            $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
            $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
        };

        $scope.toggleMin();

        $scope.open1 = function () {
            $scope.popup1.opened = true;
        };

        $scope.open2 = function () {
            $scope.popup2.opened = true;
        };

        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[0];
        $scope.altInputFormats = ['M!/d!/yyyy'];

        $scope.popup1 = {
            opened: false
        };

        $scope.popup2 = {
            opened: false
        };

        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        var afterTomorrow = new Date();
        afterTomorrow.setDate(tomorrow.getDate() + 1);
        $scope.events = [
            {
                date: tomorrow,
                status: 'full'
            },
            {
                date: afterTomorrow,
                status: 'partially'
            }
        ];

        function getDayClass(data) {
            var date = data.date,
                mode = data.mode;
            if (mode === 'day') {
                var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

                for (var i = 0; i < $scope.events.length; i++) {
                    var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

                    if (dayToCheck === currentDay) {
                        return $scope.events[i].status;
                    }
                }
            }

            return '';
        }
    }

}());