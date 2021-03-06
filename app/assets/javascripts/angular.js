var SantaFunke = angular.module('SantaFunke', ['ngMaterial']);
//ng-route - publishes to the address bar

var currentUserId;
// var userType;
var currentUserName;
var currentUserAddress;
var kidzAddresses = [];
var kidzNamez = []; // have to store these, too, for popups.

// this will allow us to execute functions after the Angular template has been completely loaded.. got it from: http://gsferreira.com/archive/2015/03/angularjs-after-render-directive/
SantaFunke.directive('afterRender', ['$timeout', function ($timeout) {
    var def = {
        restrict: 'A',
        terminal: true,
        transclude: false,
        link: function (scope, element, attrs) {
            $timeout(scope.$eval(attrs.afterRender), 0);  //Calling a scoped method
        }
    };
    return def;
}]);

/* START Session Controller
Lets have a session controller so that we can change the styling based on who is logged in
We can, later, use current_user.type to define which css we link! */
SantaFunke.controller('SessionController', ['$http', function($http){
  var controller = this;
  $http.get('/session').then(function(data){
    // the get /session should return a data object that contains a current_user property
    controller.current_user = data.data.current_user;
    currentUserId = data.data.current_user.id;
    currentUserName = data.data.current_user.name;
    currentUserAddress = [data.data.current_user.address]; // setting this equal to an array so that we can use one codeAddress function later to set the markers on the maps
    console.log("the current user is: ", controller.current_user);
  }, function(error){
    console.log("you have an error: ", error);
    //what should we do with the errors?
  });
}]);
/* End SessionController */


/* START Login controller */
SantaFunke.controller('UserController', ['$http', '$scope', function($http, $scope) {
    var controller = this;

    controller.states = ('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS ' +
    'MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI ' +
    'WY').split(' ').map(function(state) {
        return {abbrev: state};
    });

    controller.login = function(){
      $http.post('/session', {
        user: {
          email: controller.loginEmail,
          password: controller.loginPassword
        }
      }).then(function(data) {
        console.log("data is: ", data);
        window.location = "/application/angular?";
      },function(error) {
        console.log("ya fucked up: ", error);
      });
      //post to session

    };

    controller.createUser = function(){
      controller.fullAddress = controller.address + " " + controller.city + " " + controller.state + " " + controller.postalCode;

      // some addresses are being saved as "undefined undefined undefined undefined" in db if the fields in the signup form are left blank. going to set it to something else, here, if that is the case--otherwise the maps will break.
      if (controller.fullAddress === "undefined undefined undefined undefined") {
        controller.fullAddress = "101 St Nicholas Dr, North Pole, AK 99705";
      }

      $http.post('/users', {
        authenticity_token: controller.authenticity_token,
        user: {
          email: controller.email.toLowerCase(),
          password: controller.password,
          name: controller.name,
          age: controller.age,
          address: controller.fullAddress,
          type: controller.type,
        }
      }).then(function(data){
        $http.post('/session', {
          user: {
            email: controller.email,
            password: controller.password
          }
        }).then(function(data) {
          console.log("data is: ", data);
          window.location = "/application/angular?";
        },function(error) {
          console.log("ya fucked up: ", error);
        });
        // controller.login();  STRETCH GOAL: get logged in upon sign up
      },function(error){

      });

    };

}]);
/* END Login Controller */


/* START Children Controller
This one's just for the kids */

SantaFunke.controller('ChildrenController', ['$http', function($http){

  var controller = this;
  var authenticity_token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  $http.get('/users/children').then(function(data){
    // the get /users should return a data object containing all of the children
    controller.children = data.data.children;
    for (var i = 0; i < controller.children.length; i++) {
      kidzAddresses.push(controller.children[i].address);
      kidzNamez.push(controller.children[i].name);
    }
    console.log("inside of ChildrenController callback, kidzAddresses is now: ", kidzAddresses);
    console.log("kidzNamez is: ", kidzNamez);
  }, function(error){
    //what should we do with the errors?
  });

  this.refresh = function(){
    $http.get('/users/children').then(function(data){
      // the get /users should return a data object containing all of the children
      controller.children = data.data.children;
      // console.log(data);
    }, function(error){
      //what should we do with the errors?
    });
  };



}]);

