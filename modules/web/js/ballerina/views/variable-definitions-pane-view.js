/**
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import _ from 'lodash';
import log from 'log';
import $ from 'jquery';
import Alerts from 'alerts';
import VariableDefinitionView from './variable-definition-view';
import ASTNode from './../ast/node';

/**
 * Creates a new instance for a constant definition pane view.
 * @class VariableDeclarationsPaneView
 */
class VariableDeclarationsPaneView {

    /**
     * Constructor for VariableDeclarationsPaneView
     * @param args - Arguments for creating the constant definitions pane.
     * @param {ServiceDefinition} args.model - The Ballerina AST root model.
     * @param {HTMLElement} args.paneAppendElement - The element to which the pane to be appended.
     * @param {BallerinaFileEditor} args.view - The ballerina filed editor view.
     * @constructor
     */
    constructor(args) {
        this._model = _.get(args, 'model');
        this._paneAppendElement = _.get(args, 'paneAppendElement');
        this._viewOfModel = _.get(args, 'viewOfModel');
        this._viewOptions = _.get(args, 'viewOptions');

        this._constantDefinitionsButton = undefined;
        this._constantsDefinitionsMainWrapper = undefined;
        this._minHeight = 23;
    }

    createVariablePane() {

        var self = this;

        // Creating variable button.
        var variableButton = $('<div class=\'variable-btn\' data-toggle=\'tooltip\' title=\'Variables\' ' +
            'data-placement=\'bottom\'></div>')
            .appendTo(this._paneAppendElement).tooltip();

        // Positioning the variable button.
        variableButton.css('left', parseInt(this._viewOptions.position.x) + 'px');
        variableButton.css('top', parseInt(this._viewOptions.position.y) + 'px');

        $('<span class=\'btn-icon\'> Variables </span>').appendTo(variableButton);

        var variablePaneWrapper = $('<div class=\'variable-pane\'/>').appendTo($(this._paneAppendElement));
        // Positioning the variable pane from the left border of the container(service, resource, etc).
        variablePaneWrapper.css('left', (this._viewOptions.position.x + 69) + 'px');
        // Positioning the variable pane from the top border of the container(service, resource, etc).
        variablePaneWrapper.css('top', (this._viewOptions.position.y - 0) + 'px');
        // Setting max-width of the variable wrapper.
        variablePaneWrapper.css('max-width', this._viewOptions.width + 'px');

        var variablesContentWrapper = $('<div class=\'variables-content-wrapper\'/>').appendTo(variablePaneWrapper);

        var collapserWrapper = $('<div class=\'variable-pane-collapser-wrapper\'/>')
            .data('collapsed', 'true')
            .appendTo(variablePaneWrapper);
        $('<i class=\'fw fw-left\'></i>').appendTo(collapserWrapper);

        var variablesActionWrapper = $('<div class=\'variables-action-wrapper\'/>').appendTo(variablesContentWrapper);

        // Creating add variable editor button.
        var addVariableButton = $('<div class=\'action-icon-wrapper variable-add-icon-wrapper\' ' +
            'data-toggle=\'tooltip\' title=\'Add variable\' data-placement=\'bottom\'/>')
            .appendTo(variablesActionWrapper).tooltip();
        $('<i class=\'fw fw-add\'></i>').appendTo(addVariableButton);

        var variableAddPane = $('<div class=\'action-content-wrapper-heading variable-add-action-wrapper\'/>')
            .appendTo(variablesActionWrapper);

        // Creating the variable type dropdown.
        var typeDropdownWrapper = $('<div class="type-drop-wrapper service"/>').appendTo(variableAddPane);
        var variableSelect = $('<select/>').appendTo(typeDropdownWrapper);

        var variableIdentifier = $('<input id=\'text\' placeholder=\'Identifier\'/>').appendTo(variableAddPane);
        var variableValueExpression = $('<input id=\'text\' placeholder=\'Value\'/>').appendTo(variableAddPane);

        $(variableSelect).select2({
            data: this._getTypeDropdownValues(),
            tags: true,
            selectOnClose: true
        });

        $(document).ready(function() {
            $(typeDropdownWrapper).empty();
            variableSelect = $('<select/>').appendTo(typeDropdownWrapper);
            $(variableSelect).select2({
                tags: true,
                selectOnClose: true,
                data : self._getTypeDropdownValues(),
                query: function (query) {
                    var data = {results: []};
                    if (!_.isNil(query.term)) {
                        _.forEach(self._getTypeDropdownValues(), function (item) {
                            if (item.text.toUpperCase().indexOf(query.term.toUpperCase()) >= 0) {
                                data.results.push(item);
                            }
                        });
                        // Adding user typed string when there is no any matching item in the list
                        if(data.results.length == 0){
                            data.results.push({id: query.term, text: query.term});
                        }
                    } else {
                        data.results = self._getTypeDropdownValues();
                    }
                    query.callback(data);
                }
            });

            $(variableSelect).on('select2:open', function() {
                $('.select2-search__field').attr('placeholder', 'Search');
            });
        });


        // Add new variable upon enter key.
        $(variableIdentifier).on('change paste keydown', function (e) {
            if (_.isEqual(e.which, 13)) {
                variableAddCompleteButtonPane.click();
            }
        }).keypress(function (e) {
            var enteredKey = e.which || e.charCode || e.keyCode;

            // Disabling enter key
            if (_.isEqual(enteredKey, 13)) {
                e.stopPropagation();
                return false;
            }

            var newIdentifier = $(this).val() + String.fromCharCode(enteredKey);

            // Validation the identifier against grammar.
            if (!ASTNode.isValidIdentifier(newIdentifier)) {
                var errorString = 'Invalid identifier for a variable: ' + newIdentifier;
                log.error(errorString);
                Alerts.error(errorString);
                e.stopPropagation();
                return false;
            }
        });

        // Add new variable upon enter key.
        $(variableValueExpression).on('change paste keydown', function (e) {
            if (e.which === 13) {
                variableAddCompleteButtonPane.click();
            }
        });

        // Creating cancelling add new variable button.
        var variableAddCancelButtonPane = $('<div class=\'action-icon-wrapper variable-add-cancel-action-wrapper\'/>')
            .appendTo(variableAddPane);
        $('<span class=\'fw-stack fw-lg\'><i class=\'fw fw-square fw-stack-2x\'></i>' +
            '<i class=\'fw fw-cancel fw-stack-1x fw-inverse\'></i></span>').appendTo(variableAddCancelButtonPane);
        // Creating add new variable button.
        var variableAddCompleteButtonPane = $('<div class=\'action-icon-wrapper ' +
            'variable-add-complete-action-wrapper\'/>').appendTo(variableAddPane);
        $('<span class=\'fw-stack fw-lg\'><i class=\'fw fw-square fw-stack-2x\'></i>' +
            '<i class=\'fw fw-check fw-stack-1x fw-inverse\'></i></span>').appendTo(variableAddCompleteButtonPane);

        // Add new variable activate button.
        $(addVariableButton).click(function () {
            $(variableAddPane).show();
            $(this).hide();
            $(variableIdentifier).focus();
        });

        // Cancel adding a new variable.
        $(variableAddCancelButtonPane).click(function () {
            $(variableAddPane).hide();
            $(addVariableButton).show();
        });

        // Rendering the variables
        this._renderVariables(variablesContentWrapper, collapserWrapper);

        // When a new variable is created.
        $(variableAddCompleteButtonPane).click(function () {
            var typeOfNewVariable = variableSelect.val();
            var identifierOfNewVariable = variableIdentifier.val().trim();
            var valueOfNewVariable = variableValueExpression.val().trim();

            try {
                self._model.addVariableDefinitionStatement(typeOfNewVariable, identifierOfNewVariable,
                    valueOfNewVariable);
                var oldWrapperSize = $(variablesContentWrapper).height();

                // Recreating the arguments details view.
                self._renderVariables(variablesContentWrapper, collapserWrapper);

                // Changing the content of the collapser.
                collapserWrapper.empty();
                collapserWrapper.data('collapsed', 'false');
                $('<i class=\'fw fw-left\'></i>').appendTo(collapserWrapper);
                variablesContentWrapper.show();

                // Clearing values in inputs.
                variableIdentifier.val('');
                variableValueExpression.val('');

                // Trigger the event to inform that a new variable has been added and the height of the variable pane
                // has been changed
                $(variablesContentWrapper).trigger('contentWrapperShown', $(variablesContentWrapper).height() - oldWrapperSize);
            } catch (error) {
                log.error(error);
                Alerts.error(error);
            }
        });

        // Hiding/showing the variables depending on the default "collapsed" value of collapserWrapper.
        if (_.isEqual(collapserWrapper.data('collapsed'), 'false')) {
            $(collapserWrapper).empty();
            $('<i class=\'fw fw-left\'></i>').appendTo(collapserWrapper);
            variablesContentWrapper.find('.variable-wrapper').show();
            var dh = $(variablesContentWrapper).height() !== this._minHeight ?
                $(variablesContentWrapper).height() - this._minHeight : 0;
            $(variablePaneWrapper).trigger('contentWrapperShown', dh);
        } else {
            $(collapserWrapper).empty();
            $('<i class=\'fw fw-right\'></i>').appendTo(collapserWrapper);
            variablesContentWrapper.find('.variable-wrapper').hide();
            var height = $(variablesContentWrapper).height();
            $(variablePaneWrapper).trigger('contentWrapperHidden', height);
        }

        // The click event for hiding and showing variables.
        collapserWrapper.click(function () {
            $(this).empty();
            if ($(this).data('collapsed') === 'false') {
                $(this).data('collapsed', 'true');
                $('<i class=\'fw fw-right\'></i>').appendTo(this);
                variablesContentWrapper.find('.variable-wrapper').hide();
                $(variablesContentWrapper).trigger('contentWrapperHidden');
            } else {
                $(this).data('collapsed', 'false');
                $('<i class=\'fw fw-left\'></i>').appendTo(this);
                variablesContentWrapper.find('.variable-wrapper').show();
                var dh = $(variablesContentWrapper).height() !== self._minHeight ?
                    $(variablesContentWrapper).height() - self._minHeight : 0;
                $(variablesContentWrapper).trigger('contentWrapperShown', dh);
            }
        });

        // By default the variable pane is shown on pane load.
        $(variableButton).css('opacity', 1);

        // When the variable button is clicked we show and hide the variable pane.
        $(variableButton).click(function () {
            if ($(variablePaneWrapper).is(':visible')) {
                // Variable pane is already shown.
                $(this).css({opacity: ''});
                variablePaneWrapper.hide();

            } else {
                // Variable pane is hidden.
                $(this).css('opacity', 1);
                variablePaneWrapper.show();
            }
        });

        // Stop propagating event to elements behind. This is needed for closing the wrapper when clicked outside.
        variablePaneWrapper.click(function (event) {
            event.stopPropagation();
        });

        return variablePaneWrapper;
    }

