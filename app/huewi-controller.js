(function () {
"use strict";

app

.controller("huewiController", ["$rootScope", "$scope", "hueConnector", "Menu", function($rootScope, $scope, hueConnector, Menu) {
  $scope.MyHue = hueConnector.MyHue(); // For conveinient usage of MyHue in HTML within this controllers $scope
  window.hue = hueConnector.MyHue(); // For Debugging TESTCODE
  $scope.UpdateScheduled = false;

  $scope.stringify = function(value) {
    return JSON.stringify(value);
  };

  $scope.$watch(function() {
    return hueConnector.Status();
    }, function WatchStatus(NewStatus, OldStatus) {
      if (NewStatus!=="Connected")
        $("#HueStatusbar").slideDown(350);
      else setTimeout(function() { $("#HueStatusbar").slideUp(750); }, 1);
    }
  );

  $scope.$watch(function() {
    return Menu.GetItem();
    }, function WatchStatus(NewItem, OldItem) {
      if (NewItem === "") // No Overlay selected
        $("body").css("overflow", "initial"); // Enable scrolling of the <Body>
      else $("body").css("overflow", "hidden"); // Disable scrolling of the <Body>
    }
  );

  $scope.Status = function() {
    return hueConnector.Status();
  };

  $scope.Connect = function(NewBridgeAddress) {
    return hueConnector.Connect(NewBridgeAddress);
  };

  $scope.Discover = function() {
    return hueConnector.Discover();
  };

  $scope.Scan = function() {
    return hueConnector.Scan();
  };

  $scope.SetGroupBrightness = function(GroupId) {
    if ($scope.UpdateScheduled === false)
    {
      $scope.UpdateScheduled = true;
      hueConnector.MyHue().GroupSetBrightness(GroupId, hueConnector.MyHue().Groups[GroupId].action.bri, 2).then(function(value) {
        setTimeout(function(){$scope.UpdateScheduled = false;},200);
      }, function(reason) {
        setTimeout(function(){$scope.UpdateScheduled = false;},200);
      });
    }
  };

  $scope.SetLightBrightness = function(LightId) {
    if ($scope.UpdateScheduled === false)
    {
      $scope.UpdateScheduled = true;
      hueConnector.MyHue().LightSetBrightness(LightId , hueConnector.MyHue().Lights[LightId].state.bri, 2).then(function(value) {
        setTimeout(function(){$scope.UpdateScheduled = false;},200);
      }, function(reason) {
        setTimeout(function(){$scope.UpdateScheduled = false;},200);
      });
    }
  };

  $scope.SetMenuItem = function(NewItem, NewId) {
    return Menu.SetItem(NewItem, NewId);
  };

  $scope.GetMenuItem = function() {
    return Menu.GetItem();
  };

  $scope.SetMenuId = function(NewId) {
    return Menu.SetId(NewId);
  };

  $scope.GetMenuId = function() {
    return Menu.GetId();
  };

  document.addEventListener("backbutton", function(event) { // Cordova/PhoneGap only.
    if (angular.element("#HueStatus").scope().GetMenuItem() !== "") {
      angular.element("#HueStatus").scope().SetMenuItem("Escape");
    }
  });

  document.onkeyup = function(event) {
    if (angular.element("#HueStatus").scope().GetMenuItem() !== "") {
      // Escape will close open Overlays.
      if ((event.keyCode === 27)) { // Escape
        angular.element("#HueStatus").scope().SetMenuItem("Escape");
        setTimeout(function() { $rootScope.$apply(); }, 1); // Force UI update
      }
    }
  };

}]);


})();