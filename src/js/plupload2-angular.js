(function() {

  'use strict';

  angular
    .module('plupload2-angular', [])

    .provider('plUploadService', function() {

      var config = {};
      var provider = this;

      provider.setConfig = function(key, val) {
        config[key] = val;
      };

      provider.getConfig = function(key) {
        return config[key];
      };

      provider.$get = [function() {

        return {
          getConfig: provider.getConfig,
          setConfig: provider.setConfig
        }

      }];


    })
    .directive('plUpload', plUpload);

  plUpload.$inject = ['$timeout', 'plUploadService'];

  function plUpload($timeout, plUploadService) {
    var directive = {
      restrict: 'A',
      scope: {
        plInstance: '=?',
        plMultiParamsModel: '=?',
        plAreAllCompleted: '=?',
        plFilesModel: '=?',
        plProgressModel: '=?',
        plOnFilesAdded: '&?',
        plOnFileUploaded: '&?',
        plOnFileError: '&?',
        plOnStateChanged: '&?'
      },
      link: plUploadLink
    };

    return directive;

    function plUploadLink(scope, iElement, iAttrs) {
      var options;
      var uploader;

      /********
       *CONFIG*
       ********/

      options = {
        runtimes: getConfigOption('plRuntimes') || "html5,silverlight,flash,html4",
        browse_button: iAttrs.id,
        multi_selection: true,
        url: getConfigOption('plUploadPath'),
        flash_swf_url: getConfigOption('plFlashPath'),
        silverlight_xap_url: getConfigOption('plSilverlightPath'),
        file_data_name: getConfigOption('plFileDataName')
      };

      if(plUploadService.getConfig('headers')) {
        if(!(plUploadService.getConfig('mustIncludeCookies') &&
          isSilverlightInstalled()
          && !isFlashBeforeSilverlight(options))) {
          // If headers are used, cookies are not sent in silverlight runtime.
          options.headers = plUploadService.getConfig('headers');
        }
      }

      if(iAttrs.plContainer) {
        options.container = iAttrs.plContainer
      }

      if(scope.plMultiParamsModel) {
        options.multipart_params = scope.plMultiParamsModel;
      }

      if(plUploadService.getConfig('headers')) {
        options.multipart_params = options.multipart_params || {};
        angular.forEach(plUploadService.getConfig('headers'), function(value, key) {
          options.multipart_params[key] = value;
        });
      }

      if(iAttrs.plMaxFileSize) {
        options.max_file_size = iAttrs.plMaxFileSize;
      }

      if(iAttrs.plChunkSize) {
        options.chunk_size = iAttrs.plChunkSize;
        options.max_retries = parseInt(iAttrs.plMaxRetries, 10) || 0;
      }

      /******
       *INIT*
       ******/

      setNoops([
        'plOnFilesAdded',
        'plOnFileUploaded',
        'plOnFileError',
        'plOnStateChanged'
      ]);

      uploader = new plupload.Uploader(options);

      if(options.headers) {
        uploader.settings.headers = plUploadService.getConfig('headers');
      }

      if(iAttrs.plInstance) {
        scope.plInstance = uploader;
      }

      /****************
       *EVENT BINDINGS*
       ****************/

      uploader.bind('Error', onError);
      uploader.bind('FilesAdded', onFilesAdded);
      uploader.bind('FileUploaded', onFileUploaded);
      uploader.bind('UploadProgress', onUploadProgress);
      uploader.bind('StateChanged', onStateChanged);


      /**
      * @desc Handles 'Error' event
      * @params {Object} up
      * @params {Object} err
      */
      function onError(up, err) {
        scope.plOnFileError({error: err});
        up.refresh();
      }

      /**
      * @desc Handles 'FilesAdded' event
      * @param {Object} up
      * @param {Array} files
      */
      function onFilesAdded(up, files) {
        $timeout(function() {
          if(iAttrs.plAreAllCompleted) {
            scope.plAreAllCompleted = false;
          }
          if(iAttrs.plFilesModel) {
            angular.forEach(files, function(file, key) {
              scope.plFilesModel.push(file);

              if(iAttrs.plProgressModel) {
                scope.plProgressModel = calculateProgress();
              }

            })
          }

          scope.plOnFilesAdded({uploader: up, files: files});
        });
      }

      function onUploadProgress(up, file) {

        if(!iAttrs.plProgressModel) {
          return;
        }

        if(iAttrs.plFilesModel) {
          scope.$apply(function() {
            scope.plProgressModel = calculateProgress();
          });
        }

      }

      /**
      * @desc Handles FileUploaded event
      * @param up
      * @param file
      * @param res
      */
      function onFileUploaded(up, file, res) {

        if(!scope.plOnFileUploaded) {
          return;
        }

        if(iAttrs.plFilesModel) {
          scope.$apply(handleWhenFilesModelSet);
        }

        /**
         * @desc handles actions when files model is set
         */
        function handleWhenFilesModelSet() {
          angular.forEach(scope.plFilesModel, function(file, key) {
            if(file.percent === 100) {
              scope.plOnFileUploaded({$response: res});
            }
          });
        }

      }

      /**
       * @desc handles callbacks and actions when uploader state changes
       *
       * @param up
       */
      function onStateChanged(up) {
        $timeout(function() {
          scope.plAreAllCompleted = up.state === 1;
          calculateProgress();
          scope.plOnStateChanged();
        });
      }

      /*********
       *HELPERS*
       *********/

      function isFlashBeforeSilverlight(options) {
        var flashIndex = options.runtimes.indexOf('flash');
        var silverlightIndex = options.runtimes.indexOf('silverlight');

        if(flashIndex === -1) {
          return false;
        }
        if(silverlightIndex === -1) {
          return true;
        }

        return flashIndex < silverlightIndex;
      }

      /**
       * Taken from: http://blogs.msdn.com/b/piotrp/archive/2008/05/07/determining-if-silverlight-is-installed-using-javascript.aspx
       * @returns {boolean}
       */
      function isSilverlightInstalled()
      {
        var isSilverlightInstalled = false;

        try
        {
          //check on IE
          try
          {
            var slControl = new ActiveXObject('AgControl.AgControl');
            isSilverlightInstalled = true;
          }
          catch (e)
          {
            //either not installed or not IE. Check Firefox
            if ( navigator.plugins["Silverlight Plug-In"] )
            {
              isSilverlightInstalled = true;
            }
          }
        }
        catch (e)
        {
          //we don't want to leak exceptions. However, you may want
          //to add exception tracking code here.
        }
        return isSilverlightInstalled;
      }

      /**
       * @desc sets noops for undefined callbacks
       * @param keys
       */
      function setNoops(keys) {
        var i;
        var key;

        for(i = 0; i < keys.length; i++) {
          key = keys[i];
          if(!scope.hasOwnProperty(key)) {
            scope[key] = angular.noop;
          }
        }
      }

      /**
       * @desc gets config option
       * @param key
       * @returns {*}
       */
      function getConfigOption(key) {
        return iAttrs[key] || plUploadService.getConfig(key);
      }

      /**
       * @desc calculates progress
       * @returns {number}
       */
      function calculateProgress() {
        var total = 0;
        var loaded = 0;

        angular.forEach(uploader.files, function(file) {
          total += 100;
          loaded += file.percent;
        });

        return loaded / total * 100;
      }

    }
  }
})();
