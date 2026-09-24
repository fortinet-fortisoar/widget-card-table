/* Copyright start
  MIT License
  Copyright (c) 2026 Fortinet Inc
  Copyright end */
'use strict';

(function() {
  angular
    .module('cybersponse')
    .controller('editCardTable101Ctrl', editCardTable101Ctrl);

  editCardTable101Ctrl.$inject = ['$scope', '$uibModalInstance', 'config', 'appModulesService', 'Entity', 'CommonUtils', '_', '$state', 'translationService'];

  function editCardTable101Ctrl($scope, $uibModalInstance, config, appModulesService, Entity, CommonUtils, _, $state, translationService) {

    $scope.userField = [];
    $scope.cancel = cancel;
    $scope.save = save;
    $scope.getFieldCount = getFieldCount;
    $scope.isDefined = angular.isDefined;
    $scope.page = $state.params.page;
    var _config = {};
    $scope.config = {};
    var _init = function() {
      appModulesService.load(true).then(function(modules) {
        $scope.modules = modules;
      });
      $scope.pageConfig = {
        maxRecordSize: [5, 10, 20, 30, 40, 50,100,250]
      };
      _config = {
        query: {
          filters: [],
          limit: 10,
          logic: 'AND',
          sort: []
        },
        mapping: {
          assignedToPerson: null,
        },
        aggregate: true,
        assignedToSetting: 'onlyMe',
        widgetAlwaysExpanded: true
      };
      $scope.aggregateDefinitions = {
        model: {
          aggregateOperator: 'groupby',
          mappingFields: [{
            name: 'fieldName',
            title: translationService.instantTranslate('COMPONENTS.VIEW_TEMPLATES.WIDGETS.LISTS.GROUP_BY'),
            limitType: 'picklist'
          }],
          defaultAggregates: [{
            operator: 'countdistinct',
            field: '*',
            alias: 'total'
          }]
        }
      };
      angular.extend($scope.config, _config, config);
      $scope.header = translationService.instantTranslate($scope.config.title ? 'COMPONENTS.VIEW_TEMPLATES.WIDGETS.LISTS.EDIT_CARD_TABLE_WIDGET' : 'COMPONENTS.VIEW_TEMPLATES.WIDGETS.LISTS.ADD_CARD_TABLE_WIDGET');
      $scope.loadAttributes(true);
    };

    $scope.loadAttributes = function(initalized) {
      if (angular.isUndefined(initalized) || initalized === false) {
        angular.extend($scope.config, _config);
        $scope.config.mapping[$scope.aggregateDefinitions.model.mappingFields[0].name] = '';
      }
      var entity = new Entity($scope.config.resource);
      $scope.userField = [];
      entity.loadFields().then(function() {
        for (var key in entity.fields) {
          if (entity.fields[key].type === 'datetime') {
            entity.fields[key].type = 'datetime.quick';
          } else if (entity.fields[key].model === 'teams' || (entity.fields[key].model === 'people' && entity.fields[key].type !== 'manyToMany') || entity.fields[key].model === 'actors') {
            $scope.userField.push(entity.fields[key]);
          }
        }
        $scope.fields = entity.getFormFields();
        angular.extend($scope.fields, entity.getRelationshipFields());
        var fieldsArray = _.filter(entity.getFormFieldsArray(), function(field) {
          return field.model !== 'actors';
        });
        $scope.fieldsArray = fieldsArray;
      });
    };

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }

    $scope.groupByFilter = function(item){
      if(item.type === 'picklist' || item.type === 'lookup' || item.type === 'text' || item.type === 'datetime.quick' || item.type === 'datetime' || item.type === 'checkbox' || item.type === 'integer' || item.type === 'email' || item.type === 'tags'){
        return item;
      }
    };

    function save() {
      if ($scope.cardCountForm.$invalid) {
        $scope.cardCountForm.$setTouched();
        $scope.cardCountForm.$focusOnFirstError();
        return;
      }

      adjustQuery();
      $uibModalInstance.close($scope.config);
    }

    // TODO Make this function better in the future.
    // Put in a provider and service?
    function adjustQuery() {
      var chartDefinition = $scope.aggregateDefinitions.model;
      $scope.config.query.aggregates = chartDefinition.defaultAggregates ? angular.copy(chartDefinition.defaultAggregates) : [];
      $scope.config.query.sort = [];

      var mappingField = angular.copy(chartDefinition.mappingFields[0]);
      var fieldName = $scope.config.mapping[mappingField.name];

      for(var fieldIndex = 0 ; fieldIndex < $scope.fieldsArray.length; fieldIndex++){
        var field = $scope.fieldsArray[fieldIndex];
        var fieldType = field.originalType || field.type;
        if(field.name === fieldName){
          mappingField.limitType = fieldType;
          mappingField.displayTemplate = field.displayTemplate;
          mappingField.model = field.model;
          break;
        }
      }
      setDefaultAggregate(fieldName, mappingField, chartDefinition);
    }

    function setDefaultAggregate(fieldName, mappingField, chartDefinition) {
      var aggregateNodeTemplate = {
        operator: chartDefinition.aggregateOperator,
        alias: chartDefinition.type === 'area' ? mappingField.name : fieldName
      };
      $scope.config.query.sort = [];
      if (mappingField.limitType === 'picklist') {
        var itemValueAggregate = angular.copy(aggregateNodeTemplate);
        itemValueAggregate.field = fieldName + '.itemValue';
        $scope.config.query.aggregates.push(itemValueAggregate);

        var colorAggregate = angular.copy(aggregateNodeTemplate);
        colorAggregate.field = fieldName + '.color';
        colorAggregate.alias = 'color';
        $scope.config.query.aggregates.push(colorAggregate);

        var orderIndexAggregate = angular.copy(aggregateNodeTemplate);
        orderIndexAggregate.field = fieldName + '.orderIndex';
        orderIndexAggregate.alias = 'orderIndex';
        $scope.config.query.aggregates.push(orderIndexAggregate);

        $scope.config.query.sort.push({
          field: orderIndexAggregate.field,
          direction: 'ASC'
        });
      } else if(mappingField.limitType === 'lookup'){
        var uuidAggregate = angular.copy(aggregateNodeTemplate);
        uuidAggregate.field = fieldName+'.uuid';
        uuidAggregate.alias = 'uuid';
        $scope.config.query.aggregates.push(uuidAggregate);
        var values = CommonUtils.getDisplayTemplateKey(mappingField.displayTemplate);
        $scope.config.mapping.displayValues = values;
        angular.forEach(values, function(val){
          var lookupAggregate = angular.copy(aggregateNodeTemplate);
          lookupAggregate.field = fieldName+'.'+val;
          lookupAggregate.alias = val;
          $scope.config.query.aggregates.push(lookupAggregate);
          $scope.config.query.sort.push({
            field: lookupAggregate.field,
            direction: 'ASC'
          });
        });
      } else{
        if(fieldName === 'recordTags') {
          fieldName = fieldName+ '.uuid';
        }
        var otherAggregate = angular.copy(aggregateNodeTemplate);
        otherAggregate.field = fieldName;
        delete $scope.config.mapping.displayValues;
        $scope.config.query.aggregates.push(otherAggregate);
        $scope.config.query.sort.push({
          field: otherAggregate.field,
          direction: 'ASC'
        });
      }
    }

    function isFieldNotInMapping(field, fieldName) {
      var currentMappings = angular.copy($scope.config.mapping);
      if (!currentMappings) {
        return true;
      }
      delete currentMappings[fieldName];
      var values = _.values(currentMappings);
      return values.indexOf(field.name) < 0;
    }

    function getFieldCount(fieldsArray, mappingField) {
      var countingFields = [];
      fieldsArray.forEach(function(field) {
        if (field.type === mappingField.limitType && isFieldNotInMapping(field, mappingField.name)) {
          countingFields.push(field);
        }
      });

      return countingFields.length;
    }

    _init();
  }
})();
