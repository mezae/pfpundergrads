'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
    // Init module configuration options
    var applicationModuleName = 'promonnum';

    var applicationModuleVendorDependencies = ['ngResource', 'ui.router', 'ui.bootstrap', 'ui.utils', 'ngFileUpload', 'dndLists'];

    // Add a new vertical module
    var registerModule = function(moduleName, dependencies) {
        // Create angular module
        angular.module(moduleName, dependencies || []);

        // Add the module to the AngularJS configuration file
        angular.module(applicationModuleName).requires.push(moduleName);
    };

    return {
        applicationModuleName: applicationModuleName,
        applicationModuleVendorDependencies: applicationModuleVendorDependencies,
        registerModule: registerModule
    };
})();
'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
	}
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('articles');
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users');

'use strict';

// Configuring the Articles module
angular.module('articles').run(['Menus',
	function(Menus) {
		// Add the articles dropdown item
		Menus.addMenuItem('topbar', {
			title: 'Articles',
			state: 'articles',
			type: 'dropdown'
		});

		// Add the dropdown list item
		Menus.addSubMenuItem('topbar', 'articles', {
			title: 'List Articles',
			state: 'articles.list'
		});

		// Add the dropdown create item
		Menus.addSubMenuItem('topbar', 'articles', {
			title: 'Create Articles',
			state: 'articles.create'
		});
	}
]);

'use strict';

// Setting up route
angular.module('articles').config(['$stateProvider',
	function($stateProvider) {
		// Articles state routing
		$stateProvider.
		state('articles', {
			abstract: true,
			url: '/articles',
			template: '<ui-view/>'
		}).
		state('articles.list', {
			url: '',
			templateUrl: 'modules/articles/views/list-articles.client.view.html'
		}).
		state('articles.create', {
			url: '/create',
			templateUrl: 'modules/articles/views/create-article.client.view.html'
		}).
		state('articles.view', {
			url: '/:articleId',
			templateUrl: 'modules/articles/views/view-article.client.view.html'
		}).
		state('articles.edit', {
			url: '/:articleId/edit',
			templateUrl: 'modules/articles/views/edit-article.client.view.html'
		});
	}
]);

'use strict';

