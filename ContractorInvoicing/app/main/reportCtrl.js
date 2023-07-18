(function () {
    'use strict';

    angular
        .module('contractorInvoiceApp')
        .controller('ReportCtrl',
            ['$scope',
                'appSettings',
                'companies',
                'dataFactory',
                ReportCtrl]);

    function ReportCtrl($scope, appSettings, companies, dataFactory) {
        var vm = this;           

        vm.companies = companies.data;
        vm.print = print;
        vm.update = update;

        toastr.options = appSettings.toastrErrorOptions;

        //FOR TESTING
        //vm.startDate = new Date('6/1/2023');
        //vm.endDate = new Date('6/15/2023');
        //vm.selectedCompany = 'BIES';
        //END TESTING

        function update() {
            getGateSwipes();
        }

        function getGateSwipes() {
            let startDate = moment(vm.startDate).format("MM/DD/YY");
            let endDate = moment(vm.endDate).format("MM/DD/YY");
            vm.hoursWorked = [];
            let hoursByDay = [];
            let contractorInvoices = [];
            vm.comparisonData = [];

            dataFactory.getContractorSwipeHistory(startDate, endDate, vm.selectedCompany)
                .then(function (response) {
                    let swipesByPerson = groupBy(response.data, 'BADGENUM');
                    //let swipesByPerson = groupBy(filteredDataTest, 'BADGENUM');
                    Object.keys(swipesByPerson).forEach((p) => {
                        // If the first swipe is an OUT swipe get rid of it
                        if (swipesByPerson[p][0].DIRECTION === 'OUT') {
                            swipesByPerson[p].shift();
                        }
                        swipesByPerson[p].forEach((x, i) => {
                            // Get rid of current swipe if previous swipe is in the same direction
                            // and both swipes are IN, if they are both in the same direction and 
                            // are OUT swipes, get rid of the current swipe
                            if (
                                (i > 0 &&
                                    x.DIRECTION === 'OUT' &&
                                    swipesByPerson[p][i - 1].DIRECTION === 'OUT') ||
                                (i > 0 &&
                                    x.DIRECTION === 'IN' &&
                                    swipesByPerson[p][i - 1].DIRECTION === 'IN')
                            ) {
                                if (x.DIRECTION === 'IN') {
                                    swipesByPerson[p].splice(i - 1, 1);
                                } else {
                                    swipesByPerson[p].splice(i, 1);
                                }
                            }
                        });

                        swipesByPerson[p].forEach((y, i) => {
                            if (swipesByPerson[p][i].DIRECTION === 'OUT') {
                                vm.hoursWorked.push({
                                    ENTRYDATE: swipesByPerson[p][i - 1] ? swipesByPerson[p][i - 1].ENTRYDATE : '',
                                    SHIFTDATE: swipesByPerson[p][i - 1] ? new Date(swipesByPerson[p][i - 1].ENTRYDATE).toLocaleDateString() : '',
                                    EMPLOYEEID: swipesByPerson[p][i].EMPLOYEEID,
                                    FIRST_NAME: swipesByPerson[p][i].FIRST_NAME,
                                    LAST_NAME: swipesByPerson[p][i].LAST_NAME,
                                    NAME: swipesByPerson[p][i].NAME,
                                    BADGENUM: swipesByPerson[p][i].BADGENUM,
                                    CONTRACTOR: swipesByPerson[p][i].VENDOR_COMPANY,
                                    SWIPE_IN: swipesByPerson[p][i - 1] ? swipesByPerson[p][i - 1].ENTRYDATE : '',
                                    SWIPE_OUT: swipesByPerson[p][i].ENTRYDATE,
                                    TOTAL_HOURS: swipesByPerson[p][i - 1] ? getTimeDifference(
                                        new Date(swipesByPerson[p][i - 1].ENTRYDATE),
                                        new Date(swipesByPerson[p][i].ENTRYDATE)
                                    ) : '',
                                    TOTAL_MINUTES: swipesByPerson[p][i - 1] ? getMinutesFromDuration(getTimeDifference(
                                        new Date(swipesByPerson[p][i - 1].ENTRYDATE),
                                        new Date(swipesByPerson[p][i].ENTRYDATE))
                                    ) : '',
                                });
                            }
                        });
                    });
                    //updateGrid(vm.hoursWorked, swipesWithHoursColumns);
                })
                .then(function () {
                    hoursByDay = Object.values(vm.hoursWorked.reduce((r, e) => {
                        let key = e.BADGENUM + '|' + e.SHIFTDATE;
                        if (!r[key]) {
                            r[key] = e;
                        } else {
                            r[key].TOTAL_MINUTES += e.TOTAL_MINUTES;
                        }
                        return r;
                    }, {}));
                })
                .then(function () {
                    hoursByDay.map((h) => {
                        return h.TOTAL_HOURS = new Date(h.TOTAL_MINUTES * 60 * 1000).toISOString().substr(11, 8);
                    });
                })
                .then(function () {
                    dataFactory.getContractorInvoicesTotals(vm.selectedCompany, startDate, endDate)
                        .then(function (response) {
                            contractorInvoices = response.data;
                        })
                        .then(function () {
                            vm.comparisonData = compareInvoicesToSwipes(contractorInvoices, hoursByDay);
                        });
                });
        }

        function compareInvoicesToSwipes(invoices, swipes) {
            let timeComparison = [];
            invoices.forEach((entry) => {
                let currentRecord = {};
                //let swipeRecord = swipes.filter((swipe) => {
                //    console.log(swipe);
                //    return Date.parse(swipe.SHIFTDATE) === Date.parse(entry.SHIFTDATE) && swipe.NAME.toLowerCase() === entry.NAME.toLowerCase();
                //})[0];

                let swipeRecord = swipes.filter((swipe) => {
                    return Date.parse(swipe.SHIFTDATE) === Date.parse(entry.SHIFTDATE) && swipe.EMPLOYEEID.toLowerCase() === entry.CLOCK_NUM.toLowerCase();
                })[0];

                currentRecord.SHIFT_DATE = entry.SHIFTDATE;
                currentRecord.CLOCK_NUM = entry.CLOCK_NUM;
                currentRecord.NAME = entry.NAME;
                currentRecord.INVOICE_MINUTES = entry.TOTAL_MINUTES;
                currentRecord.SWIPE_MINUTES = swipeRecord ? swipeRecord.TOTAL_MINUTES : 0;

                timeComparison.push(currentRecord);
            });

            return timeComparison;
        }

        function getMinutesFromDuration(duration) {
            const [hours, minutes] = duration.split(':').map(n => +n);

            return hours * 60 + minutes;
        }

        function getTimeDifference(startTime, endTime) {
            const difference = endTime - startTime;
            const differenceInMinutes = difference / 1000 / 60;
            let hours = Math.floor(differenceInMinutes / 60);
            if (hours < 0) {
                hours = 24 + hours;
            }
            let minutes = Math.floor(differenceInMinutes % 60);
            if (minutes < 0) {
                minutes = 60 + minutes;
            }
            const hoursAndMinutes = hours + ':' + (minutes < 10 ? '0' : '') + minutes;
            return hoursAndMinutes;
        }

        const groupBy = (arr, property) => {
            return arr.reduce((acc, curr) => {
                let key = curr[property.toUpperCase()];
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(curr);
                return acc;
            }, {});
        };

        function print() {
            let startDate = moment(vm.startDate).format("MM/DD/YY");
            let endDate = moment(vm.endDate).format("MM/DD/YY");
            let doc = new jsPDF();
            doc.page = 1;

            doc.setFont('Times').setFontSize(14).setFontType('bold');
            doc.text(8, 10, `Invoice - Gate Swipe Comparison for ${vm.selectedCompany} ${startDate} - ${endDate}`);
            doc.line(8, 12, doc.internal.pageSize.width - 5, 12);

            doc.autoTable({
                html: '#timeComparisonTable',
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    lineWidth: .4
                },
                bodyStyles: {
                    lineWidth: .4
                },
                columnStyles: {
                        0: { cellWidth: 25 },
                        1: { cellWidth: 30 },
                        2: { cellWidth: 35 },
                        3: { cellWidth: 35 },
                        4: { cellWidth: 40 },
                        5: { cellWidth: 30 },
                },
                styles: { valign: 'middle', fontSize: 10 }, //, halign: 'center' },
                startY: 15,
                margin: 3,
                tableWidth: 'wrap',
                theme: 'grid',
                //didParseCell: function (data) {
                //    if (data.column.index === 5 && parseInt(data.cell.text[0]) > 100) {
                //        data.cell.styles.fillColor = [202, 202, 202];
                //    }
                //}
            });

            doc.save('GateSwipeInvoiceComparison.pdf');
        }

        $scope.exportData = function () {
            if (!vm.startDate || !vm.endDate || !vm.selectedCompany) {
                toastr.info("Please enter Start Date, End Date and Contractor");
                return;
            }

            if (!vm.comparisonData) {
                toastr.info("No data to export");
                return;
            }

            let dataToExport = [];
            vm.comparisonData.forEach((entry) => {
                let swipe = {
                    'SHIFT DATE': entry.SHIFT_DATE,
                    'Clock #': entry.CLOCK_NUM,
                    'NAME': entry.NAME,
                    'INVOICE MINUTES': entry.INVOICE_MINUTES,
                    'GATE SWIPE MINUTES': entry.SWIPE_MINUTES,
                    'DIFFERENCE': entry.INVOICE_MINUTES - entry.SWIPE_MINUTES
                };
                dataToExport.push(swipe);
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true, dateNF: 'M/D/YYYY' });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Contractor Invoicing Check");
            XLSX.writeFile(workbook, "ContractorInvoicingCheck.xlsx", { compression: true });
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