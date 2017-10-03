'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('crewLeaderListCtrl', function ($scope, $location, CrewCollection, RoleOptions, roles) {

		console.log(new CrewCollection().find)

		$scope.FirstOpction = 0
		$scope.SecondOpction = 1

		var FirstOpt = CrewCollection
		var User2ndOpt = CrewCollection

		$scope.roles = [
			{ description: "1st Option", },
			{ description: "2nd Option", }
		];

		$scope.userOpt = FirstOpt
		$scope.fields = [
			{
				title: 'Name',
				name: 'entity.fullName',
				type: 'text'
			}
		];
		$scope.search = [
			'entity.fullName'
		];

		$scope.sort = {
			'entity.fullName': 1
		}


		//second opction
		$scope.User2ndOpt = User2ndOpt
		$scope.fields2Opt = [
			{
				title: 'Name',
				name: 'entity.fullName',
				type: 'text'
			}
		];
		$scope.search = [
			'entity.fullName'
		];

		$scope.sort = {
			'entity.fullName': 1
		}

		$scope.selectTab = function (role) {
			$scope.selectedTab = role.description;
			if (role.description == "1st Option") {
				$scope.FirstOpction = 1
				$scope.SecondOpction = 0
			} else {
				$scope.FirstOpction = 0
				$scope.SecondOpction = 1
			}
		};

		$scope.filter1 = {
			'category': "1st Option"
		}
		$scope.filter2 = {
			'category': "2nd Option"
		}
		$scope.sortList = "entity.fullName"
		$scope.selectTab(angular.copy($scope.roles[0]));
	});