angular.module('articles').controller('ArticlesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Articles',
	function($scope, $stateParams, $location, Authentication, Articles) {
		$scope.authentication = Authentication;

		$scope.create = function() {
			var article = new Articles({
				title: this.title,
				content: this.content
			});
			article.$save(function(response) {
				$location.path('articles/' + response._id);

				$scope.title = '';
				$scope.content = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.remove = function(article) {
			if (article) {
				article.$remove();

				for (var i in $scope.articles) {
					if ($scope.articles[i] === article) {
						$scope.articles.splice(i, 1);
					}
				}
			} else {
				$scope.article.$remove(function() {
					$location.path('articles');
				});
			}
		};

		$scope.update = function() {
			var article = $scope.article;

			article.$update(function() {
				$location.path('articles/' + article._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.find = function() {
			$scope.articles = Articles.query();
		};

		$scope.findOne = function() {
			$scope.article = Articles.get({
				articleId: $stateParams.articleId
			});
		};
	}
]);
'use strict';

//Mapping service used for communicating with the maps REST endpoints
angular.module('articles').factory('Mapping', ['$resource',
    function($resource) {
        return $resource('api/maps/:mapId', {
            mapId: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    }
]);
'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        // Redirect to home view when route not found
        $urlRouterProvider.otherwise('/');

        // Home state routing
        $stateProvider.
        state('home', {
            url: '/',
            templateUrl: 'modules/core/views/home.client.view.html'
        });
    }
]);

// Allows user to download csv file
angular.module('core').config(['$compileProvider',
    function($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|blob|chrome-extension):/);
    }
]);
'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$state', 'Authentication', 'Menus',
	function($scope, $state, Authentication, Menus) {
		// Expose view variables
		$scope.$state = $state;
		$scope.authentication = Authentication;

		// Get the topbar menu
		$scope.menu = Menus.getMenu('topbar');

		// Toggle the menu items
		$scope.isCollapsed = false;
		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
	}
]);

'use strict';

angular.module('core').controller('HomeController', ['$scope', '$filter', '$modal', 'Authentication',
    function($scope, $filter, $modal, Authentication) {
        // This provides Authentication context.
        $scope.authentication = Authentication;

        $scope.theColors = ['#a095ff', '#95bfff', '#95ffd5', '#ff95bf'];

        function processImpacts(rows, headers) {
            var required_fields = ['Academic Year', 'UniqueID', 'Name', 'College', 'Status'];
            var modal = $modal.open({
                templateUrl: 'modules/core/views/mapping.client.view.html',
                controller: 'ModalInstanceCtrl',
                backdrop: 'static',
                size: 'lg',
                resolve: {
                    arrays: function() {
                        return {
                            type: 'Undergrads',
                            required_fields: required_fields,
                            headers: headers
                        };
                    }
                }
            });

            modal.result.then(function(csvheaders) {

                headers = {
                    year_col: headers.indexOf(csvheaders[0].label),
                    id_col: headers.indexOf(csvheaders[1].label),
                    name_col: headers.indexOf(csvheaders[2].label),
                    college_col: headers.indexOf(csvheaders[3].label),
                    status_col: headers.indexOf(csvheaders[4].label)
                };

                $scope.students = [];

                var i = 0;
                var count = 0;
                while (i < rows.length) {
                    var record = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    if(record.length > 1) {
                      var newStudent = {
                          id: record[headers.id_col],
                          name: record[headers.name_col],
                          college: [{
                              year: record[headers.year_col].slice(-4),
                              name: record[headers.college_col]
                          }]
                      };
                      var index = _.findIndex($scope.students, 'id', newStudent.id);
                      if (index === -1) {
                          $scope.students.push(newStudent);
                      } else {
                          $scope.students[index].college.push(newStudent.college[0]);
                          $scope.students[index].college = _.sortBy($scope.students[index].college, 'year');
                      }
                    }
                    i++;
                }

                $scope.students = _.filter($scope.students, function(student) {
                    return student.college[0].name !== student.college[student.college.length - 1].name;
                })
                console.log($scope.students.length);
                $scope.removeDropzone = true;
                downloadCSV();
            });
        }

        $scope.handleFileSelect = function(files, event, reject) {
            if (files.length) {
                if ('application/vnd.ms-excel, text/csv'.indexOf(files[0].type) === -1) {
                    $scope.alert = {
                        active: true,
                        type: 'danger',
                        msg: 'Must be a csv file!'
                    };
                } else {
                    var file = files[0];
                    var reader = new FileReader();
                    reader.onload = function(file) {
                        var content = file.target.result;
                        var rows = content.split(/[\r\n|\n]+/);
                        var headers = rows.shift();
                        headers = headers.split(',');
                        $scope.results = [];
                        processImpacts(rows, headers);
                    };
                    reader.readAsText(file);
                }
                files[0] = undefined;
            }
        };

        function downloadCSV() {
            var headers = ['id', 'name', 'college'];
            var csvString = headers.join(',') + '\r\n';
            _.forEach($scope.students, function(student) {
                _.forEach(headers, function(key) {
                    var line = student[key];
                    if (key === 'college') {
                        line = '"' + JSON.stringify(student[key]) + '"';
                    }
                    csvString += line + ',';
                });
                csvString += '\r\n';
            });

            var date = $filter('date')(new Date(), 'MM-dd');
            $scope.fileName = ('UATransfers' + '_' + date + '.csv');
            var blob = new Blob([csvString], {
                type: 'text/csv;charset=UTF-8'
            });
            $scope.url = window.URL.createObjectURL(blob);
        }

    }
])

.controller('ModalInstanceCtrl', ['$state', '$scope', '$filter', '$modalInstance', 'Authentication', 'arrays', 'Mapping',
    function($state, $scope, $filter, $modalInstance, Authentication, arrays, Mapping) {
        $scope.user = Authentication.user;
        $scope.required_fields = arrays.required_fields;
        $scope.model = {
            lists: {
                A: [],
                B: []
            }
        };

        for (var i = 0; i < arrays.headers.length; ++i) {
            var field = {
                label: arrays.headers[i]
            };
            var isValidColumn = $scope.required_fields.indexOf(field.label);
            if (isValidColumn > -1) {
                $scope.model.lists.B.push(field);
            } else {
                $scope.model.lists.A.push(field);
            }
        }

        $scope.create = function() {
            var article = new Mapping({
                type: arrays.type,
                map: $scope.model.lists.B
            });
            article.$save(function(response) {
                console.log('map saved');
            }, function(errorResponse) {
                $scope.error = errorResponse.data.message;
            });
        };

        $scope.getMapping = function() {
            if ($scope.model.lists.B.length) {
                $scope.model.lists.A = $scope.model.lists.A.concat($scope.model.lists.B);
            }
            $scope.model.lists.B = [];
            Mapping.query(function(map) {
                var index = _.findIndex(map, {
                    'type': arrays.type
                });
                var savedMap = map[index].map;
                for (var i = 0; i < $scope.required_fields.length; i++) {
                    var isValidColumn = _.findIndex($scope.model.lists.A, {
                        'label': savedMap[i].label
                    });
                    if (isValidColumn > -1) {
                        $scope.model.lists.B.push(savedMap[i]);
                        $scope.model.lists.A.splice(isValidColumn, 1);
                    }
                }
                if ($scope.model.lists.B.length < $scope.required_fields.length) {
                    console.log('some required fields appear to be missing from your csv file');
                } else {
                    $scope.isSavedMapping = true;
                }

            });
        };

        $scope.exitModal = function() {
            if ($scope.model.lists.B.length === $scope.required_fields.length) {
                $modalInstance.close($scope.model.lists.B);
            } else {
                $modalInstance.close();
            }
        };
    }
]);

'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [

    function() {
        // Define a set of default roles
        this.defaultRoles = ['*'];

        // Define the menus object
        this.menus = {};

        // A private function for rendering decision 
        var shouldRender = function(user) {
            if (user) {
                if (!!~this.roles.indexOf('*')) {
                    return true;
                } else {
                    for (var userRoleIndex in user.roles) {
                        for (var roleIndex in this.roles) {
                            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
                                return true;
                            }
                        }
                    }
                }
            } else {
                return this.isPublic;
            }

            return false;
        };

        // Validate menu existance
        this.validateMenuExistance = function(menuId) {
            if (menuId && menuId.length) {
                if (this.menus[menuId]) {
                    return true;
                } else {
                    throw new Error('Menu does not exists');
                }
            } else {
                throw new Error('MenuId was not provided');
            }

            return false;
        };

        // Get the menu object by menu id
        this.getMenu = function(menuId) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Return the menu object
            return this.menus[menuId];
        };

        // Add new menu object by menu id
        this.addMenu = function(menuId, options) {
            options = options || {};

            // Create the new menu
            this.menus[menuId] = {
                isPublic: ((options.isPublic === null || typeof options.isPublic === 'undefined') ? true : options.isPublic),
                roles: options.roles || this.defaultRoles,
                items: options.items || [],
                shouldRender: shouldRender
            };

            // Return the menu object
            return this.menus[menuId];
        };

        // Remove existing menu object by menu id
        this.removeMenu = function(menuId) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Return the menu object
            delete this.menus[menuId];
        };

        // Add menu item object
        this.addMenuItem = function(menuId, options) {
            options = options || {};

            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Push new menu item
            this.menus[menuId].items.push({
                title: options.title || '',
                state: options.state || '',
                type: options.type || 'item',
                class: options.class,
                isPublic: ((options.isPublic === null || typeof options.isPublic === 'undefined') ? this.menus[menuId].isPublic : options.isPublic),
                roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.menus[menuId].roles : options.roles),
                position: options.position || 0,
                items: [],
                shouldRender: shouldRender
            });

            // Add submenu items
            if (options.items) {
                for (var i in options.items) {
                	this.addSubMenuItem(menuId, options.link, options.items[i]);
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        // Add submenu item object
        this.addSubMenuItem = function(menuId, parentItemState, options) {
            options = options || {};

            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Search for menu item
            for (var itemIndex in this.menus[menuId].items) {
                if (this.menus[menuId].items[itemIndex].state === parentItemState) {
                    // Push new submenu item
                    this.menus[menuId].items[itemIndex].items.push({
                        title: options.title || '',
                        state: options.state|| '',
                        isPublic: ((options.isPublic === null || typeof options.isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : options.isPublic),
                        roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : options.roles),
                        position: options.position || 0,
                        shouldRender: shouldRender
                    });
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        // Remove existing menu object by menu id
        this.removeMenuItem = function(menuId, menuItemURL) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Search for menu item to remove
            for (var itemIndex in this.menus[menuId].items) {
                if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
                    this.menus[menuId].items.splice(itemIndex, 1);
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        // Remove existing menu object by menu id
        this.removeSubMenuItem = function(menuId, submenuItemURL) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Search for menu item to remove
            for (var itemIndex in this.menus[menuId].items) {
                for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
                    if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
                        this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
                    }
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        //Adding the topbar menu
        this.addMenu('topbar', {
            isPublic: false
        });
    }
]);

'use strict';

// Create the Socket.io wrapper service
angular.module('core').service('Socket', ['Authentication', '$state', '$timeout',
    function(Authentication, $state, $timeout) {
    	// Connect to the Socket.io server only when authenticated
        if (Authentication.user) {
            this.socket = io();
        } else {
            $state.go('home');
        }

        // Wrap the Socket.io 'on' method
        this.on = function(eventName, callback) {
            if (this.socket) {
                this.socket.on(eventName, function(data) {
                    $timeout(function() {
                        callback(data);
                    });
                });
            }
        };

        // Wrap the Socket.io 'emit' method
        this.emit = function(eventName, data) {
            if (this.socket) {
                this.socket.emit(eventName, data);
            }
        };

        // Wrap the Socket.io 'removeListener' method
        this.removeListener = function(eventName) {
            if (this.socket) {
                this.socket.removeListener(eventName);
            }
        };
    }
]);

'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
	function ($httpProvider) {
		// Set the httpProvider "not authorized" interceptor
		$httpProvider.interceptors.push(['$q', '$location', 'Authentication',
			function ($q, $location, Authentication) {
				return {
					responseError: function (rejection) {
						switch (rejection.status) {
							case 401:
								// Deauthenticate the global user
								Authentication.user = null;

								// Redirect to signin page
								$location.path('signin');
								break;
							case 403:
								// Add unauthorized behaviour
								break;
						}

						return $q.reject(rejection);
					}
				};
			}
		]);
	}
]);

'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
	function ($stateProvider) {
		// Users state routing
		$stateProvider.
			state('settings', {
				abstract: true,
				url: '/settings',
				templateUrl: 'modules/users/views/settings/settings.client.view.html'
			}).
			state('settings.profile', {
				url: '/profile',
				templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
			}).
			state('settings.password', {
				url: '/password',
				templateUrl: 'modules/users/views/settings/change-password.client.view.html'
			}).
			state('settings.accounts', {
				url: '/accounts',
				templateUrl: 'modules/users/views/settings/manage-social-accounts.client.view.html'
			}).
			state('settings.picture', {
				url: '/picture',
				templateUrl: 'modules/users/views/settings/change-profile-picture.client.view.html'
			}).
			state('authentication', {
				abstract: true,
				url: '/authentication',
				templateUrl: 'modules/users/views/authentication/authentication.client.view.html'
			}).
			state('authentication.signup', {
				url: '/signup',
				templateUrl: 'modules/users/views/authentication/signup.client.view.html'
			}).
			state('authentication.signin', {
				url: '/signin',
				templateUrl: 'modules/users/views/authentication/signin.client.view.html'
			}).
			state('password', {
				abstract: true,
				url: '/password',
				template: '<ui-view/>'
			}).
			state('password.forgot', {
				url: '/forgot',
				templateUrl: 'modules/users/views/password/forgot-password.client.view.html'
			}).
			state('password.reset', {
				abstract: true,
				url: '/reset',
				template: '<ui-view/>'
			}).
			state('password.reset.invalid', {
				url: '/invalid',
				templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
			}).
			state('password.reset.success', {
				url: '/success',
				templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
			}).
			state('password.reset.form', {
				url: '/:token',
				templateUrl: 'modules/users/views/password/reset-password.client.view.html'
			});
	}
]);

