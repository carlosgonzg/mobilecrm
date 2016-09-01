'use strict';
angular.module('MobileCRMApp')
  .directive('scDatepicker', function () {
    return {
      restrict: 'EA', //Sports, its in the game!
      scope: {
        ngModel: '=',
        dpDays: '=?',
        dpDaysAbbr: '=?',
        dpMonths: '=?',
        dpMonthsAbbr: '=?',
        todayText: '=?',
        okText: '=?',
        disable: '=ngDisabled',
        required: '=ngRequired',
        left: '=',
        notAutoFill: '=',
				ngChange: '&?',
        time: '=?'
      },
      templateUrl: 'views/directives/datepicker.html', //put the template in this folder...or change the path
      link: function (scope, element, attrs) {},
      controller: function ($scope, $animate, $window, $timeout, toaster) {
        $timeout(function () {
          $('#modelFixed').mask('00/00/0000');
        });
        $scope.frontData = $scope.ngModel ? new Date($scope.ngModel) || '' : '';
        $scope.days = $scope.dpDays || ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        $scope.daysAbbr = $scope.dpDaysAbbr || ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'];
        $scope.monthsAbbr = $scope.dpMonths || ['ENE', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        $scope.months = $scope.dpMonthsAbbr || ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiempbre', 'Octuber', 'Noviember', 'Diciember'];
        // $scope.ngModel = angular.isDate($scope.ngModel) ? $scope.ngModel : new Date($scope.ngModel) == 'Invalid Date' ? new Date() : new Date($scope.ngModel);
        $scope.selectedDate = $scope.ngModel ? new Date($scope.ngModel) || new Date() : new Date();
        $scope.calendar = [];
        $scope.open = false;
        $scope.useManualDate = false;
        $scope.manualDate = {
            day: '',
            month: '',
            year: ''
          }
          //Returns which day is the first, which day is the last and also how many days the month have
        var monthInfo = function (date) {
          return {
            firstDay: new Date(date.getFullYear(), date.getMonth(), 1).getDay(),
            lastDay: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDay(),
            totalOfDays: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
          };
        };
        var setCalendar = function () {
          var month = monthInfo($scope.selectedDate);
          var inserted = 0;
          var calendar = [];
          for (var day = 1; day <= month.totalOfDays;) {
            calendar.push([]);
            for (var dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
              if ((day == 1 && dayOfWeek == month.firstDay) || day > 1 || ((day == month.totalOfDays && dayOfWeek == month.lastDay))) {
                var newDay = new Date(angular.copy($scope.selectedDate));
                newDay.setDate(day);
                if (inserted < month.totalOfDays) {
                  calendar[calendar.length - 1].push(newDay);
                }
                day++;
                inserted++;
              } else {
                calendar[calendar.length - 1].push('');
              }
            }
          }
          return calendar;
        };
        var areEqual = function (date_a, date_b) {
          var cDate_a = new Date(date_a);
          var cDate_b = new Date(date_b);
          if (cDate_a == '' || cDate_b == '')
            return false;
          return cDate_a.getFullYear() == cDate_b.getFullYear() && cDate_a.getMonth() == cDate_b.getMonth() && cDate_a.getDate() == cDate_b.getDate();
        };
        var dateToString = function (date) {
          if (date) {
            var cDate = new Date(date);
            var dia = cDate.getDate();
            var mes = parseInt(cDate.getMonth()) + 1;
            var ano = cDate.getFullYear();
            var hora = cDate.getHours();
            var min = cDate.getMinutes();
            if (mes < 10) {
              mes = '0' + mes;
            }
            if (dia < 10) {
              dia = '0' + dia;
            }

            hora = moment(date).format('hh');
            min = moment(date).format('mm');

          } else {
            var dia = 'dd';
            var mes = 'mm';
            var ano = 'yyyy';
          }
          if ($scope.time){
            var fecha = dia + '/' + mes + '/' + ano + " " + hora + ":" + min + moment(date).format("A");
          }
          else{
            var fecha = dia + '/' + mes + '/' + ano;
          }
          return fecha;
        };
        var fade = function (elm, type, fn) {
          var inOrOut = type == 'in' ? 'fadeIn' : type == 'out' ? 'fadeOut' : 'none';
          if (inOrOut == 'none')
            return;
          //$animate.removeClass($(elm), 'animated fadeIn');
          //$animate.removeClass($(elm), 'animated fadeOut');
          $animate.addClass($(elm), 'animated ' + inOrOut).then(function () {
            //this will still be called even if cancelled
            $animate.removeClass($(elm), 'animated ' + inOrOut);

            if (fn) {
              fn();
            }
          });
        };
        $scope.getStyle = function (day) {
          return areEqual($scope.selectedDate, day) ? 'dp-dateisselected' : areEqual(day, new Date()) ? 'dp-dateistoday' : 'dp-dateisnone';
        };
        $scope.opendp = function () {
          $scope.open = true;
          if (!$scope.ngModel)
            $scope.selectedDate = angular.copy($scope.ngModel);
          //fade('#dp-date', 'in');
        };
        $scope.closedp = function () {
          //fade('#dp-date', 'out', function(){
          $scope.open = false;
          //});
        };
        $scope.toggledp = function () {
          if ($scope.open)
            $scope.closedp();
          else
            $scope.opendp();
        };
        $scope.today = function () {
          $scope.selectedDate = new Date();
          $scope.calendar = setCalendar();
          $scope.setDate();
        };
        $scope.clear = function () {
            $scope.ngModel = null;
          }
          //Goes to the previous month or previous year depending on the view
        $scope.previousRange = function (type) {
          if (type == 'month') {
            $scope.selectedDate.setMonth($scope.selectedDate.getMonth() - 1);
          } else if (type == 'year') {
            $scope.selectedDate.setFullYear($scope.selectedDate.getFullYear() - 1);
          }
          $scope.calendar = setCalendar();
          $scope.setDate();
        };
        //Goes to the next month or next year depending on the view
        $scope.nextRange = function (type) {
          if (type == 'month') {
            $scope.selectedDate.setMonth($scope.selectedDate.getMonth() + 1);
          } else if (type == 'year') {
            $scope.selectedDate.setFullYear($scope.selectedDate.getFullYear() + 1);
          }
          $scope.calendar = setCalendar();
          $scope.setDate();
        };
        //It changes the view from day(full month), to month(each month in a year), to year(range of the +/- 5 years) and it goes back to date
        $scope.changeView = function () {};
        //Save the date to the model
        $scope.setDate = function (date) {
          if (!date) {
            $scope.ngModel = angular.copy($scope.selectedDate);
						if($scope.ngChange){
							$scope.ngChange();
						}
            //						$scope.closedp();
          } else {
            $scope.selectedDate = angular.copy(date);
            $scope.setDate();
          }
        };

        $scope.setManualEdit = function (condition) {
          $scope.manualDate = {
            day: '',
            month: '',
            year: ''
          }
          $scope.useManualDate = condition;
        }

        $scope.saveManualDate = function () {
          if ($scope.manualDate.day && $scope.manualDate.month && $scope.manualDate.year && new Date($scope.manualDate.year + '-' + $scope.manualDate.month + '-' + $scope.manualDate.day) != 'Invalid Date') {
            $scope.setDate(new Date($scope.manualDate.year + '-' + $scope.manualDate.month + '-' + $scope.manualDate.day));
            $scope.calendar = setCalendar();
            $scope.setDate();
            $scope.setManualEdit(false);
          } else {
            toaster.pop('warning', 'Alerta', 'Existen valores incompletos o inválidos')
          }
        }

        $scope.validateDate = function (thisDate) {
          if (thisDate.day && thisDate.month && thisDate.year) {
            var dateMonth = moment(date).get('month');
            var newDate = new Date(thisDate.year + '-' + thisDate.month + '-' + thisDate.day);
            if (newDate == 'Invalid Date' || moment(newDate).get('month') != dateMonth) {
              thisDate.year = (isNaN(thisDate.year)) ? (new Date()).getFullYear() : thisDate.year;
              thisDate.month = (isNaN(thisDate.month) || thisDate.month > 12 || thisDate.month < 1) ? 1 : thisDate.month;
              var date = moment(thisDate.month + '-' + thisDate.year, 'MM-DD');
              date = date.endOf('month');
              var lastDay = moment(date).get('date');
              thisDate.day = (isNaN(thisDate.day) || thisDate.day < 0 || thisDate.day > lastDay) ? lastDay : thisDate.day;
            }
          }
        }

        $scope.changeMinute = function (next){
          if (next){
            $scope.selectedDate.setMinutes($scope.selectedDate.getMinutes()+1);
          }
          else{
            $scope.selectedDate.setMinutes($scope.selectedDate.getMinutes()-1);
          }
          $scope.setDate();

        }

        $scope.changeMeridian = function (){
          if ($scope.meridian == 'PM'){
            $scope.meridian = 'AM'
          }
          else{
            $scope.meridian = 'PM'
          }
        }

        $scope.changeView = function (){
          $scope.setTime = !$scope.setTime;
        }

        $scope.changeHour = function (next){
          if (next){
            $scope.selectedDate.setHours($scope.selectedDate.getHours()+1);
          }
          else{
            $scope.selectedDate.setHours($scope.selectedDate.getHours()-1);
          }
          $scope.setDate();
        }

        $scope.getFixedHours = function (){
          return moment($scope.selectedDate).format('hh');

        }

        $scope.getFixedMinutes = function (){
          return moment($scope.selectedDate).format('mm');
        }

        $scope.getMeridian = function (){
          return moment($scope.selectedDate).format('A')
        }

        $scope.$watch('ngModel', function () {
          if ($scope.ngModel) {
            $scope.selectedDate = angular.copy($scope.ngModel)
            $scope.ngModelFixed = dateToString(angular.copy($scope.ngModel));
          }
          else{
            $scope.selectedDate = undefined;
            $scope.ngModelFixed = undefined;

          }
        });
        $scope.changeNgModel = function () {
          if (/\d\d\/\d\d\/\d\d\d\d/.test($scope.ngModelFixed) || /\d\d\/\d\d\/\d\d/.test($scope.ngModelFixed)) {
            var dateString = $scope.ngModelFixed.split('/');
            var year = new Date().getFullYear().toString().substr(0, 2);
            var yearFull = dateString[2].length == 2 ? year + dateString[2].toString() : dateString[2].toString();
            var date = new Date(yearFull, parseInt(dateString[1]) - 1, dateString[0]);
            $scope.selectedDate = date;
            $scope.ngModel = date;
            $scope.calendar = setCalendar();
          } else if ($scope.ngModelFixed == '' || !$scope.ngModelFixed) {
            $scope.clear();
          }
        };
        $scope.$watch('open', function () {
          $scope.useManualDate = angular.copy(!$scope.open);
        });
        //Implementation
        $scope.calendar = setCalendar();
        $scope.ngModel = ($scope.ngModel) ? new Date($scope.ngModel) : new Date();
        $scope.ngModelFixed = dateToString(angular.copy($scope.selectedDate));
        if ($scope.notAutoFill) {
          if ($scope.frontData == '' || $scope.frontData == null) {
            // model
            $scope.clear();
            // se ve en el input
            $scope.ngModelFixed = '';
          };
        } else {
          $timeout(function () {
            $scope.ngModel = ($scope.ngModel) ? new Date($scope.ngModel) : new Date();
          }, 200)
        }
      }
    }
  });
