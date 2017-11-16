'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('CompanyCtrl', function ($scope, $rootScope, $location, toaster, company, dialogs) {
		$scope.company = company;

		if ($scope.company.perHours == undefined) {
			$scope.company.perHours = false
		}

		if ($rootScope.userData.role._id != 1) {
			$location.path('/noaccess');
		}

		$scope.save = function () {
			
			if ($scope.company.perHours == true) { //SI ES POR HORA
				if ($scope.company.costPerHours == "" || $scope.company.smallTruck == "") {
					toaster.error('Cost Per Hours can not be empty');
					return 
				}
				delete $scope.company.initialCost
				delete $scope.company.costPerMile
				delete $scope.company.initialMile
				$scope.company.perHours = true
				console.log(1)
			} else if ($scope.company.perHours == false && $scope.company.initialCost == "" && $scope.company.costPerMile == "" && $scope.company.initialMile == "" ) {
				delete $scope.company.costPerHours
				delete $scope.company.initialCost
				delete $scope.company.costPerMile
				delete $scope.company.initialMile
				delete $scope.company.smallTruck
			} else if ($scope.company.perHours == false) { // SI NO ES POR HORA
				delete $scope.company.costPerHours
				delete $scope.company.smallTruck
				$scope.company.perHours = false
			}			

 			$scope.company.save()
				.then(function (data) {
					toaster.success('The company was registered successfully');
					$location.path('companyList')
				},
				function (error) {
					console.log(error);
					toaster.error(error.message);
				}); 
		};

		$scope.checkedHours = function (e) {
			if (e == true) {
				$scope.company.perHours = true;
			} else {
				$scope.company.perHours = false;
			}
		};

		$scope.editMails = function () {
			var emails = $scope.company.sendCorporateMails ? $scope.company.sendCorporateMails : [];

			var dialog = dialogs.create('views/aditionalEmails.html', 'AditionalEmailsCtrl', { emails: emails });
			dialog.result.then(function (emails) {
				$scope.company.sendCorporateMails = emails;
			});
		}

	});
