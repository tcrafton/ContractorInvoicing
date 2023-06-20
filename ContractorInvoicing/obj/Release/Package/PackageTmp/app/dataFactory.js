angular.module('contractorInvoiceApp')
    .factory('dataFactory', ['$http', function ($http) {

        //const API_SERVER = 'http://localhost:64198/';
        const API_SERVER = 'http://nm-apps/mag7webapi/';
        const API_SERVER_EF = 'http://nm-apps/mag7webapief/';
        //const API_SERVER_EF = 'http://localhost:58192/';

        var dataFactory = {};

        dataFactory.getIsValidUser = function (userName, userPass, program) {
            return $http({
                url: `${API_SERVER}api/employee/GetIsValidUser?username=${userName}&userPass=${userPass}&program=${program}`,
                method: 'GET'
            });
        };

        dataFactory.saveContractorInvoiceData = function (invoices) {
            return $http({
                url: `${API_SERVER_EF}api/Accounting/SaveContractorInvoiceData`,
                method: 'POST',
                data: invoices
            });
        };

        dataFactory.getContractorSwipeHistory = function (startDate, endDate, contractor) {
            return $http({
                url: `${API_SERVER}api/HR/GetContractorSwipeHistory?startDate=${startDate}&endDate=${endDate}&contractor=${contractor}`,
                method: 'GET'
            });
        };

        dataFactory.getVendorsToInvoice = function () {
            return $http({
                url: `${API_SERVER}api/HR/GetVendorsToInvoice`,
                method: 'GET'
            });
        };

        dataFactory.getContractorInvoicesTotals = function (contractor, startDate, endDate) {
            return $http({
                url: `${API_SERVER_EF}api/Accounting/GetContractorInvoicesTotals?contractor=${contractor}&startDate=${startDate}&endDate=${endDate}`,
                method: 'GET'
            });
        };

        dataFactory.getContractorInvoiceSummaries = function (startDate, endDate) {
            return $http({
                url: `${API_SERVER}api/HR/GetContractorInvoiceSummaries?startDate=${startDate}&endDate=${endDate}`,
                method: 'GET'
            });
        };

        dataFactory.removeInvoiceForContractor = function (contractor, invoiceDate) {
            return $http({
                url: `${API_SERVER}api/HR/RemoveInvoiceForContractor?contractor=${contractor}&invoiceDate=${invoiceDate}`,
                method: 'DELETE'
            });
        };

        return dataFactory;
}]);