/* END Child Controller */


/* START Maps Controller */

SantaFunke.controller('MapController', ['$scope', '$http', function($scope, $http){

  var controller = this;
  var authenticity_token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  var geocoder;
  var map;

  this.initializeMapInChildView = function() {
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(90, 0); // the north pole, obviously.
    var mapOptions = {
      zoom: 15,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    controller.codeAddress(currentUserAddress);
  };

  this.initializeMapAndMarkersInElfView = function() {
    // console.log("testing in initializeMapsInElfView, $scope.$parent is:", $scope.$parent);
    var children = $scope.$parent.naughtyNiceCtrl.children;
    // console.log("in initializeMapAndMarkersInElfView, children is: ", children);
    // console.log("and $scope.$parent.controller is: ", $scope.$parent.controller);
    // var kidzAddresses = [];
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(90, 0);
    var mapOptions = {
      zoom: 4,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    // for (var i = 0; i < children.length; i++) {
    //   kidzAddresses.push(children[i].address);
    // }

    controller.codeAddress(kidzAddresses, kidzNamez);
  };

  this.codeAddress = function(addresses, names) {
    // var name;
    // var index;
    for (var j = 0; j < addresses.length; j++) {
      // var index = j;
      // console.log("index: ", index);
      // var name = names[index];
      // console.log("name: ", name);
      geocoder.geocode( { 'address': addresses[j]}, function(results, status) {
        // name = names[j];
        // console.log("name inside of geocode function: ", name);
        if (status == google.maps.GeocoderStatus.OK) {
          map.setCenter(results[0].geometry.location);
          // var name = names[j];
          // Can't get the dang name to work, going to put in a goofy message instead..
          console.log("about to add popups..");
          var popup = new google.maps.InfoWindow({
            content: "A child lives here! But, for security reasons, Santa obviously can't tell you who.."
          });
          var marker = new google.maps.Marker({
              map: map,
              position: results[0].geometry.location,
              animation: google.maps.Animation.DROP,
              icon: "http://www.dollywood.com/~/media/ParkContent/DW_COM/DW/Festivals/Icons/christmas_logo.ashx"
              // icon: "http://images3.wikia.nocookie.net/__cb20110806110719/pvzcc/images/a/a7/Emoticon_epicface.png"
              //also an option:
              // icon: "http://forums.childrenwithdiabetes.com/images/smilies/catchu.gif"
          });
          marker.addListener('click', function() {
            popup.open(map, marker);
          });
        } else {
          alert("Santa could not find you for the following reason: " + status);
        }
      });
    }
  };

}]);

/* END Maps Controller */




/* START Toy Controller
  create a new toy??
*/
SantaFunke.controller('ToyController', ['$scope', '$http', function($scope, $http){

  var controller = this;
  var authenticity_token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  this.get_all_toys = function(){
    //hits toys#index which should return all the toys
    $http.get('/toys').then(function(data){
      // the get /toy should return a data object containing all the toys
      // console.log("These are all the toys");
      // console.log(data);
      // console.log("End all toys");
      controller.all_toys = data.data.toys;
      console.log("all toys: ", data.data.toys);
    }, function(error){
      //what should we do with the errors?
    });
  };
  /* Call the function on instantiation */
  // console.log("calling get_all_toys: ");
  this.get_all_toys();

   //hits presents#index which should return the toys that belong to the current user THROUGH presents
  this.get_my_presents = function(){
    $http.get('/presents/mine').then(function(data){
      controller.my_toys = data.data.presents;
      // data.data.presents[index].child / toy / elf
    }, function(error){
      //do what
    });
  };
  /* Call the function on instantiation */
  this.get_my_presents();

  this.createToy = function(){
    // temporarily add to the list until the AJAX query completes
    // do we even want to do this? Kind of flashes before the data saves to the db and the name of the toy is permanently added to the dropdown list..
    console.log("testing in the createToy function!");
    controller.all_toys.push({
      name: controller.newToyName + "...loading",
      value: controller.newToyValue + "...loading",
      description: controller.newToyDescription + "...loading"
    });

    //make a post to /toys
    $http.post('/toys', {
      //include authenticity_token
      authenticity_token: authenticity_token,
      //values from form
      toy: {
        name: controller.newToyName,
        value: controller.newToyValue,
        description: controller.newToyDescription
      }
    }).then(function(data){
      console.log("the new toy: ", data);
      controller.all_toys.pop();
      controller.all_toys.push(data.data); //what does this look like?
      // controller.get_presents(); //wtFrig?
      controller.newToyName = "";
      controller.newToyValue = "";
      controller.newToyDescription = "";
    },function(error){
      // do what
    });
  };

// working as of 945pm on Monday 11/9
  this.createPresent = function(){
    //make a post to /presents
    $http.post('/presents', {
      //include authenticity_token
      authenticity_token: authenticity_token,
      //values from form
      present: {
        // must add display values
        //How to get the right child id? By grabbing it from within the SessionController, and storing it as a global variable within this js file
        child_id: currentUserId,
        // elf_id: this.newToyValue, non-extant in child version, elf id is only ever set in update
        toy_id: controller.toyID //whatever we want, ties to form
      }
    }).then(function(data){
      // console.log("present is: ", present);
      controller.get_my_presents();
    },function(error){
      // do what
    });
  };

  this.deletePresent = function(present) {
    console.log(present);
    var present_id = present.id;
    var target = '/presents/' + present_id;
    $http.delete(target, {
      authenticity_token: authenticity_token,
    }).then(function(data){
      console.log("Successfully Deleted: " + present_id);
      console.log("$scope stuff: ", $scope);
      $scope.wishlistCtrl.get_my_presents();
      controller.toyID = null;
      // $scope.$parent.$parent.naughtyNiceCtrl.refresh();
      /* The magic shiiiiz :: refreshes all everything*/
    },function(error){
    });
  };


}]);
/* End Toy Controller */







/* START Judgment Controller
*/
// we'll call this function through the judgment controller
// judgement controller is our portal to display viewed children’s wishlist, edit the wishlist by attaching/removing self (elf_id), create judgements

// This exists purely for creating judgments
SantaFunke.controller('JudgmentController', ['$scope', '$http', function($scope, $http){
  var controller = this;
  var authenticity_token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  // console.log("$scope.$parent is: ", $scope.$parent);
  // console.log("current user info: ", currentUserId, currentUserName);

  this.createJudgment = function(){
    console.log("inside of createJudgment function!");
    $http.post('/judgments', {
      //include authenticity_token
      authenticity_token: authenticity_token,
      //values from form
      judgment: {
        // elf_name: controller.elfName,  // can just use currentUserName instead
        child_id: $scope.$parent.child.id,
        elf_name: currentUserName,
        elf_id: currentUserId,
        description: controller.description,
        qualifying_adverb: controller.qualifyingAdverb,
        naughty: controller.naughty
      }
    }).then(function(data){
      console.log("judgment post data is: ", data);
      // find a way to push this into the displayed array of judgments in the parent
      controller.description = "";
      controller.qualifyingAdverb = "";
      $scope.$parent.child.judgments.push(data.data);
      console.log(data.data);
    },function(error){
      // do what
    });
  };

  this.deleteJudgment = function(judgment){
    // target works, it hits the correct route
    console.log(judgment);
    var judgment_id = judgment.id;
    var target = '/judgments/' + judgment_id;
    $http.delete(target, {
      authenticity_token: authenticity_token,
    }).then(function(data){
      console.log("Successfully Deleted: " + judgment_id);
      console.log($scope.$parent.$parent);
      $scope.$parent.$parent.naughtyNiceCtrl.refresh();
      /* The magic shiiiiz :: refreshes all everything*/
    },function(error){
    });
  };

  this.editJudgment = function(judgment){
    var judgment_id = judgment.id;
    var target = '/judgments/' + judgment_id;
    $http.put(target, {
      judgment: {
        child_id: judgment.child_id,
        elf_name: judgment.elf_name,
        elf_id: judgment.elf_id,
        description: judgment.description,
        qualifying_adverb: judgment.qualifying_adverb,
        naughty: judgment.naughty
      }
    }).then(function(data){
      $scope.$parent.$parent.naughtyNiceCtrl.refresh();
    },function(error){});

    // $http.delete(target, {
    //   authenticity_token: authenticity_token,
    // }).then(function(data){
    //   console.log("Successfully Deleted: " + judgment_id);
    //   console.log($scope.$parent.$parent);
    //   $scope.$parent.$parent.naughtyNiceCtrl.refresh();
    //   $scope.judgmentCtrl.description = judgment.description;
    //   /* The magic shiiiiz :: refreshes all everything*/
    // },function(error){
    // });
  };


}]);



/* End Judgement Controller */
SantaFunke.controller('JudgmentsController', ['$scope', '$http', function($scope, $http){
  var controller = this;
  var authenticity_token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  // console.log("$scope.$parent is: ", $scope.$parent);
  // console.log("current user info: ", currentUserId, currentUserName);

  this.createJudgment = function(){
    console.log("inside of createJudgment function!");
    $http.post('/judgments', {
      //include authenticity_token
      authenticity_token: authenticity_token,
      //values from form
      judgment: {
        // elf_name: controller.elfName,  // can just use currentUserName instead
        child_id: $scope.$parent.child.id,
        elf_name: currentUserName,
        elf_id: currentUserId,
        description: controller.description,
        qualifying_adverb: controller.qualifyingAdverb,
        naughty: controller.naughty
      }
    }).then(function(data){
      console.log("judgment post data is: ", data);
      // find a way to push this into the displayed array of judgments in the parent
      controller.description = "";
      controller.qualifyingAdverb = "";
      $scope.$parent.child.judgments.push(data.data);
      console.log(data.data);
    },function(error){
      // do what
    });
  };
}]);









/* MAYBE */

/* START Presents Controller

*/
// SantaFunke.controller('PresentsController', ['$http', function($http){
//   var controller = this;
//   /* the authenticity token variable is probably incorrect seeing as we will have multiple on the same page */
//   var authenticity_token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
//   $http.get('/presents').then(function(data){
//
//   }, function(error){
//     //what should we do with the errors
//   });
// }]);

/* END Presents Controller */


/* materialize intialize select */
// put it in the body in a script tag

/* Countdown to Christmas Javascript */
// var end = new Date('12/25/2015');
//
// var _second = 1000;
// var _minute = _second * 60;
// var _hour = _minute * 60;
// var _day = _hour * 24;
// var timer;
//
//   function showRemaining() {
//       var now = new Date();
//       var distance = end - now;
//       if (distance < 0) {
//
//           clearInterval(timer);
//           document.getElementById('countdown').innerHTML = 'EXPIRED!';
//
//           return;
//       }
//       var days = Math.floor(distance / _day);
//       var hours = Math.floor((distance % _day) / _hour);
//       var minutes = Math.floor((distance % _hour) / _minute);
//       var seconds = Math.floor((distance % _minute) / _second);
//
//   document.getElementById('countdown').innerHTML = days + 'days ';
//       document.getElementById('countdown').innerHTML += hours + 'hrs ';
//       document.getElementById('countdown').innerHTML += minutes + 'mins ';
//       document.getElementById('countdown').innerHTML += seconds + 'secs';
//   }
//
//   timer = setInterval(showRemaining, 1000);