    /**
     * Rendering the variables belonging to a model.
     * @param {HTMLDivElement} variablePaneWrapper - The wrapper to which the variables should be appended to.
     * @param {HTMLDivElement} collapserWrapper - The collpasing icon.
     * @private
     */
    _renderVariables(variablePaneWrapper, collapserWrapper) {
        // Clear existing variables on UI.
        $(variablePaneWrapper).find('.variable-wrapper').remove();

        var self = this;

        _.forEach(this._model.getVariableDefinitionStatements(), function (variableDeclaration) {

            var variableDefinitionStatementView = new VariableDefinitionView({
                parent: self._model,
                model: variableDeclaration,
                container: variablePaneWrapper,
                toolPalette: self._viewOfModel.getToolPalette(),
                messageManager: self._viewOfModel.getMessageManager(),
                parentView: self._viewOfModel
            });

            self._viewOfModel.getDiagramRenderingContext().getViewModelMap()[variableDeclaration.id] = variableDefinitionStatementView;

            variableDefinitionStatementView.render(self._viewOfModel.getDiagramRenderingContext());

            $(variableDefinitionStatementView.getDeleteButton()).click(() => {
                var oldWrapperSize = $('.variables-content-wrapper').height();
                variableDefinitionStatementView.removeVariableDefinition();
                self._renderVariables(variablePaneWrapper, collapserWrapper);
                $('.variables-content-wrapper').trigger('contentWrapperShown', $('.variables-content-wrapper').height() - oldWrapperSize);
            });
        });
    }

    /**
     * Returns an object array with support types.
     * @return {Object[]} Object array as supported data types.
     */
    _getTypeDropdownValues() {
        var dropdownData = [];
        // Adding items to the type dropdown.
        var bTypes = this._viewOfModel.getDiagramRenderingContext().getEnvironment().getTypes();
        _.forEach(bTypes, function (bType) {
            dropdownData.push({id: bType, text: bType});
        });

        return dropdownData;
    }
}

VariableDeclarationsPaneView.prototype.constructor = VariableDeclarationsPaneView;

export default VariableDeclarationsPaneView;
