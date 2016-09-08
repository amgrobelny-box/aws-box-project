angular.module('sample.login', [
  'auth0'
])
  .controller('LoginCtrl', function HomeController($scope, auth, $location, store, usSpinnerService) {
    $scope.spinning = false;
    function getOptionsForRole(token) {
      return {
        "id_token": token
      }
    }

    function getSecureApiClientForBox() {
      var awstoken = store.get('awstoken');

      return apigBoxClientFactory.newClient({
        accessKey: awstoken.AccessKeyId,
        secretKey: awstoken.SecretAccessKey,
        sessionToken: awstoken.SessionToken,
        region: 'us-west-2' // Set to your region
      });
    }

    function addBoxUser(profile) {
      var apigBoxClient = getSecureApiClientForBox();
      return apigBoxClient.usersPost({}, { user_id: profile.user_id, name: profile.name });
    }

    function getBoxUserToken(profile) {
      console.log(profile);
      var auth0UserToken = store.get('token');
      console.log(auth0UserToken);
      var apigBoxClient = getSecureApiClientForBox();
      return apigBoxClient.tokenPost({}, { token: auth0UserToken });
    }

    $scope.login = function () {
      var params = {
        authParams: {
          scope: 'openid email'
        }
      };
      auth.signin(params, function (profile, token) {
        $scope.spinning = true;
        usSpinnerService.spin('spinner-1');
        store.set('profile', profile);
        store.set('token', token);

        // get delegation token from identity token. 
        var options = getOptionsForRole(token);

        auth.getToken(options)
          .then(
          function (delegation) {
            store.set('awstoken', delegation.Credentials);
            if (profile && profile.app_metadata && profile.app_metadata.boxId) {
              return getBoxUserToken(profile)
                .then(function (response) {
                  console.log(response);
                  store.set('boxUserToken', response.data);
                }).catch(function (response) {
                  console.log(response);
                  alert('Could not retrieve a token from Box...');
                });
            } else {
              return addBoxUser(profile)
                .then(function (response) {
                  console.log(response);
                  return getBoxUserToken(response.data);
                })
                .then(function (response) {
                  store.set('boxUserToken', response.data);
                })
                .catch(function (response) {
                  alert('Could not retrieve a token from Box...');
                });
            }
          })
          .then(function () {
            $location.path("/");
          })
          .catch(function (err) {
            console.log('failed to acquire delegation token', err);
          })
          .finally(function() {
            $scope.spinning = false;
            usSpinnerService.stop('spinner-1');
          });
      }, function (error) {
        console.log("There was an error logging in", error);
        $scope.spinning = false;
        usSpinnerService.stop('spinner-1');
      });
    }
  });
