﻿/* controllers.js*/
'use strict';

var siGLControllers = angular.module('siGLControllers', []);

siGLControllers.directive('ngConfirmClick', [
        function () {
            return {
                link: function (scope, element, attr) {
                    var msg = attr.ngConfirmClick || "Are you sure?";
                    var clickAction = attr.confirmedClick;
                    element.bind('click', function (event) {
                        if (window.confirm(msg)) {
                            scope.$apply(clickAction)
                        }
                    });
                }
            };
        }]);


siGLControllers.controller('mainCtrl', ['$scope', 'Projects', '$location', '$state', 'checkCreds', 'getUsername', mainCtrl]);
function mainCtrl($scope, Projects, $location, $state, checkCreds, getUsername) {
    $scope.logo = 'images/usgsLogo.png';
    if (!checkCreds()) {
        $location.path('/login');
    } else {
        $scope.username = getUsername();
        $state.go('projectList');
        //setProjectLookups();
    }
    

}

//ProjectListCtrl
siGLControllers.controller('projectListCtrl', ['$scope', 'Projects', '$location', '$http', 'checkCreds', 'getCreds', 'getUsersNAME', projectListCtrl]);
function projectListCtrl($scope, Projects, $location, $http, checkCreds, getCreds, getUsersNAME) {
    if (!checkCreds()) {
        $location.path('/login');
    }
    //array of projects    
    $http.defaults.headers.common['Authorization'] = 'Basic ' + getCreds();
    Projects.getDMProjects(function (data) {
        $scope.projects = data;
    });
    $scope.User = getUsersNAME();
    //setProjectLookups();
}
//end projectListCtrl

//projectDetailsCtrl
siGLControllers.controller('ProjectDetailCtrl', ['$scope', 'thisPproject', 'Projects', '$state', ProjectDetailCtrl]);
function ProjectDetailCtrl($scope, thisPproject, Projects, $state) {
    $scope.Title = "Project Detail: " + thisPproject.NAME;

    //Required Model properties: 
    //1. aProject, 2. ProjDurationName, 3. ProjStatusName, 4. ProjObjectives, 5. ProjKeywords, 6. parsed URLs 

    //1. aProject
    $scope.aProject = thisPproject;
    //2. ProjDurationName
    Projects.getProjDuration({ id: thisPproject.PROJECT_ID },
        function success(response) {
            $scope.projDurationName = response.DURATION_VALUE;
        },
        function error(errorResponse) {
            $scope.projDurationName = errorResponse;
        }
    );
    //3. ProjStatusName
    Projects.getProjStatus({ id: thisPproject.PROJECT_ID },
        function success(response) {
            $scope.projStatusName = response.STATUS_VALUE;
        },
        function error(errorResponse) {
            $scope.projStatusName = errorResponse;
        }
    );
    //4. ProjObjectives
    Projects.getProjObjectives({ id: thisPproject.PROJECT_ID },
        function success(response) {
            $scope.ProjectObjectives = response;
        },
        function error(errorResponse) {
            $scope.ProjectObjectives = errorResponse;
        }
    );
    //5. ProjKeywords
    Projects.getProjKeywords({ id: thisPproject.PROJECT_ID },
        function success(response) {
            $scope.ProjectKeywords = response;
        },
        function error(errorResponse) {
            $scope.ProjectKeywords = errorResponse;
        }
    );
    //6. parsed URLs by '|'
    $scope.urls = [];
    if ($scope.aProject.URL) {
        if (($scope.aProject.URL).indexOf('|') > -1) {
            $scope.urls = ($scope.aProject.URL).split("|");
        } else {
            $scope.urls[0] = $scope.aProject.URL;
        }
    }

    //back button
    $scope.cancel = function () {
        //navigate to a different state
        $state.go('projectList');
    }
}
//end projectDetailsCtrl

