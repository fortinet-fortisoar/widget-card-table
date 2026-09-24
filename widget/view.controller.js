/* Copyright start
  MIT License
  Copyright (c) 2026 Fortinet Inc
  Copyright end */
'use strict';

(function () {
  angular
    .module('cybersponse')
    .controller('cardTable101Ctrl', cardTable101Ctrl);

  cardTable101Ctrl.$inject = ['$scope', 'config', '$state', '$filter', 'currentPermissionsService',
    'Query', 'Entity', 'localStorageService', 'chartFilter', 'API', '$resource',
    'CommonUtils', '_', '$interpolate', '$rootScope', '$q', '$timeout', 'compressionService'
  ];

  function cardTable101Ctrl($scope, config, $state, $filter, currentPermissionsService,
    Query, Entity, localStorageService, chartFilter, API, $resource, CommonUtils, _, $interpolate, $rootScope, $q, $timeout, compressionService) {

    var entity = null;
    $scope.assignedFieldName = '';
    var _config = angular.copy(config);
    $scope.filterByAssignedToPerson = false;
    config.assignedToSetting = config.assignedToSetting || 'onlyMe';
    $scope.filterByMe = config.assignedToSetting === 'onlyMe';
    if ($state.params) {
      $scope.page = $state.params.page;
    }
    $scope.collapsed = (angular.isDefined(config.widgetAlwaysExpanded) && config.widgetAlwaysExpanded) ? !config.widgetAlwaysExpanded : ($scope.page !== undefined && $scope.page.toLowerCase() !== 'dashboard' && $scope.page.toLowerCase() !== 'reporting');

    function _init() {
      $scope.actions = {
        onView: onView
      };

      var canRead = currentPermissionsService.availablePermission(_config.resource, 'read');
      if (!canRead) {
        $scope.unauthorized = true;
        return;
      }

      if (entity) {
        var assignedToPerson = config.mapping.assignedToPerson;
        if (!angular.isUndefined(assignedToPerson) && !angular.isUndefined(entity.fields[assignedToPerson])) {
          $scope.filterByAssignedToPerson = true;
          $scope.assignedFieldName = entity.fields[assignedToPerson].title;
        }
      }

      $scope.getList();
    }

    $scope.toggleAssigendAction = function (flag) {
      $scope.filterByMe = flag;
      $scope.getList();
    };

    var setFilter = function () {
      _config = angular.copy(config);
      var selfFilter = '';
      if ($scope.filterByAssignedToPerson && $scope.filterByMe) {
        selfFilter = {
          field: config.mapping.assignedToPerson,
          operator: 'eq',
          value: localStorageService.get(API.API_3_BASE + API.CURRENT_ACTOR)
        };
      }
      if (config.query.logic === 'OR') {
        _config.query.logic = 'AND';
        _config.query.filters = [];
        if (selfFilter !== '') {
          _config.query.filters.push(selfFilter);
        }
        _config.query.filters.push({
          logic: config.query.logic,
          filters: config.query.filters
        });
      }
      else {
        if (selfFilter !== '') {
          _config.query.filters.push(selfFilter);
        }
      }
    };

    $scope.getList = function () {
      setFilter();
      $scope.processing = true;
      var query = new Query(_config.query);

      if (entity) {
        $resource(API.QUERY + _config.resource).save(query.getQueryModifiers(), query.getQuery(true)).$promise.then(function (result) {
          _buildListData(result).then(function (records) {
            $scope.fieldRows = records;
            $scope.processing = false;
          });
        }, angular.noop).finally(function () {
          $scope.processing = false;
        });
      }
    };

    function _buildListData(result) {
      var defer = $q.defer();
      var resultFieldRows = result['hydra:member'];
      angular.forEach(resultFieldRows, function (fieldRow) {
        fieldRow.displayValue = fieldRow[_config.mapping.fieldName];
      });
      var field = entity.fields[_config.mapping.fieldName];
      if (!CommonUtils.isUndefined(field)) {
        if (field.type === 'lookup') {
          _config.mapping.displayValues = CommonUtils.getDisplayTemplateKey(field.displayTemplate);
          if (_config.mapping.displayValues && _config.mapping.displayValues.length > 0) {
            angular.forEach(resultFieldRows, function (fieldRow) {
              var resultValue = '';
              angular.forEach(_config.mapping.displayValues, function (displayValue) {
                resultValue = resultValue + (resultValue.length > 0 ? ' ' : '') + (fieldRow[displayValue] || '');
              });
              fieldRow.displayValue = resultValue.length > 0 ? resultValue : 'None';
              fieldRow[_config.mapping.fieldName] = fieldRow.uuid;
            });
          }
        }
        else if (field.type === 'datetime') {
          var fieldRows = angular.copy(resultFieldRows);
          resultFieldRows = [];
          angular.forEach(fieldRows, function (fieldRow) {
            fieldRow.displayValue = fieldRow[_config.mapping.fieldName] ? $filter('date')($filter('unixToDate')(fieldRow[_config.mapping.fieldName]), 'MM/dd/yyyy') : 'None';
            var dateExist = _.find(resultFieldRows, function (fRow) {
              return fRow === fieldRow.displayValue;
            });
            if(!dateExist) {
              resultFieldRows.push(fieldRow.displayValue);
            }else {
              var existRow = _.find(fieldRows, function (fRow) {
                return fRow.displayValue === fieldRow.displayValue;
              });
              if (existRow) {
                existRow.total += fieldRow.total;
              } else {
                fieldRows.push(angular.copy(fieldRow));
              }
            }
          });
          let oldResult = angular.copy(fieldRows);
          fieldRows = [];
          angular.forEach(resultFieldRows, function(date) {
            fieldRows.push(_.find(oldResult, function(result) {
              return result.displayValue === date; 
            }));
          });
          resultFieldRows = fieldRows;
        }
      }
      defer.resolve(resultFieldRows);
      return defer.promise;
    }

    function onView(record) {
      var query = angular.copy(_config.query);
      chartFilter.getFilter(_config.mapping.fieldName, record[_config.mapping.fieldName], entity, record).then(function (filter) {
        query.filters = query.filters.concat(filter);
        var widgetQuery = new Query();
        widgetQuery.widgetQuery = { filters: _minify(query.filters), logic: query.logic };
        $state.go('main.modules.list', {
          module: config.resource,
          query: compressionService.compressForUrl(widgetQuery),
          qparam: $state.params.qparam,
          widgetParams: true
        });
      });
    }

    function _minify(qFilters) {
      var filters = [];
      qFilters.forEach(function (filter) {
        var cFilter = angular.copy(filter);
        if (!angular.isUndefined(filter.logic) && filter.logic.length > 0) {
          cFilter.filters = _minify(filter.filters);
        }
        else if (angular.isArray(filter.value)) {
          cFilter.value = [];
          filter.value.forEach(function (fValue) {
            cFilter.value.push(_objectCopy(fValue));
          });
        }
        else if (angular.isObject(filter.value)) {
          cFilter.value = _objectCopy(filter.value);
          if (filter.value.displayName) {
            cFilter.display = filter.value.displayName;
          } else if(!angular.isUndefined(filter.displayTemplate)) {
            cFilter.display = $interpolate(filter.displayTemplate)(filter.value);
            if (cFilter.display) {
              delete cFilter.displayTemplate;
            }
          }
        }
        else if (filter._value) {
          if (filter._value.display) {
            cFilter.display = filter._value.display;
          }
          if (filter._value.itemValue) {
            cFilter.itemValue = filter._value.itemValue;
            cFilter.display = filter._value.itemValue;
          }
        }
        filters.push(cFilter);
      });
      return filters;
    }

    function _objectCopy(filterValue) {
      var returnValue = filterValue['@id'] ? { '@id': filterValue['@id'], '@type': filterValue['@type'], itemValue: filterValue.itemValue, id: filterValue.id } : filterValue;
      return returnValue;
    }

    entity = new Entity(config.resource);
    if (entity) {
      entity.loadFields().then(function () {
        _init();
      });
    }

    $scope.searchFilter = function (record) {
      if (!$scope.searchText) { return true; }

      var value = record.displayValue || 'None';

      return value.toLowerCase().indexOf($scope.searchText.toLowerCase()) !== -1;
    };

    $scope.focusSearchField = function(){
      $timeout(function (){
        document.querySelector('#search-'+$scope.config.wid).focus();
      }, 0);
    };

  }
})();
