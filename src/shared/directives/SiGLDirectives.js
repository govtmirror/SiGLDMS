﻿(function () {
    'use strict';

    var siGLControllers = angular.module('siGLControllers');

    //focus on the first element of the page
    siGLControllers.directive('focus', function () {
        return function (scope, element, attributes) {
            element[0].focus();
        };
    });

    siGLControllers.directive('myInputMask', function () {
        return {
            restrict: 'AC',
            link: function (scope, el, attrs) {
                el.inputmask(scope.$eval(attrs.myInputMask));
                el.on('change', function () {
                    scope.$eval(attrs.ngModel + "='" + el.val() + "'");
                    // or scope[attrs.ngModel] = el.val() if your expression doesn't contain dot.
                });
            }
        };
    });
    //validate password
    siGLControllers.directive('passwordValidate', ['RegExp', function (regex) {
        return {
            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {
                elm.unbind('keydown').unbind('change');
                elm.bind('blur', function (viewValue) {
                    scope.$apply(function () {
                        if ((regex.password).test(viewValue.target.value)) {
                            //it is valid
                            ctrl.$setValidity("passwordValidate", true);
                            return viewValue;
                        } else {
                            //it is invalid, return undefined - no model update
                            ctrl.$setValidity("passwordValidate", false);
                            return undefined;
                        }
                    });
                });
            }
        };
    }]);

    siGLControllers.directive('sameAs',['$parse', function ($parse) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elm, attrs, ctrl) {
                elm.unbind('keydown').unbind('change');
                elm.bind('blur', function (viewValue) {
                    scope.$watch(function () {
                        return $parse(attrs.sameAs)(scope) === ctrl.$modelValue;
                    }, function (currentValue) {
                        ctrl.$setValidity("passwordMismatch", currentValue);
                    });
                });
            }
        };
    }]);

    //disable tabs if there is no project (create page instead of edit page)
    siGLControllers.directive('aDisabled', function () {
        return {
            compile: function (tElement, tAttrs, transclude) {
                //Disable ngClick
                tAttrs.ngClick = "!(" + tAttrs.aDisabled + ") && (" + tAttrs.ngClick + ")";

                //Toggle "disabled" to class when aDisabled becomes true
                return function (scope, iElement, iAttrs) {
                    scope.$watch(iAttrs.aDisabled, function (newValue) {
                        if (newValue !== undefined) {
                            iElement.toggleClass("disabled", newValue);
                        }
                    });

                    //Disable href on click
                    iElement.on("click", function (e) {
                        if (scope.$eval(iAttrs.aDisabled)) {
                            e.preventDefault();
                        }
                    });
                };
            }
        };
    });

    siGLControllers.directive('tooltip', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                $(element).hover(function () {
                    // on mouseenter
                    $(element).tooltip('show');
                }, function () {
                    // on mouseleave
                    $(element).tooltip('hide');
                });
            }
        };
    });

    //This directive allows us to pass a function in on an enter key to do what we want.
    siGLControllers.directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });
                    event.preventDefault();
                }
            });
        };
    });

    //adding 'http://' to url inputs http://stackoverflow.com/questions/19482000/angularjs-add-http-prefix-to-url-input-field
    siGLControllers.directive('httpPrefix', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, controller) {
                function ensureHttpPrefix(value) {
                    // Need to add prefix if we don't have http:// prefix already AND we don't have part of it
                    if ((value && !/^(https?):\/\//i.test(value) && 'http://'.indexOf(value) !== 0) && 'https://'.indexOf(value) !== 0) {
                        controller.$setViewValue('http://' + value);
                        controller.$render();
                        return 'http://' + value;
                    }
                    else
                        return value;
                }
                controller.$formatters.push(ensureHttpPrefix);
                controller.$parsers.splice(0, 0, ensureHttpPrefix);
            }
        };
    });

    siGLControllers.directive('backButton', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('click', goBack);

                function goBack() {
                    history.back();
                    scope.$apply();
                }
            }
        };
    });

    //make textarea height equal to content inside it (no scrollbars) http://stackoverflow.com/questions/17772260/textarea-auto-height
    siGLControllers.directive('elastic', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, element) {
                $scope.initialHeight = $scope.initialHeight || element[0].style.height;
                var resize = function () {
                    element[0].style.height = $scope.initialHeight;
                    element[0].style.height = "" + element[0].scrollHeight + "px";
                };
                element.on("input change", resize);
                $timeout(resize, 0);
            }
        };
    }]);

    //Publish project on map
    //siGLControllers.directive('publishSite', function (){//'siteSearch', function () {
    //    return {
    //        restrict: 'E',
    //        scope: {
    //            model: '=ngModel',
    //        },
    //        replace: true,
    //        template: '<label ng-model="aProject.ready_flag" uib-uncheckable="uncheckable" ng-click="Flagged("Yes", aProject)" uib-btn-radio="1" class="publish-yes">Yes</label>' +
    //                    '<label ng-model="aProject.ready_flag" uib-uncheckable="uncheckable" ng-click="Flagged("No", aProject)" uib-btn-radio="0" class="publish-no">No</label>',
    //        controller: [
    //            '$scope', '$state', 'SITE', '$uibModal',
    //            function ($scope, $state, SITE, $uibModal) {
    //                $scope.searchTerm = '';
    //                $scope.searchBy = { val: 'bySiteNo' };
    //                $scope.placeholder = '...';
    //                $scope.IndexSearchSites = function () {
    //                    switch ($scope.searchBy.val) {
    //                        case 'bySiteNo':
    //                            SITE.query({ bySiteNo: $scope.searchTerm }, function success(resp) {
    //                                siteSearchResponse(resp);
    //                            }, function error(errorResponse) {
    //                                siteSearchResponse(errorResponse);
    //                            }).$promise;
    //                            break;
    //                        case 'bySiteId':
    //                            SITE.query({ bySiteId: $scope.searchTerm }).$promise.then(function (resp) {
    //                                siteSearchResponse(resp);
    //                            }), function (errorResponse) {
    //                                siteSearchResponse(errorResponse);
    //                            };
    //                            break;
    //                        case 'bySiteName':
    //                            SITE.query({ bySiteName: $scope.searchTerm }).$promise.then(function (resp) {
    //                                siteSearchResponse(resp);
    //                            }), function (errorResponse) {
    //                                siteSearchResponse(errorResponse);
    //                            };
    //                            break;
    //                    }
    //                };
    //                var siteSearchResponse = function (s) {
    //                    if (s.status !== undefined) {
    //                        //errorstatus show modal with error message 'no site found'
    //                        var errorModal = $uibModal.open({
    //                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
    //                                '<div class="modal-body"><p>No site found. For more site search options, go to the Sites navigation tab to search for sites.</p></div>' +
    //                                '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button></div>',
    //                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
    //                                $scope.ok = function () {
    //                                    $uibModalInstance.close();
    //                                };
    //                            }],
    //                            size: 'sm'

    //                        });
    //                        errorModal.result.then(function () {
    //                            $scope.searchTerm = '';
    //                            $scope.searchBy = { val: 'bySiteNo' };
    //                        });

    //                    } else {
    //                        //reset search and go to the site dash
    //                        $scope.searchTerm = '';
    //                        $scope.searchBy = { val: 'bySiteNo' };
    //                        $state.go('site.dashboard', { id: s.site_id });
    //                    }
    //                };
    //            }
    //        ]
    //    };
    //});
})();