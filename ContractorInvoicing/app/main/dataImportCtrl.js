(function () {
    'use strict';

    angular
        .module('contractorInvoiceApp')
        .controller('DataImportCtrl',
            ['$scope',
                'appSettings',
                'companies',
                'dataFactory',
                DataImportCtrl]);

    function DataImportCtrl($scope, appSettings, companies, dataFactory) {
        var vm = this;           

        vm.companies = companies.data;

        toastr.options = appSettings.toastrErrorOptions;

        $scope.SelectedFileForUpload = null;

        $scope.UploadFile = function (files) {
            $scope.$apply(function () { //I have used $scope.$apply because I will call this function from File input type control which is not supported 2 way binding
                $scope.Message = "";
                $scope.SelectedFileForUpload = files[0];
            });
        };

        $scope.ParseExcelDataAndSave = function () {
            let invoiceData = [];
            let file = $scope.SelectedFileForUpload;

            if (file) {
                let reader = new FileReader();
                reader.onload = function (e) {
                    let data = e.target.result;
                    //XLSX from js-xlsx library , which I will add in page view page
                    let workbook = XLSX.read(data, { type: 'binary' });
                    // if importing Manhours data, get the second sheet, if baseline hours, get the first sheet
                    let sheetName = '';
                    // if (workbook.SheetNames.length > 1) {


                    sheetName = workbook.SheetNames[0];
                    let excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                    excelData.forEach(d => {
                        invoiceData.push({
                            INVOICE_DATE: vm.INVOICE_DATE.toLocaleDateString(),
                            ENTRYDATE: new Date(d['Date (MM/DD/YY)']).toLocaleDateString(),
                            CLOCK_NUM: d['Technician Clock #'],
                            NAME: d['Technician Name'],
                            DEPARTMENT: d['Department Name'],
                            HOURS_WORKED: d['Hours Worked (Decimal)'],
                            DESCRIPTION_OF_WORK: d['Description of Work'],
                            RATE: +(d[' Rate '].replace('$', '')),
                            TOTAL: +(d['Total '].replace('$', '').replace(',', '')),
                            NON_WORK_CHARGE: d['Non Worked Charges'] === 'X' ? 1 : 0,
                            CONTRACTOR: vm.selectedCompany
                        });
                    });

                    dataFactory.saveContractorInvoiceData(invoiceData)
                        .then(function (response) {
                            //console.log(response);
                        })
                        .then(function () {
                            vm.grid.data = invoiceData;
                        });
                };
                reader.onerror = function (ex) {
                    console.log(ex);
                };

                reader.readAsBinaryString(file);
            }
        };

        let importDataColumns = [
            { name: 'INVOICE_DATE', displayName: 'INVOICE DATE', cellFilter: 'date:\'MM-dd-yyyy\'' },
            { name: 'ENTRYDATE', displayName: 'ENTRY DATE', cellFilter: 'date:\'MM-dd-yyyy\'' },
            { name: 'CLOCK_NUM', displayName: 'CLOCK #' },
            { name: 'NAME', displayName: 'NAME' },
            { name: 'DEPARTMENT', displayName: 'DEPARTMENT' },
            { name: 'HOURS_WORKED', displayName: 'HOURS WORKED' },
            { name: 'DESCRIPTION_OF_WORK', displayName: 'DESCRIPTION OF WORK' },
            { name: 'RATE', displayName: 'RATE' },
            { name: 'TOTAL', displayName: 'TOTAL' },
            { name: 'NON_WORK_CHARGE', displayName: 'NON WORK CHARGE' },
            { name: 'CONTRACTOR', displayName: 'CONTRACTOR' },
        ];

        vm.grid = {
            exporterMenuCsv: false,
            exporterMenuPdf: false,
            enableGridMenu: true,
            enableFiltering: true,
            enableRowHeaderSelection: false,
         //   data: gridData,
            enableRowSelection: true,
            enableCellEditOnFocus: false,
            contentEdittable: false,
            multiSelect: false,
            exporterExcelFilename: 'ContractorImportData.xlsx',
            columnDefs: importDataColumns
        };

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