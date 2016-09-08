angular.module('sample.home', ['auth0', 'ui.bootstrap', 'ngFileUpload'])
  .controller('HomeCtrl', ['$scope', 'auth', '$http', '$location', 'store', 'previewModalService', 'Upload', '$timeout', '$q', '$sce', function HomeController($scope, auth, $http, $location, store, previewModalService, Upload, $timeout, $q, $sce) {
    $scope.items = [];
    $scope.files = [];
    $scope.folders = [];
    $scope.profile = store.get('profile');
    $scope.adding = false;

    $scope.eleteFolder

    $scope.uploadFiles = function (files, errFiles) {
      getBoxBearerToken()
        .then(function (boxBearerToken) {
          $scope.uploadedFiles = files;
          $scope.errFiles = errFiles;
          angular.forEach(files, function (file) {
            file.upload = Upload.upload({
              url: 'https://upload.box.com/api/2.0/files/content',
              data: { file: file, parent_id: '0' },
              headers: { 'Authorization': 'Bearer ' + boxBearerToken.access_token }
            });
            file.upload.then(function (response) {
              $timeout(function () {
                file.result = response.data;
                if (response && response.data && response.data.total_count && response.data.total_count === 1) {
                  $scope.files.push(response.data.entries[0]);
                  var fileIndex = $scope.uploadedFiles.findIndex(function (el, index, arr) {
                    return el.name = file.name;
                  });
                  $timeout(function () {
                    $scope.uploadedFiles.splice(fileIndex, 1);
                  }, 2000)
                }
              });
            }, function (response) {
              if (response.status > 0)
                $scope.errorMsg = response.status + ': ' + response.data.message;
            }, function (evt) {
              file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });
          });
        });
    }

    function showError(response) {
      if (response instanceof Error) {
        console.log('Error', response.message);
      } else {
        console.log(response.data);
        console.log(response.status);
        console.log(response.headers);
        console.log(response.config);
      }
    }

    function getBearerToken() {
      var token = store.get('token');
      return "bearer " + token;
    }

    function getBoxBearerToken() {
      var deferred = $q.defer();
      var boxToken = store.get('boxUserToken');
      var profile = store.get('profile');
      if (boxToken && boxToken.expires_at > Date.now()) {
        deferred.resolve(boxToken);
      } else {
        getBoxUserToken(profile)
          .then(function (response) {
            console.log(response);
            store.set('boxUserToken', response.data);
            deferred.resolve(boxToken);
          }).catch(function (response) {
            console.log(response);
            $location.path('/login').replace();
            $scope.$apply();
          });
      }
      return deferred.promise;
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

    function getBoxUserToken(profile) {
      var auth0UserToken = store.get('token');
      var apigBoxClient = getSecureApiClientForBox();
      return apigBoxClient.tokenPost({}, { token: auth0UserToken });
    }

    function getItems() {
      getSecureBoxApiClient()
        .then(function (boxClient) {
          return boxClient.folders.get({ id: '0', fields: "item_collection,name" });
        })
        .then(function (rootFolder) {
          rootFolder = JSON.parse(rootFolder);
          console.log(rootFolder);
          $scope.items = rootFolder.item_collection.entries;
          separateItemsAndRetrieveExtension(rootFolder.item_collection.entries);
        })
        .catch(function (response) {
          alert('root folder get failed');
          showError(response);
        });
    }

    function separateItemsAndRetrieveExtension(items) {
      angular.forEach(items, function (item) {
        if (item.type === "file") {
          var splitItem = item.name.split('.');
          var fileExtension = (splitItem.length > 1) ? splitItem[1] : null;
          if (fileExtension !== null) {
            item.fileExtension = fileExtension;
          }
          $scope.files.push(item);
        } else if (item.type === "folder") {
          $scope.folders.push(item);
        }
      });
      console.log($scope.files);
    }

    function previewFile(fileId) {
      getSecureBoxApiClient()
        .then(function (boxClient) {
          return boxClient.files.getEmbedLink({ fileId: fileId })
        })
        .then(function (response) {
          response = JSON.parse(response);
          var previewLink = response.expiring_embed_link.url;
          console.log(previewLink);
          openModal(previewLink);
        }).catch(function (response) {
          alert('preview file failed');
          showError(response);
        });
    }

    function openModal(previewLink) {
      $scope.animationsEnabled = true;

      var modalOptions = {
        previewLink: $sce.trustAsResourceUrl(previewLink)
      };

      console.log(previewLink);
      previewModalService.showModal({}, modalOptions)
        .then(function (result) {
          console.log(result);
        })
        .catch(function (err) {
          console.log(err);
        })
    }

    function getSecureBoxApiClient() {
      return getBoxBearerToken()
        .then(function (boxToken) {
          var box = new BoxSdk();
          return new box.BasicBoxClient({ accessToken: boxToken.access_token });
        });
    }

    $scope.previewFile = function (fileId) {
      previewFile(fileId);
    }

    $scope.logout = function () {
      auth.signout();
      store.remove('profile');
      store.remove('token');
      store.remove('boxUserToken');
      $location.path('/login');
    }

    getItems();

  }]);
