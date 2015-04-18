(function() {

  var app = angular.module('huewi', ['ngAnimate']);
  var MyHue = new huepi();
  MyHue.Username = '085efe879ee3ed83c04efc28a0da03d3';

  //delete localStorage.MyHueBridgeIP; // Force PortalDiscoverLocalBridges

  app.controller('HueStatusController', function($scope) {
    var self = this; // Calling Async Functions looses this... Fix: Store this in self for later reference
    this.MyHue = MyHue; // to be called via angular.element(document.getElementById('HueStatus')).controller().MyHue. in HTML
    this.BridgeIP = '';
    this.BridgeName = '';
    this.Status = '';

    this.ConnectToHueBridge = function() {
      if (!localStorage.MyHueBridgeIP) { // No Cached BridgeIP?
        self.Status = 'Trying to Discover Bridge via Portal';
        $scope.$apply();
        MyHue.PortalDiscoverLocalBridges().then(function GetBridgeConfig() {
          MyHue.BridgeGetData().then(function EnsureWhitelisting() {
            self.BridgeIP = MyHue.BridgeIP;
            if (!MyHue.BridgeUsernameWhitelisted) {
              self.Status = 'Please press connect button on Bridge';
              $scope.$apply();
              MyHue.BridgeCreateUser().then(function ReReadBridgeConfiguration() {
                return;
              }, function UnableToCreateUseronBridge() {
                self.Status = 'Unable to Create User on Bridge';
                $scope.$apply();
                return;
              });
            } else {
              localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
              self.BridgeName = MyHue.BridgeName;
              self.Status = 'Connected';
              $scope.$apply();
            }
          }, function UnableToRetreiveBridgeConfiguration() {
            self.Status = 'Unable to Retreive Bridge Configuration';
            $scope.$apply();
            return;
          });
        }, function UnableToDiscoverLocalBridgesViaPortal() {
          self.Status = 'Unable to find Local Bridge via Portal';
          $scope.$apply();
          return;
        });
      } else {
        MyHue.BridgeIP = localStorage.MyHueBridgeIP;
        self.BridgeIP = MyHue.BridgeIP;
        MyHue.BridgeGetData().then(function CheckWhitelisting() {
          if (MyHue.BridgeUsernameWhitelisted) {
            self.BridgeName = MyHue.BridgeName;
            self.Status = 'Connected';
            $scope.$apply();
          } else {
            delete localStorage.MyHueBridgeIP;
            self.Status = 'Not Whitelisted anymore';
            $scope.$apply();
            return;
          }
        }, function ErrorGettingCachedBridgeData() {
          delete localStorage.MyHueBridgeIP;
          self.Status = 'Not found anymore';
          $scope.$apply();
          return;
        });
      }
    }

    this.Update = function() {
      var Result = MyHue.BridgeGetData();
      return Result;
    }
  })

  function ToHexString(In) {
    var Result = Math.floor(In).toString(16);
    return Result.length == 1 ? "0" + Result : Result;
  }

  app.directive("huewiGroup", function() {
    return {
      restrict: 'E',
      templateUrl: "huewi-group.html"
    };
  });

  app.controller('GroupsController', ['$scope', function($scope) {
    this.Groups = [{'name': 'All available lights', HTMLColor: "#ffcc88"}, {'name': 'Group1'}, {'name': 'Group2'}, {'name': 'Group3'}];

    this.Update = function() {
      this.Groups = _.toArray(MyHue.Groups);
      this.Groups.unshift({'name': 'All available lights'});

      _.each(this.Groups, function(Group) {
        var RGB;
        if (Group.action) { // Group 0 (All available lights) doesn't have properties
          if (Group.action.colormode === 'hs') {
            RGB = huepi.HelperHueAngSatBritoRGB(Group.action.hue * 360 / 65535, Group.action.sat / 255, Group.action.bri / 255);
            var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
            RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, Group.modelid, Group.action.bri / 255);
          } else if (Group.action.colormode === 'xy') {
            RGB = huepi.HelperXYtoRGBforModel(Group.action.xy[0], Group.action.xy[1], "LCT001", Group.action.bri / 255);
          } else if (Group.action.colormode === 'ct') {
            RGB = huepi.HelperColortemperaturetoRGB(Math.round(1000000 / Group.action.ct));
            var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
            RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, Group.modelid, Group.action.bri / 255);
          }
          Group.HTMLColor = "#" + ToHexString(RGB.Red * 255) + ToHexString(RGB.Green * 255) + ToHexString(RGB.Blue * 255);
        } else Group.HTMLColor = "#ffcc88";
      })
      $scope.$apply();
    }
  }]);

  app.directive("huewiLight", function() {
    return {
      restrict: 'E',
      templateUrl: "huewi-light.html"
    };
  });

  app.controller('LightsController', ['$scope', function($scope) {
    this.Lights = [{'name': 'Light1'}, {'name': 'Light2'}, {'name': 'Light3'}];

    this.Update = function() {
      this.Lights = _.toArray(MyHue.Lights);
      _.each(this.Lights, function(Light) {
        var RGB;
        if (Light.state.colormode === 'hs') {
          RGB = huepi.HelperHueAngSatBritoRGB(Light.state.hue * 360 / 65535, Light.state.sat / 255, Light.state.bri / 255);
          var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
          RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, Light.modelid, Light.state.bri / 255);
        } else if (Light.state.colormode === 'xy') {
          RGB = huepi.HelperXYtoRGBforModel(Light.state.xy[0], Light.state.xy[1], Light.modelid, Light.state.bri / 255);
        } else if (Light.state.colormode === 'ct') {
          RGB = huepi.HelperColortemperaturetoRGB(Math.round(1000000 / Light.state.ct));
          var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
          RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, Light.modelid, Light.state.bri / 255);
        }
        Light.HTMLColor = "#" + ToHexString(RGB.Red * 255) + ToHexString(RGB.Green * 255) + ToHexString(RGB.Blue * 255);
      })
      $scope.$apply();
    }
  }]);

  app.controller('MenuController', ['$scope', function($scope) {
    $scope.MenuItem ='';
    
    $scope.SetMenuItem = function(NewItem, NewIndex) {
      //console.log('Menu->SetMenuItem '+NewItem+', '+NewIndex);
      $scope.MenuItem = NewItem;
      if ($scope.Item === '') // No Overlay selected
        $('body').css('overflow', 'scroll'); // Enable scrolling of the <Body>
      else
        $('body').css('overflow', 'hidden'); // Disable scrolling of the <Body>

      if (NewItem === 'Group')
        angular.element(document.getElementById('Group')).scope().Update(NewIndex);
      else if (NewItem === 'Light')
        angular.element(document.getElementById('Light')).scope().Update(NewIndex);
    }
  }]);

  app.controller('GroupController', ['$scope', function($scope) {
    $scope.Index = 0; // Zerobased Index, Group 0 is All
    $scope._Name = '';
    $scope.OrgName = $scope._Name;

    $scope.Update = function(NewGroupNr) {
      var GroupArray = _.toArray(MyHue.Groups);
      GroupArray.unshift({'name': 'All available lights'}); // Group 0 is All
      $scope.Index = NewGroupNr;
      //console.log('Group->Update '+$scope.Index);
      if ($scope.Index < GroupArray.length)
        $scope.OrgName = $scope._Name = GroupArray[$scope.Index].name;
      else $scope._Name = "Group" + $scope.Index;
    }

    $scope.Name = function(NewName) { // Getter/Setter function
      if (angular.isDefined(NewName)) { // Setter
        //console.log('Group.Name.SETter');
        return $scope._Name = NewName;
      } else { // Getter
        //console.log('Group.Name.geTTer');
        return $scope._Name;
      }
    }
  }]);
  
  app.controller('LightController', ['$scope', function($scope) {
    $scope.Index = 1; // Onebased Index, Light 0 doesn't exist
    $scope._Name = '';
    $scope.OrgName = $scope._Name;
    
    $scope.Update = function(NewLightNr) {
      var LightArray = _.toArray(MyHue.Lights);
      LightArray.unshift({'name': 'Onebased index'}); // Light 0 doesn't exist
      $scope.Index = NewLightNr;
      //console.log('Light->Update '+$scope.Index);
      if ($scope.Index < LightArray.length)
        $scope.OrgName = $scope._Name = LightArray[$scope.Index].name;
      else $scope._Name = "Light" + $scope.Index;
    }

    $scope.Name = function(NewName) { // Getter/Setter function
      if (angular.isDefined(NewName)) { // Setter
        //console.log('Light.Name.SETter');
        return $scope._Name = NewName;
      } else { // Getter
        //console.log('Light.Name.geTTer');
        return $scope._Name;
      }
    }
  }]);

  app.controller('SchedulesController', ['$scope', function($scope) {
  }]);
  app.controller('ScenesController', ['$scope', function($scope) {
  }]);
  app.controller('SensorsController', ['$scope', function($scope) {
  }]);
  app.controller('RulesController', ['$scope', function($scope) {
  }]);
  app.controller('BridgeController', ['$scope', function($scope) {
  }]);


})();
