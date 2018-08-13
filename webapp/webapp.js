angular.module('myApp',[
	'ngRoute', 
	'mobile-angular-ui', 
	'btford.socket-io'
	]).config(function($routeProvider){
		$routeProvider.when('/',{
			templateUrl: 'home.html',
			controller: 'Home'
		});
	}).factory('mySocket', function(socketFactory){
		var myIoSocket = io.connect('/webapp'); //Namespace of Webapp

		mySocket = socketFactory({
			ioSocket: myIoSocket
		});

		return mySocket;
	}).controller('Home', function($scope, mySocket){
		$scope.leds_status = [1,1]

		$scope.changeLED = function(){
			console.log('Send LED ', $scope.leds_status)

			var json = {
				"led": $scope.leds_status
			}
			mySocket.emit('LED', json)
		}

		mySocket.on('LED_STATUS', function(json){
			console.log('recv LED', json)
			$scope.leds_status = json.data;
		})

	});