//ProjectEditCtrl
siGLControllers.controller('projectEditCtrl', ['$scope', '$location', '$state', '$http', 'thisPproject', 'Projects', 'allDurationList', 'allStatsList', 'allObjList', 'projObjectives', 'checkCreds', 'getCreds', projectEditCtrl]);
function projectEditCtrl($scope, $location, $state, $http, thisPproject, Projects, allDurationList, allStatsList, allObjList, projObjectives, checkCreds, getCreds) {
    //model needed for ProjectEdit Info tab: 1. thisPproject, 2. parsed urls, 3. project Keywords, 4. all objectives, 5. all statuses, 6. all durations 
    
    if (!checkCreds()) {
        //not creds, go log in        
        $location.path('/login');
    } else {
        //TODO:check that this project belongs to them if they are not admin
        $scope.Objectivesmodel = {};
        $scope.urls = [];
        if (thisPproject != undefined) {
            //this is an edit view

            //1. aProject
            $scope.aProject = thisPproject;
            $scope.title = "Edit: " + $scope.aProject.NAME;

            $scope.newURL = {};
            //2. parsed URLs by '|'
            if ($scope.aProject.URL) {
                if (($scope.aProject.URL).indexOf('|') > -1) {
                    $scope.urls = ($scope.aProject.URL).split("|");
                } else {
                    $scope.urls[0] = $scope.aProject.URL;
                }
            }
            $scope.addProjURL = function () {
                if ($scope.newURL.value != undefined) {
                    $scope.urls.push($scope.newURL.value);
                    $scope.newURL = {};
                } else {
                    alert("Please type a URL in first.");
                }
            }
            //remove url click (passed confirm)
            $scope.removeUrl = function (key) {
                var index = $scope.urls.indexOf(key);
                $scope.urls.splice(index, 1);
            }

            //3. aProj keywords
            Projects.getProjKeywords({ id: $scope.aProject.PROJECT_ID }, function (data) {
                $scope.ProjectKeywords = data;
            })
            $scope.newKey = {};

            //add keyword click
            $scope.addProjKeyword = function () {
                if ($scope.newKey.value != undefined) {
                    $scope.ProjectKeywords.push({ TERM: $scope.newKey.value });
                    $scope.newKey = {};
                } else {
                    alert("Please type a keyword in first.");
                }                
            }
            //remove keyword click (passed confirm)
            $scope.removeKey = function(key){
                var index = $scope.ProjectKeywords.indexOf(key);
                $scope.ProjectKeywords.splice(index, 1);

            }

            //get projObjectives to use in making new prop in all objectives for multi select ('selected: true')
            var projObjs = projObjectives;
           // Projects.getProjObjectives({ id: $scope.aProject.PROJECT_ID }, function (data) {
            //    projObjs = data;
            //});

            var allObjectiveList = allObjList;

            ////http://isteven.github.io/angular-multi-select/#/demo-minimum
            ////go through allObjList and add selected Property.
            for (var i = 0; i < allObjectiveList.length; i++) {
                //for each one, if projObjectives has this id, add 'selected:true' else add 'selected:false'
                for (var y = 0; y < projObjs.length; y++) {
                    if (projObjs[y].OBJECTIVE_TYPE_ID == allObjectiveList[i].OBJECTIVE_TYPE_ID) {
                        allObjectiveList[i].selected = true;
                        y = projObjs.length;
                    }
                    else {
                        allObjectiveList[i].selected = false;
                    }
                }
                if (projObjs.length == 0) {
                    allObjectiveList[i].selected = false;
                }
            }
            //4. all objectives (with new selected property)
            $scope.Objectivesdata = allObjectiveList;
            
        }
        else {
            $scope.title = "New Project";
        }

        //5. all project statuses 
        $scope.StatusList = allStatsList;
       
        //6. all durations
        $scope.DurationList = allDurationList;
        
        //save this project info
        $scope.save = function () {
            //if this is an edit, need to do PUT
            $http.defaults.headers.common['Authorization'] = 'Basic ' + getCreds();
            if ($scope.aProject.PROJECT_ID >= 1) {
                //put
                //aProject.URL --- 
                $scope.aProject.URL = ($scope.urls).join('|');
                
                //projectObjectives ----
                var selectedProjObjs = $scope.Objectivesmodel.value;
                //post these to this project --- (TODO : Need to track ones removed too)

                //projectKeywords ---- (TODO: Need to track ones removed too)


                $http.defaults.headers.common['X-HTTP-Method-Override'] = 'PUT';
                //Projects.save({id:$scope.aProject.PROJECT_ID}, $scope.aProject, function success(response) {
                //    alert("Awesome");
                //}, function error(errorResponse) {
                //    alert("Nope");
                //});
            } else {
                //post
                Projects.save({}, $scope.aProject, function success(response) {
                    alert("Awesome");
                }, function error(errorResponse) {
                    alert("Nope");
                });
            }
            
        }

        $scope.cancel = function () {
            //navigate to a different state
            $state.go('projectList');
        };

        //$scope.addOrgs = function (orgs) {
        //    if (orgs) {
        //        var array = orgs.split(',');
        //        $scope.Project.orgs = $scope.Project.orgs ? $scope.Project.orgs.concat(array) : array;
        //        $scope.newOrgs = "";
        //    }
        //    else {
        //        alert("please enter one or more orgs separated by comma.. not really");
        //    }
        //};
        //$scope.removeOrgs = function (idx) {
        //    $scope.aProject.orgs.splice(idx, 1);
        //};
    }
}
//end projectEditCtrl