'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication',
	function($scope, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		// If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		$scope.signup = function() {
			$http.post('/api/auth/signup', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		$scope.signin = function() {
			$http.post('/api/auth/signin', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication',
	function($scope, $stateParams, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		//If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		// Submit forgotten password account id
		$scope.askForPasswordReset = function() {
			$scope.success = $scope.error = null;

			$http.post('/api/auth/forgot', $scope.credentials).success(function(response) {
				// Show user success message and clear form
				$scope.credentials = null;
				$scope.success = response.message;

			}).error(function(response) {
				// Show user error message and clear form
				$scope.credentials = null;
				$scope.error = response.message;
			});
		};

		// Change user password
		$scope.resetUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/api/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.passwordDetails = null;

				// Attach user profile
				Authentication.user = response;

				// And redirect to the index page
				$location.path('/password/reset/success');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

		// Check if there are additional accounts 
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}

			return false;
		};

		// Check if provider is already in use with current user
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		// Remove a user social account
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/api/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		// Update a user profile
		$scope.updateUserProfile = function(isValid) {
			if (isValid){
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);
	
				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
				}, function(response) {
					$scope.error = response.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};

		// Change user password
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/api/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);

'use strict';

angular.module('users').controller('ChangePasswordController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// Change user password
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/api/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);

'use strict';

angular.module('users').controller('ChangeProfilePictureController', ['$scope', '$timeout', '$window', 'Authentication', 'FileUploader',
	function ($scope, $timeout, $window, Authentication, FileUploader) {
		$scope.user = Authentication.user;
		$scope.imageURL = $scope.user.profileImageURL;

		// Create file uploader instance
		$scope.uploader = new FileUploader({
			url: 'api/users/picture'
		});

		// Set file uploader image filter
		$scope.uploader.filters.push({
			name: 'imageFilter',
			fn: function (item, options) {
				var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
				return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
			}
		});

		// Called after the user selected a new picture file
		$scope.uploader.onAfterAddingFile = function (fileItem) {
			if ($window.FileReader) {
				var fileReader = new FileReader();
				fileReader.readAsDataURL(fileItem._file);

				fileReader.onload = function (fileReaderEvent) {
					$timeout(function () {
						$scope.imageURL = fileReaderEvent.target.result;
					}, 0);
				};
			}
		};

		// Called after the user has successfully uploaded a new picture
		$scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
			// Show success message
			$scope.success = true;

			// Populate user object
			$scope.user = Authentication.user = response;

			// Clear upload buttons
			$scope.cancelUpload();
		};

		// Called after the user has failed to uploaded a new picture
		$scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
			// Clear upload buttons
			$scope.cancelUpload();

			// Show error message
			$scope.error = response.message;
		};

		// Change user profile picture
		$scope.uploadProfilePicture = function () {
			// Clear messages
			$scope.success = $scope.error = null;

			// Start upload
			$scope.uploader.uploadAll();
		};

		// Cancel the upload process
		$scope.cancelUpload = function () {
			$scope.uploader.clearQueue();
			$scope.imageURL = $scope.user.profileImageURL;
		};
	}
]);

'use strict';

angular.module('users').controller('EditProfileController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// Update a user profile
		$scope.updateUserProfile = function(isValid) {
			if (isValid){
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);

				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
				}, function(response) {
					$scope.error = response.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};
	}
]);

'use strict';

angular.module('users').controller('SocialAccountsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// Check if there are additional accounts
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}

			return false;
		};

		// Check if provider is already in use with current user
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		// Remove a user social account
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/api/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);

'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');
	}
]);

'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', [

	function() {
		var _this = this;

		_this._data = {
			user: window.user
		};

		return _this._data;
	}
]);
'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
	function($resource) {
		return $resource('api/users', {}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);