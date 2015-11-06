var SantaFunke = angular.module('SantaFunke', []);
//ng-route - publishes to the address bar

/* START Header Controller
Lets have a header controller so that we can change the styling based on who is logged in
We can, later, use current_user.type to define which css we link! */
SantaFunke.controller('HeaderController', ['$http', function($http){
  var controller = this;
  $http.get('/session').then(function(data){
    // the get /session should return a data object that contains a current_user property
    controller.current_user = data.current_user;
  }, function(error){
    //what should we do with the errors?
  });

}]);
/* End HeaderController */





/* START User Controller
We need to create a flexible controller for Elves and Children
They're both users, so they share certain data points, but they have different functionality? */
SantaFunke.controller('UserController', ['$http', function($http){
  var controller = this;
  $http.get('/user').then(function(data){
    // the get /user should return a data object containing the user's information
  }, function(error){
    //what should we do with the errors?
  });

}]);

/* END User Controller */






/* START Toy Controller
  create a new toy??
*/
SantaFunke.controller('ToyController', ['$http', function($http){
  var controller = this;
  var userType = headerCtrl.current_user.type;
  var authenticity_token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  this.get_all_toys = function(){
    //hits toys#index which should return all the toys
    $http.get('/toys').then(function(data){
      // the get /toy should return a data object containing all the toys
      controller.all_toys = data;
    }, function(error){
      //what should we do with the errors?
    });
  };
  /* Call the function on instantiation */
  this.get_all_toys();

   //hits presents#index which should return the toys that belong to the current user THROUGH presents
  this.get_presents = function(){
    $http.get('/presents').then(function(data){
      controller.my_toys = data;
    }, function(error){
      //do what
    });
  };
  /* Call the function on instantiation */
  this.get_presents();

  this.createToy = function(){
    // temporarily add to the list until the AJAX query completes
    controller.my_toys.push({
      name: this.newToyName + "...loading",
      value: this.newToyValue + "...loading",
      description: this.newToyDescription + "...loading"
    });

    //make a post to /toys
    $http.post('/toys', {
      //include authenticity_token
      authenticity_token: authenticity_token,
      //values from form
      toy: {
        name: this.newToyName,
        value: this.newToyValue,
        description: this.newToyDescription
      }
    }).then(function(data){
      controller.my_toys.pop();
      controller.my_toys.push(data.toy); //what does this look like?
      controller.get_presents(); //wtFrig?
    },function(error){
      // do what
    });
  };


}]);
/* End Toy Controller */







/* START Judgement Controller
*/

/* End Judgement Controller */








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