//ProjectEditCoopCtrl
siGLControllers.controller('projectEditCoopCtrl', ['$scope', 'projOrganizations', 'allOrgList', projectEditCoopCtrl]);
function projectEditCoopCtrl($scope, projOrganizations, allOrgList) {
    $scope.ProjOrgs = projOrganizations;
    $scope.allOrganizations = allOrgList;
   
    $scope.submit = function (isValid) {
        if (isValid) {
            $scope.Project.$save(function (data) {
                //  toastr.success("Save successful");
            });
        }
        else {
            alert("Please correct the validation errors first");
        }
    };
    $scope.cancel = function () {
        //navigate to a different state
        $state.go('projectList');
    };
}

//ProjectEditDataCtrl
siGLControllers.controller('projectEditDataCtrl', ['$scope', 'projData', projectEditDataCtrl]);
function projectEditDataCtrl($scope, projData) {
    $scope.ProjData = projData;
    

    $scope.submit = function (isValid) {
        if (isValid) {
            $scope.Project.$save(function (data) {
                //  toastr.success("Save successful");
            });
        }
        else {
            alert("Please correct the validation errors first");
        }
    };
    $scope.cancel = function () {
        //navigate to a different state
        $state.go('projectList');
    };
}

//projectEditContactCtrl
siGLControllers.controller('projectEditContactCtrl', ['$scope', 'projContacts', 'allOrgList', projectEditContactCtrl]);
function projectEditContactCtrl($scope, projContacts, allOrgList) {
    $scope.ProjContacts = projContacts;
    $scope.allOrganizations = allOrgList;

    $scope.submit = function (isValid) {
        if (isValid) {
            $scope.Project.$save(function (data) {
                //  toastr.success("Save successful");
            });
        }
        else {
            alert("Please correct the validation errors first");
        }
    };
    $scope.cancel = function () {
        //navigate to a different state
        $state.go('projectList');
    };
}

//projectEditPubCtrl
siGLControllers.controller('projectEditPubCtrl', ['$scope', 'projPubs', projectEditPubCtrl]);
function projectEditPubCtrl($scope, projPubs) {
    $scope.ProjPublications = projPubs;
    
    $scope.submit = function (isValid) {
        if (isValid) {
            $scope.Project.$save(function (data) {
                //  toastr.success("Save successful");
            });
        }
        else {
            alert("Please correct the validation errors first");
        }
    };
    $scope.cancel = function () {
        //navigate to a different state
        $state.go('projectList');
    };
}

//login
siGLControllers.controller('LoginCtrl', ['$scope', '$state', '$http', 'Login', 'setCreds', LoginCtrl]);
function LoginCtrl($scope, $state, $http, Login, setCreds) {
    $scope.submit = function () {
        $scope.sub = true;
        var postData = {
            "username": $scope.username,
            "password": $scope.password
        };
        var up = $scope.username + ":" + $scope.password;
        $http.defaults.headers.common['Authorization'] = 'Basic ' + btoa(up);
        $http.defaults.headers.common['Accept'] = 'application/json';
        Login.login({}, postData,
            function success(response) {
                var user = response;
                if (user != undefined) {
                    //set user cookies (cred, username, name, role
                    var usersNAME = user.FNAME + " " + user.LNAME;
                    setCreds($scope.username, $scope.password, usersNAME, user.ROLE_ID);
                    $state.go('projectList');
                }
                else {
                    $scope.error = "Login Failed";
                }
            },
            function error(errorResponse) {
                alert("Error:" + errorResponse.statusText);
            }
        );
    };
}