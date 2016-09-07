﻿(function () {
    'use strict';

    var siGLControllers = angular.module('siGLControllers');

    siGLControllers.controller('projMultiSiteEditCtrl', ['$scope', '$http', '$q', '$cookies', '$state', '$uibModal', 'hotRegisterer', 'ProjParts_Service', 'allProjSites', 'thisProject', 'CountryList', 'stateList', 'lakeList', 'siteStatList', 'resourceList', 'mediaList', 'frequencyList', 'parameterList', 'SITE',
        function ($scope, $http, $q, $cookies, $state, $uibModal, hotRegisterer, ProjParts_Service, allProjSites, thisProject, CountryList, stateList, lakeList, siteStatList, resourceList, mediaList, frequencyList, parameterList , SITE) {
            //dropdowns and multiselects [siteStatList, lakeList, stateList, CountryList, resourceList, mediaList, frequencyList, parameterList]
            $scope.siteStatuses = siteStatList;
            $scope.lakes = lakeList;
            $scope.stateArray = stateList;
            $scope.countryArray = CountryList;
            $scope.resources = resourceList;
            $scope.medias = mediaList;
            $scope.frequencies = frequencyList;
            $scope.parameters = parameterList;
            $scope.hotInstance;
            $scope.invalids = [];
            $scope.max = 0; $scope.dynamic = 0;
            $scope.showLoading = false;
            $scope.columnWidths = [5, 130, 80, 84, 98, 92, 88, 98, 92, 120, 90, 120, 120, 120, 100, 100, 120, 120, 100,
                    20, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, //phys
                    20, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,  //chem
                    20, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, //bio
                    20, 80, 80, 80, 80, //micro
                    20, 80, 80, 80, 80];//tox
           
            $scope.lakeArray = []; $scope.statusArray = []; $scope.resourceArray = []; $scope.mediaArray = []; $scope.frequencyArray = []; 
            $scope.Changes = []; //track changes made to compare for saving
            $scope.ParamChanges = [];// track param changes made to compare for saving
            $scope.startDateHolder = [];
            $scope.endDateHolder = [];
            //date without time
            var makeAdateString = function (d) {
                var aDate = new Date();
                if (d !== "") {
                    //provided date
                    aDate = new Date(d);
                }

                var year = aDate.getFullYear();
                var month = aDate.getMonth();
                var day = ('0' + aDate.getDate()).slice(-2);
                var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
                var dateWOtime = monthNames[month] + "/" + day + "/" + year;
                return dateWOtime;
            };
            //add parameter.parameter as property to table bind data
            var addParametersToPsite = function (ps) {
                for (var para = 0; para < $scope.parameters.length; para++) {
                    ps[$scope.parameters[para].parameter] = '.';
                }
                return ps;
            };

            //convert each array objects to array of strings for handsontable dropdown
            angular.forEach($scope.lakes, function (l) { $scope.lakeArray.push(l.lake); });
            angular.forEach($scope.siteStatuses, function (s) { $scope.statusArray.push(s.status); });
            //angular.forEach($scope.resources, function (r) { $scope.resourceArray.push(r.resource_name); }); //angular.forEach($scope.medias, function (m) { $scope.mediaArray.push(m.media) });//angular.forEach($scope.frequencies, function (f) { $scope.frequencyArray.push(f.frequency) });
           
            //format data object for handsontable
            $scope.setUpDataForTable = function () {
                $scope.projSites = [];
                var originalPrSi = angular.copy(allProjSites);
                angular.forEach(originalPrSi, function (psite) {
                    //add all parameters as columns to later loop through to apply checked if present
                    psite = addParametersToPsite(psite);
                    //#region start and end date - remove time part of date string
                    if (psite.StartDate !== "") {
                        //cut off time
                        var sIndex = psite.StartDate.indexOf(" ");
                        psite.StartDate = psite.StartDate.substring(0, sIndex);
                        //add leading zero for month and day
                        var sMIndex = psite.StartDate.indexOf("/");
                        if (sMIndex <= 1) psite.StartDate = "0" + psite.StartDate;

                        var sDIndex = psite.StartDate.lastIndexOf("/");
                        if (sDIndex <= 4) psite.StartDate = psite.StartDate.slice(0, sDIndex - 1) + "0" + psite.StartDate.slice(sDIndex - 1);
                    }
                    if (psite.EndDate !== "") {
                        var eIndex = psite.EndDate.indexOf(" ");
                        psite.EndDate = psite.EndDate.substring(0, eIndex);
                        //add leading zero for month and day
                        var eMIndex = psite.EndDate.indexOf("/");
                        if (eMIndex <= 1) psite.EndDate = "0" + psite.EndDate;

                        var eDIndex = psite.EndDate.lastIndexOf("/");
                        if (eDIndex <= 4) psite.EndDate = psite.EndDate.slice(0, eDIndex - 1) + "0" + psite.EndDate.slice(eDIndex - 1);
                    }
                    //#endregion
                    //#region make a comma separated string for each thing if more than 1
                    if (psite.Resources.length > 0) {
                        var resString = "";
                        for (var r = 0; r < psite.Resources.length; r++) {
                            resString += psite.Resources[r].resource_name;
                            if (r < psite.Resources.length - 1) resString += ", ";
                        }
                        psite.ResourceStrings = resString;
                    }
                    if (psite.Media.length > 0) {
                        var medString = "";
                        for (var m = 0; m < psite.Media.length; m++) {
                            medString += psite.Media[m].media;
                            if (m < psite.Media.length - 1) medString += ", ";
                        }
                        psite.MediaStrings = medString;
                    }
                    if (psite.Frequencies.length > 0) {
                        var freqString = "";
                        for (var f = 0; f < psite.Frequencies.length; f++) {
                            freqString += psite.Frequencies[f].frequency;
                            if (f < psite.Frequencies.length - 1) freqString += ", ";
                        }
                        psite.FrequencyStrings = freqString;
                    }
                    //#endregion
                    //#region deal with pulling apart parameters for individual checkboxs
                    if (psite.Parameters.length > 0) {
                        angular.forEach(psite.Parameters, function (p) {
                            psite[p.parameter] = "x";
                        });
                    }
                    //#endregion
                    $scope.projSites.push(psite);
                });
            };
            $scope.setUpDataForTable(); //call it after creating it to run, called again in 'reset'
            
            //they want to add/remove resources 
            var getMultiModal = function (col, row, whichOne) {
                var prevValues = $scope.hotInstance.getDataAtCell(row, col);
                var aModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">{{which}}</h3></div>' +
                        '<div class="modal-body"><p>Choose {{which}}:</p><p><ul><li style="list-style:none;" ng-repeat="r in resourceList">' +
                        '<input type="checkbox" name="resources" ng-model="r.selected" ng-click="addRes(r)"/><span>{{ r.resource_name || r.media || r.frequency }}</span></li></ul></p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        allResources: function () {
                            if (whichOne == "Resources") {
                                return $scope.resources;
                            } else if (whichOne == "Media") {
                                return $scope.medias;
                            } else {
                                return $scope.frequencies;
                            }
                        },
                        chosenValues: function () { return prevValues; },
                        whichEntities: function () { return whichOne; }
                    },
                    controller: function ($scope, $uibModalInstance, allResources, chosenValues, whichEntities) {
                        //add selected prop to each resource
                        $scope.which = whichEntities;
                        $scope.resourceList = angular.copy(allResources);
                        $scope.chosenResStringArray = [];
                        if (chosenValues !== null) {
                            $scope.resourceString = angular.copy(chosenValues.split(","));
                            angular.forEach($scope.resourceString, function (crs) {
                                $scope.chosenResStringArray.push(crs.trim());
                            });
                        }
                        //add selected and select if in chosenResStringArray
                        for (var i = 0; i < $scope.resourceList.length; i++) {
                            for (var y = 0; y < $scope.chosenResStringArray.length; y++) {
                                if ($scope.chosenResStringArray[y] == $scope.resourceList[i].resource_name || $scope.chosenResStringArray[y] == $scope.resourceList[i].media || $scope.chosenResStringArray[y] == $scope.resourceList[i].frequency) {
                                    $scope.resourceList[i].selected = true;
                                    y = $scope.chosenResStringArray.length;
                                }
                                else $scope.resourceList[i].selected = false;
                            }
                            if ($scope.chosenResStringArray.length === 0) $scope.resourceList[i].selected = false;
                        }//end foreach resource

                        //selected or not selected ..add or remove from chosen ones to pass back
                        $scope.addRes = function (res) {
                            if (res.selected) {
                                switch(whichEntities){
                                    case "Resources":
                                        $scope.chosenResStringArray.push(res.resource_name);
                                        break;
                                    case "Media":
                                        $scope.chosenResStringArray.push(res.media);
                                        break;
                                    case "Frequencies":
                                        $scope.chosenResStringArray.push(res.frequency);
                                        break;
                                }
                            } else {
                                var resInd = $scope.chosenResStringArray.map(function (r) { return r; }).indexOf(res.resource_name);
                                var mInd = $scope.chosenResStringArray.map(function (r) { return r; }).indexOf(res.media);
                                var fInd = $scope.chosenResStringArray.map(function (r) { return r; }).indexOf(res.frequency);
                                if (resInd >= 0) $scope.chosenResStringArray.splice(resInd, 1);
                                if (mInd >= 0) $scope.chosenResStringArray.splice(mInd, 1);
                                if (fInd >= 0) $scope.chosenResStringArray.splice(fInd, 1);
                            }
                        };
                        $scope.ok = function () {
                            $uibModalInstance.close($scope.chosenResStringArray.join(", "));
                        };
                    },
                    size: 'md'
                });
                aModal.result.then(function (newVal) {
                    $scope.hotInstance.setDataAtCell(row, col, newVal);
                });
            };
                        
            //go back to siteList (no changes)
            $scope.cancel = function () {
                $state.go("site.siteList");
            };
            //reset back 
            $scope.reset = function () {
                $scope.setUpDataForTable();
                $scope.hotInstance.loadData($scope.projSites);
                $scope.invalids = [];
            };
            
            var formatJustSiteProps = function (s) {
                var site = {
                    //   site_id: s.SiteId,
                    start_date: s.StartDate !== undefined && s.StartDate !== "" ? new Date(s.StartDate) : null,
                    end_date: s.EndDate !== undefined && s.EndDate !== "" ? new Date(s.EndDate) : null,
                    project_id: thisProject.project_id,
                    sample_platform: s.SamplePlatform,
                    additional_info: s.AdditionalInfo,
                    name: s.Name,
                    description: s.Description,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    waterbody: s.Waterbody,
                    status_type_id: s.Status !== "" && s.Status !== undefined ? $scope.siteStatuses.filter(function (st) { return st.status == s.Status; })[0].status_id : 0,
                    lake_type_id: $scope.lakes.filter(function (l) { return l.lake == s.Lake; })[0].lake_type_id,
                    country: s.Country,
                    state_province: s.State,
                    watershed_huc8: s.Watershed,
                    url: s.url
                };
                if (s.SiteId !== null && s.SiteId !== undefined) site.site_id = s.SiteId;
                return site;
            };
            //compare before (resources,media,frequencies) to after for saving (POST, DELETE)
            var difference = function (a1, a2, type) {
                //var a1 = ['a', 'b'     ];
                //var a2 = [     'b', 'c'];
                //will return 'a'
                var result = [];
                if (type == "res") {
                    for (var ri = 0; ri < a1.length; ri++) {
                        if ((a2.map(function (r) { return r.resource_type_id; }).indexOf(a1[ri].resource_type_id)) === -1) {
                            result.push(a1[ri]);
                        }
                    }
                }
                if (type == "med") {
                    for (var mi = 0; mi < a1.length; mi++) {
                        if ((a2.map(function (r) { return r.media_type_id; }).indexOf(a1[mi].media_type_id)) === -1) {
                            result.push(a1[mi]);
                        }
                    }
                }
                if (type == "freq") {
                    for (var fi = 0; fi < a1.length; fi++) {
                        if ((a2.map(function (r) { return r.frequency_type_id; }).indexOf(a1[fi].frequency_type_id)) === -1) {
                            result.push(a1[fi]);
                        }
                    }
                }
                if (type == "param") {
                    for (var pi = 0; pi < a1.length; pi++) {
                        if ((a2.map(function (r) { return r.parameter_type_id; }).indexOf(a1[pi].parameter_type_id)) === -1) {
                            result.push(a1[pi]);
                        }
                    }
                }
                if (type == "site") {
                    for (var si = 0; si < a1.length; si++) {
                        if ((a2.map(function (r) { return r[0]; }).indexOf(a1[si].SiteId)) === -1) {
                            result.push(a1[si]);
                        }
                    }
                }
                return result;
            };

            //update this site
            var UpdateSites = function (updatedSiteList){//thisS, newSite) {                var updatedSite = {}; var newSiteFormatted = {};
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('siGLCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                angular.forEach(updatedSiteList, function (s) {
                    var site = formatJustSiteProps(s);
                    var defer = $q.defer();
                    var RemovePromises = [];
                    var AddPromises = [];
                    //#region REMOVES
                    //remove frequencies (freqToRemove contains those to remove ->DELETE)
                    angular.forEach(s.removedFreq, function (Fvalue) {
                        var delFreqProm = SITE.deleteSiteFrequency({ id: site.site_id, FrequencyTypeId: Fvalue.frequency_type_id }).$promise;
                        RemovePromises.push(delFreqProm);
                    });

                    //remove media (medToRemove contains those to remove ->DELETE)
                    angular.forEach(s.removedMedia, function (Mvalue) {
                        var delMedProm = SITE.deleteSiteMedia({ id: site.site_id, MediaTypeId: Mvalue.media_type_id }).$promise;
                        RemovePromises.push(delMedProm);
                    });

                    //remove resources (resToRemove contains those to remove ->DELETE)
                    angular.forEach(s.removedResources, function (Rvalue) {
                        var delResProm = SITE.deleteSiteResource({ id: site.site_id, ResourceTypeId: Rvalue.resource_type_id }).$promise;
                        RemovePromises.push(delResProm);
                    });

                    //remove Paramters (paramToRemove contains those to remove ->DELETE)
                    angular.forEach(s.removedParams, function (Pvalue) {
                        var delParamProm = SITE.deleteSiteParameter({ id: site.site_id, ParameterTypeId: Pvalue.parameter_type_id }).$promise;
                        RemovePromises.push(delParamProm);
                    });
                    //#endregion
                    //#region ADDS
                    var updateSiteProm = SITE.update({ id: site.site_id }, site).$promise;
                    AddPromises.push(updateSiteProm);
                            
                    //add Frequencies
                    angular.forEach(s.addedFreq, function (FaddValue) {                            
                        var freqProm = SITE.addSiteFrequency({ id: site.site_id, frequencyTypeId: FaddValue.frequency_type_id }).$promise;
                        AddPromises.push(freqProm);
                    });
                    //add Media
                    angular.forEach(s.addedMedia, function (MaddValue) {                            
                        var medProm = SITE.addSiteMedia({ id: site.site_id, mediaTypeId: MaddValue.media_type_id }).$promise;
                        AddPromises.push(medProm);
                    });                        
                    //add Resources
                    angular.forEach(s.addedResources, function (RaddValue) {
                        var resProm = SITE.addSiteResource({ id: site.site_id, resourceTypeId: RaddValue.resource_type_id }).$promise;
                        AddPromises.push(resProm);
                    });                        
                    //add Parameters
                    angular.forEach(s.addedParams, function (p) {
                        var paramProm = SITE.addSiteParameter({ id: site.site_id, parameterTypeId: p.parameter_type_id }).$promise;
                        AddPromises.push(paramProm);                            
                    });                        
                    //#endregion
                    //ok now run the removes, then the adds and then pass the stuff back out of here.
                    $q.all(RemovePromises).then(function () {
                        //clear remove arrays                           
                        $q.all(AddPromises).then(function (response) {
                            $scope.dynamic++;
                            console.log("siteUpdates");
                            if ($scope.dynamic == $scope.max) $state.go("projectEdit.site.siteList", { id: thisProject.project_id });
                        }).catch(function error(msg) {
                            //catch on addPromises
                            var errorM = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>Something went wrong. Error updating site {{dyn}} of {{maxS}}. Please review and try again.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                backdrop: 'static',
                                keyboard: false,
                                resolve: { whichSite: function () { return $scope.dynamic; }, maxSites: function () { return $scope.max; } },
                                controller: function ($scope, $uibModalInstance, whichSite, maxSites) {
                                    $scope.dyn = whichSite; $scope.maxS = maxSites;
                                    $scope.ok = function () {
                                        $uibModalInstance.dismiss();
                                    };
                                },
                                size: 'sm'
                            });
                            $scope.showLoading = false; //Loading...
                            console.error("Error Adding: " + msg);
                        });
                    }).catch(function error(msg) {
                        //catch on removePromises
                        var errorM = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Something went wrong. Error updating site {{dyn}} of {{maxS}}. Please review and try again.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            backdrop: 'static',
                            keyboard: false,
                            resolve: { whichSite: function () { return $scope.dynamic; }, maxSites: function () { return $scope.max; } },
                            controller: function ($scope, $uibModalInstance, whichSite, maxSites) {
                                $scope.dyn = whichSite; $scope.maxS = maxSites;
                                $scope.ok = function () {
                                    $uibModalInstance.dismiss();
                                };
                            },
                            size: 'sm'
                        });
                        $scope.showLoading = false; //Loading...
                        console.error("Error Removing Parts: " + msg);
                    });//end $q.all
                });//end angular.forEach()
            };//end updateSite()

            var CreateSites = function (updatedCSiteList) {
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('siGLCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                angular.forEach(updatedCSiteList, function (s) {
                    var site = formatJustSiteProps(s);
                    SITE.save({}, site).$promise.then(function (response) {
                        var createdSite = response;
                        var defer = $q.defer();
                        var postPromises = [];
                        //post frequencies
                        //angular.forEach(s.Frequencies, function (fValue) {
                        var freqProm = SITE.addSiteFrequencyList({ id: createdSite.site_id }, s.Frequencies).$promise;
                        postPromises.push(freqProm);

                        //post media                        
                        var medProm = SITE.addSiteMediaList({ id: createdSite.site_id }, s.Media).$promise;
                        postPromises.push(medProm);

                        //post resources
                        var resProm = SITE.addSiteResourceList({ id: createdSite.site_id }, s.Resources).$promise;
                        postPromises.push(resProm);

                        //post parameters
                        var parProm = SITE.addSiteParameterList({ id: createdSite.site_id }, s.Parameters).$promise;
                        postPromises.push(parProm);

                        $q.all(postPromises).then(function (response) {
                            $scope.dynamic++;
                            console.log("site created");
                            if ($scope.dynamic == $scope.max) $state.go("projectEdit.site.siteList", { id: thisProject.project_id });
                        }).catch(function error(msg) {
                            var errorM = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>Something went wrong. Error updating site {{dyn}} of {{maxS}}. Please review and try again.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                backdrop: 'static',
                                keyboard: false,
                                resolve: { whichSite: function () { return $scope.dynamic; }, maxSites: function () { return $scope.max; } },
                                controller: function ($scope, $uibModalInstance, whichSite, maxSites) {
                                    $scope.dyn = whichSite; $scope.maxS = maxSites;
                                    $scope.ok = function () {
                                        $uibModalInstance.dismiss();
                                    };
                                },
                                size: 'sm'
                            });
                            $scope.showLoading = false; //Loading...
                            console.error("Error creating new site: " + msg);
                        });
                    }, function (errorResponse) {
                        //error on site.save()
                        var errorM = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Something went wrong. Error creating site {{dyn}} of {{maxS}}. Please review and try again.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            backdrop: 'static',
                            keyboard: false,
                            resolve: { whichSite: function () { return $scope.dynamic; }, maxSites: function () { return $scope.max; } },
                            controller: function ($scope, $uibModalInstance, whichSite, maxSites) {
                                $scope.dyn = whichSite; $scope.maxS = maxSites;
                                $scope.ok = function () {
                                    $uibModalInstance.dismiss();
                                };
                            },
                            size: 'sm'
                        });
                        $scope.showLoading = false; //Loading...
                        console.error("Error Creating Site: " + errorResponse);
                    });//end SITE.save()
                });//end angular.forEach()             
            };//end createSite()

            //format site and all related things for saving 
            var formatNewSite = function (row, changesMade) {
                var newSite = {};
                newSite.SiteId = row[0];
                newSite.Name = row[1];
                newSite.latitude = row[2];
                newSite.longitude = row[3];
                newSite.Country = row[4];
                newSite.State = row[5];
                newSite.Lake = row[6];
                newSite.Waterbody = row[7];
                newSite.Watershed = row[8];
                newSite.Description = row[9];
                newSite.Status = row[10];
                newSite.Resources = []; var resourcesBefore = []; var originalResourceArray = [];
                //#region resources
                if (row[11] !== null) {
                    var resChangesMade = false;
                    //if this is not a new site, need to compare to what it was before for addThese and removeThese from site
                    if (newSite.SiteId !== null) {
                        resChangesMade = changesMade.filter(function (cm) { return cm[1] == "ResourceStrings"; }).length > 0 ? true : false;
                        if (resChangesMade) {
                            resourcesBefore = allProjSites.filter(function (allPS) { return allPS.SiteId == newSite.SiteId; })[0].Resources;
                            //only want the resource for equal comparison
                            angular.forEach(resourcesBefore, function (br) {
                                originalResourceArray.push({ resource_name: br.resource_name, resource_type_id: br.resource_type_id });
                            });
                        }
                    }//end of if this is an edit rather than new row   

                    var resStringArray = [];
                    angular.forEach(row[11].split(","), function (rs) {
                        resStringArray.push(rs.trim()); //make array of string and trim off whitespace
                    });
                    //add the resource to Resources for the site
                    angular.forEach($scope.resources, function (r) {
                        if (resStringArray.indexOf(r.resource_name) > -1)
                            newSite.Resources.push(r);
                    });
                    if (newSite.SiteId !== null && resChangesMade) {
                        //if this is an edit, need to know if any were removed or added
                        //now I have original resources (if any) and new resources.. make addList and removeList to send back with this site                    
                        var addedResources = difference(newSite.Resources, originalResourceArray, "res");
                        var removedResources = difference(originalResourceArray, newSite.Resources, "res");
                        newSite.addedResources = addedResources; newSite.removedResources = removedResources;
                    }
                }//end row[11] != null
                //#endregion   
                newSite.Media = []; var medsBefore = []; var originalMediaArray = [];
                //#region media
                if (row[12] !== null) {
                    var medChangesMade = false;
                    //if this is not a new site, need to compare to what it was before for addThese and removeThese from site
                    if (newSite.SiteId !== null) {
                        medChangesMade = changesMade.filter(function (cm) { return cm[1] == "MediaStrings"; }).length > 0 ? true : false;
                        if (medChangesMade) {
                            medsBefore = allProjSites.filter(function (allPS) { return allPS.SiteId == newSite.SiteId; })[0].Media;
                            //only want the Media for equal comparison
                            angular.forEach(medsBefore, function (bm) {
                                originalMediaArray.push({ media: bm.media, media_type_id: bm.media_type_id });
                            });
                        }
                    }//end of if this is an edit rather than new row   

                    var medStringArray = [];
                    angular.forEach(row[12].split(","), function (ms) {
                        medStringArray.push(ms.trim()); //make array of string and trim off whitespace
                    });
                    //add the resource to Resources for the site
                    angular.forEach($scope.medias, function (r) {
                        if (medStringArray.indexOf(r.media) > -1)
                            newSite.Media.push(r);
                    });
                    if (newSite.SiteId !== null && medChangesMade) {
                        //if this is an edit, need to know if any were removed or added
                        //now I have original resources (if any) and new resources.. make addList and removeList to send back with this site                    
                        var addedMed = difference(newSite.Media, originalMediaArray, "med");
                        var removedMed = difference(originalMediaArray, newSite.Media, "med");
                        newSite.addedMedia = addedMed; newSite.removedMedia = removedMed;
                    }
                }//end row[12]
                //#endregion
                newSite.Frequencies = []; var freqBefore = []; var originalFreqArray = [];
                //#region frequency
                if (row[13] !== null) {
                    var freqChangesMade = false;
                    //if this is not a new site, need to compare to what it was before for addThese and removeThese from site
                    if (newSite.SiteId !== null) {
                        freqChangesMade = changesMade.filter(function (cm) { return cm[1] == "FrequencyStrings"; }).length > 0 ? true : false;
                        if (freqChangesMade) {
                            freqBefore = allProjSites.filter(function (allPS) { return allPS.SiteId == newSite.SiteId; })[0].Frequencies;
                            //only want the Media for equal comparison
                            angular.forEach(freqBefore, function (bf) {
                                originalFreqArray.push({ frequency: bf.frequency, frequency_type_id: bf.frequency_type_id });
                            });
                        }
                    }//end of if this is an edit rather than new row   

                    var freqStringArray = [];
                    angular.forEach(row[13].split(","), function (fs) {
                        freqStringArray.push(fs.trim()); //make array of string and trim off whitespace
                    });
                    //add the resource to Resources for the site
                    angular.forEach($scope.frequencies, function (f) {
                        if (freqStringArray.indexOf(f.frequency) > -1)
                            newSite.Frequencies.push(f);
                    });
                    if (newSite.SiteId !== null && freqChangesMade) {
                        //if this is an edit, need to know if any were removed or added
                        //now I have original resources (if any) and new resources.. make addList and removeList to send back with this site                    
                        var addedFreq = difference(newSite.Frequencies, originalFreqArray, "freq");
                        var removedFreq = difference(originalFreqArray, newSite.Frequencies, "freq");
                        newSite.addedFreq = addedFreq; newSite.removedFreq = removedFreq;
                    }
                }
                //#endregion
                newSite.StartDate = row[14];
                newSite.EndDate = row[15];
                newSite.SamplePlatform = row[16];
                newSite.AdditionalInfo = row[17];
                newSite.url = row[18];
                newSite.Parameters = []; var paramBefore = []; var originalParamArray = [];
                //#region Parameters
                //skip 19,46,65,82,87
                //loop through starting at 20 to 45 for physical params
                var physArray = $scope.parameters.filter(function (P) { return P.parameter_group == "Physical"; });
                for (var p = 0; p < physArray.length; p++) {
                    if (row[p + 20] == "x")
                        newSite.Parameters.push(physArray[p]);
                }
                //loop through starting at 47 to 64 for chem
                var chemArray = $scope.parameters.filter(function (P) { return P.parameter_group == "Chemical"; });
                for (var c = 47; c < 65; c++) {
                    if (row[c] == "x")
                        newSite.Parameters.push(chemArray[c - 47]);
                }
                //loop through starting at 47 to 64 for bio
                var bioArray = $scope.parameters.filter(function (P) { return P.parameter_group == "Biological"; });
                for (var b = 66; b < 82; b++) {
                    if (row[b] == "x")
                        newSite.Parameters.push(bioArray[b - 66]);
                }
                //loop through starting at 66 to 8 for micro
                var micrArray = $scope.parameters.filter(function (P) { return P.parameter_group == "Microbiological"; });
                for (var m = 83; m < 87; m++) {
                    if (row[m] == "x")
                        newSite.Parameters.push(micrArray[m - 83]);
                }
                //loop through starting at 47 to 64 for tox
                var toxArray = $scope.parameters.filter(function (P) { return P.parameter_group == "Microbiological"; });
                for (var t = 88; t < row.length; t++) {
                    if (row[t] == "x")
                        newSite.Parameters.push(toxArray[t - 88]);
                }
                var paramChangesMade = false;
                //if this is not a new site, need to compare to what it was before for addThese and removeThese from site
                if (newSite.SiteId !== null) {
                    paramChangesMade = $scope.ParamChanges.length > 0 ? true : false;
                    if (paramChangesMade) {
                        paramBefore = allProjSites.filter(function (allPS) { return allPS.SiteId == newSite.SiteId; })[0].Parameters;
                        //only want the Media for equal comparison
                        angular.forEach(paramBefore, function (pf) {
                            originalParamArray.push({ parameter: pf.parameter, parameter_type_id: pf.parameter_type_id, parameter_group: pf.parameter_group });
                        });
                    }
                }
                if (newSite.SiteId !== null && paramChangesMade) {
                    //if this is an edit, need to know if any were removed or added
                    //now I have original resources (if any) and new resources.. make addList and removeList to send back with this site                    
                    var addedP = difference(newSite.Parameters, originalParamArray, "param");
                    var removedP = difference(originalParamArray, newSite.Parameters, "param");
                    newSite.addedParams = addedP; newSite.removedParams = removedP;
                }
                //#endregion                
                return newSite;
            };

            //all done making changes, save it and go back to siteList
            $scope.save = function () {
                if ($scope.invalids.length > 0) {
                    var invalidModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Please correct all invalid fields before saving.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        backdrop: 'static',
                        keyboard: false,
                        controller: function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.dismiss();
                            };
                        },
                        size: 'sm'
                    });
                } else {
                    var newData = $scope.hotInstance.getData();
                    var allUpdatedEdSites = []; 
                    var allUpdatedCrSites = [];
                    var numOfStuffToDo = 0;
                    $scope.showLoading = true; //Loading...
                    // drop the last 3 since they are empty
                    for (var i = newData.length; i--;) {
                        if (newData[i][0] === null && newData[i][1] === null && newData[i][2] === null) {
                            newData.splice(i, 1);
                        }
                    }
                    //see if they deleted any sites
                    if (newData.length < allProjSites.length) {
                        var sitesToDelete = difference(allProjSites, newData, "site");
                        angular.forEach(sitesToDelete, function (sd) {
                            SITE.delete({ id: sd.SiteId }).$promise;
                        });//this should take care of it.. the allUpdatedSites won't have them, so they won't be accidentally saved, and the endpoint handles the cascade (should?)
                    }
                    for (var n = 0; n < newData.length; n++) {
                        //$scope.Changes holds array of all changes made [0]=row, [1]=databindName, [2]=wasValue, [3]=isValue
                        var thisRowChanges = $scope.Changes.filter(function (chang) { return chang[0] == n; });
                        //only go through this if a change has been made to anything in the row
                        if (thisRowChanges.length > 0) {
                            var formattedSite = formatNewSite(newData[n], thisRowChanges);
                            if (formattedSite.SiteId !== null)
                                allUpdatedEdSites.push(formattedSite);
                            else allUpdatedCrSites.push(formattedSite);
                        }
                    }
                    $scope.max = allUpdatedCrSites.length + allUpdatedEdSites.length;
                    if (allUpdatedEdSites.length > 0) UpdateSites(allUpdatedEdSites);
                    if (allUpdatedCrSites.length > 0) CreateSites(allUpdatedCrSites);
                    //setTimeout(function () {
                       
                    //}, 125000);
                }
            };
            
            //#region renderer and validators for handsontable
            var requiredModal = function () {
                var reqModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                        '<div class="modal-body"><p>This field is required.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                    backdrop: 'static',
                    keyboard: false,
                    controller: function ($scope, $uibModalInstance) {
                        $scope.ok = function () {
                            $uibModalInstance.dismiss();
                        };
                    },
                    size: 'sm'
                });
            };
            //make the parameter divider columns gray and add "*" if any of that group's parameters are checked
            var colorRenderer = function (instance, td, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                var thisRow = instance.getDataAtRow(row);
                switch (col) {
                    case 19:                         
                        for (var rIP = 20; rIP < 46; rIP++) {
                            //phys
                            if (thisRow[rIP] == 'x') td.innerHTML = "*";
                        }
                        break;                    
                    case 46:
                        for (var rIC = 47; rIC < 65; rIC++) {
                            //chem
                            if (thisRow[rIC] == 'x') td.innerHTML = "*";
                        }
                        break;
                    case 65:
                        for (var rIB = 66; rIB < 82; rIB++) {
                            //bio
                            if (thisRow[rIB] == 'x') td.innerHTML = "*";
                        }
                        break;
                    case 82:
                        for (var rIM = 83; rIM < 87; rIM++) {
                            //micro
                            if (thisRow[rIM] == 'x') td.innerHTML = "*";
                        }
                        break;
                    case 87:
                        for (var rIT = 88; rIT < 92; rIT++) {
                            //tox
                            if (thisRow[rIT] == 'x') td.innerHTML = "*";
                        }
                        break;
                }               
                td.style.background = '#EEE';
                return td;
            };
            $scope.requiredValidator = function (value, callback) {
                if (!value) {
                    requiredModal();
                    callback(false);
                } else {
                    callback(true);
                }
            };
            $scope.urlValidator = function (value, callback) {
                if (value.substring(0, 4) !== 'http' && value.substring(0,4) !== "") {
                    var httpModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Site URL must start with "http://" or "https://"</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        backdrop: 'static',
                        keyboard: false,
                        controller: function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.dismiss();
                            };
                        },
                        size: 'sm'
                    });
                    callback(false);
                }
                else {
                    callback(true);
                }
            };
            $scope.latValidator = function (value, callback) {
                //number and > 0
                if (value < 0 || isNaN(value)) {
                    var latModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Latitude must be greater than 0.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        backdrop: 'static',
                        keyboard: false,
                        controller: function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.dismiss();
                            };
                        },
                        size: 'sm'
                    });
                    callback(false);
                } else if (!value) {
                    requiredModal();
                    callback(false);
                } else {
                    callback(true);
                }                
            };
            $scope.longValidator = function (value, callback) {
                if (value > 0 || isNaN(value)) {
                    var longModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Longitude must be less than 0.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        backdrop: 'static',
                        keyboard: false,
                        controller: function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.dismiss();
                            };
                        },
                        size: 'sm'
                    });
                    callback(false);
                } else if (!value) {
                    requiredModal();
                    callback(false);
                }
                else {
                    callback(true);
                }
            };
            $scope.watershedValidator = function (value, callback) {               
                if (value !== "" && (isNaN(parseInt(value)) || (value.length > 8 || value.length < 8))) {
                    var waterModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Watershed must be 8 digits long containing only numbers.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        backdrop: 'static',
                        keyboard: false,
                        controller: function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.dismiss();
                            };
                        },
                        size: 'sm'
                    });
                    callback(false);
                } else {
                    callback(true);
                }
            };
            $scope.dateValidator = function (value, callback){
                if (value !== "") {
                    var row = this.row;
                    var prop = this.prop;
                    var dataAtRow = $scope.hotInstance.getDataAtRow(row);
                    //which prop are we dealing with
                    if (prop == "StartDate") {
                        //make sure it's before EndDate col=[15]
                        if (dataAtRow[15] !== "" && dataAtRow[15] !== null) {
                            //something to compare too
                            if (Date.parse(value) > Date.parse(dataAtRow[15])) {
                                var startModal = $uibModal.open({
                                    template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                        '<div class="modal-body"><p>Start Date must be before End Date.</p></div>' +
                                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                    backdrop: 'static',
                                    keyboard: false,
                                    controller: function ($scope, $uibModalInstance) {
                                        $scope.ok = function () {
                                            $uibModalInstance.dismiss();
                                        };
                                    },
                                    size: 'sm'
                                });
                                callback(false);
                            } else callback(true);
                        } else callback(true);
                    } else callback(true);
                    if (prop == "EndDate") {
                        //make sure it's after StartDate col=[14]
                        if (dataAtRow[14] !== "" && dataAtRow[14] !== null) {
                            //something to compare too
                            if (Date.parse(value) < Date.parse(dataAtRow[14])) {
                                var endModal = $uibModal.open({
                                    template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                        '<div class="modal-body"><p>End Date must be after Start Date.</p></div>' +
                                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                    backdrop: 'static',
                                    keyboard: false,
                                    controller: function ($scope, $uibModalInstance) {
                                        $scope.ok = function () {
                                            $uibModalInstance.dismiss();
                                        };
                                    },
                                    size: 'sm'
                                });
                                callback(false);
                            } else callback(true);
                        } else callback(true);
                    } else callback(true);
                } else callback(true);
            };
            $scope.matchingResValue = function (value, callback) {
                if (value !== "") {
                    var prop = this.prop; var hasError = false; var which;
                    if (prop = "ResourceStrings") {
                        var resArray = value.split(",");
                        var resArrayTrimmed = [];
                        angular.forEach(resArray, function (r) { resArrayTrimmed.push(r.trim()); });
                        for (var r = 0; r < resArrayTrimmed.length; r++) {
                            //if this one isn't in the Resources, callback(false)
                            if ($scope.resources.map(function (res) { return res.resource_name; }).indexOf(resArrayTrimmed[r]) < 0) {
                                hasError = true; which = resArrayTrimmed[r];
                                r = resArrayTrimmed.length;
                            }
                        }
                        if (hasError) {
                            var FreqModal = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>Resource Type <b>"{{wrong}}"</b> is not in the list of options. Please delete the text and click the down arrow in the lower right corner of the ' +
                                    'cell to open the modal. Choose the appropriate Resource types by selecting the checkboxes.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                backdrop: 'static',
                                keyboard: false,
                                resolve: { thisOne: function () { return which; } },
                                controller: function ($scope, $uibModalInstance, thisOne) {
                                    $scope.wrong = thisOne;
                                    $scope.ok = function () {
                                        $uibModalInstance.dismiss();
                                    };
                                },
                                size: 'md'
                            });
                            callback(false);
                        }
                        else callback(true);
                    } else
                        callback(true);
                } else callback(true);
            };
            $scope.matchingMedValue = function (value, callback) {
                if (value !== "") {
                    var prop = this.prop; var hasError = false; var which;
                    if (prop = "MediaStrings") {
                        var medArray = value.split(",");
                        var medArrayTr = [];
                        angular.forEach(medArray, function (m) { medArrayTr.push(m.trim()); });
                        for (var m = 0; m < medArrayTr.length; m++) {
                            //if this one isn't in the Resources, callback(false)
                            if ($scope.medias.map(function (med) { return med.media; }).indexOf(medArrayTr[m]) < 0) {
                                hasError = true; which = medArrayTr[m];
                                m = medArrayTr.length;
                            }
                        }
                        if (hasError) {
                            var MedModal = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>Media Type <b>"{{wrong}}"</b> is not in the list of options. Please delete the text and click the down arrow in the lower right corner of the ' +
                                    'cell to open the modal. Choose the appropriate Media types by selecting the checkboxes.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                backdrop: 'static',
                                keyboard: false,
                                resolve: { thisOne: function () { return which; } },
                                controller: function ($scope, $uibModalInstance, thisOne) {
                                    $scope.wrong = thisOne;
                                    $scope.ok = function () {
                                        $uibModalInstance.dismiss();
                                    };
                                },
                                size: 'md'
                            });
                            callback(false);
                        }
                        else callback(true);
                    } else callback(true);
                } else callback(true);
            };
            $scope.matchingFreqValue = function (value, callback) {
                if (value !== "") {
                    var prop = this.prop; var hasError = false; var which;
                    if (prop = "FrequencyStrings") {
                        var freqArray = value.split(",");
                        var freqArrayTrimmed = [];
                        angular.forEach(freqArray, function (f) { freqArrayTrimmed.push(f.trim()); });
                        for (var f = 0; f < freqArrayTrimmed.length; f++) {
                            //if this one isn't in the Resources, callback(false)
                            if ($scope.frequencies.map(function (fre) { return fre.frequency; }).indexOf(freqArrayTrimmed[f]) < 0) {
                                hasError = true; which = freqArrayTrimmed[f];
                                f = freqArrayTrimmed.length;
                            }
                        }
                        if (hasError) {
                            var FreqModal = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>Frequency Type <b>"{{wrong}}"</b> is not in the list of options. Please delete the text and click the down arrow in the lower right corner of the ' +
                                    'cell to open the modal. Choose the appropriate Frequency types by selecting the checkboxes.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                backdrop: 'static',
                                keyboard: false,
                                resolve: { thisOne: function () { return which; } },
                                controller: function ($scope, $uibModalInstance, thisOne) {
                                    $scope.wrong = thisOne;
                                    $scope.ok = function () {
                                        $uibModalInstance.dismiss();
                                    };
                                },
                                size: 'md'
                            });
                            callback(false);
                        }
                        else callback(true);
                    } else
                        callback(true);
                } else callback(true);
            };
            //#endregion

            //#region handsontable settings
            $scope.tableSettings = {
                colHeaders: true,
                rowHeaders: true,
                contextMenu: ['row_above', 'row_below', 'remove_row'],
                minSpareRows: 3,
                afterInit: function () {
                    $scope.hotInstance = this;                  
                },               
                fixedColumnsLeft: 2,
                manualColumnResize: true,
                manualRowResize: true,
                wordWrap: false,                
                viewportColumnRenderingOffsetNumber: 1,
                colWidths: $scope.columnWidths,
                cells: function (row, col, prop) {
                    //physical, chemical,biological, microbio, tox
                    if ([0,19,46,65,82,87].indexOf(col) > -1){
                        var cellprops = {};
                        cellprops.renderer = colorRenderer;
                        return cellprops;
                    }
                },
                //afterCreateRow: function (index, amount){},
                afterOnCellMouseDown: function (event,coords,td){
                    if (coords.col == 11 && event.realTarget.className == "htAutocompleteArrow") 
                        getMultiModal(coords.col, coords.row, "Resources");
                    if (coords.col == 12 && event.realTarget.className == "htAutocompleteArrow") 
                        getMultiModal(coords.col, coords.row, "Media");
                    if (coords.col == 13 && event.realTarget.className == "htAutocompleteArrow")
                        getMultiModal(coords.col, coords.row, "Frequencies");                    
                },//end afterOnCellMouseDown                
                onAfterChange: function (change, source) {
                    //change is an array containing arrays for each column affected: [0] = row, [1] = dataName, [2] = value it was, [3] = value it is 
                    //source is string : "alter', "empty', "edit', "populateFromArray', "loadData', "autofill', "paste".              
                    if (source != 'loadData') {
                        for (var i = 0; i < change.length; i++) {
                            //only care if it was actually changed
                            if (change[i][2] !== change[i][3]) $scope.Changes.push(change[i]);
                            if (change[i][2] === "." || change[i][2] == "x") $scope.ParamChanges.push(change[i]);
                            //if dates, store it
                            if (change[i][1] === "StartDate" && change[i][2] !== "") $scope.startDateHolder = change[i];
                            if (change[i][1] === "EndDate" && change[i][2] !== "") $scope.endDateHolder = change[i];
                        }
                    }
                },
                onAfterValidate: function (isValid, value, row, prop, souce) {
                    if (!isValid)
                        $scope.invalids.push({ "isValid": isValid, "row": row, "prop": prop });
                    if (isValid) {
                        var vIndex = -1;
                        for (var vI = 0; vI < $scope.invalids.length; vI++) {
                            if ($scope.invalids[vI].row == row && $scope.invalids[vI].prop == prop) {
                                vIndex = vI;
                                break;
                            }
                        }
                        if (vIndex > -1)
                            $scope.invalids.splice(vIndex, 1);
                    }
                },
                rowHeights: 50
            };
        //#endregion

        }]);
})();