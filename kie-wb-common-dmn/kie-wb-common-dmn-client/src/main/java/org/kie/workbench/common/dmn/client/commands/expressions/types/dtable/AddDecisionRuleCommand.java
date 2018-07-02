/*
 * Copyright 2017 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.kie.workbench.common.dmn.client.commands.expressions.types.dtable;

import java.util.stream.IntStream;

import org.kie.workbench.common.dmn.api.definition.v1_1.DecisionRule;
import org.kie.workbench.common.dmn.api.definition.v1_1.DecisionTable;
import org.kie.workbench.common.dmn.api.definition.v1_1.LiteralExpression;
import org.kie.workbench.common.dmn.api.definition.v1_1.UnaryTests;
import org.kie.workbench.common.dmn.api.property.dmn.Description;
import org.kie.workbench.common.dmn.client.commands.VetoExecutionCommand;
import org.kie.workbench.common.dmn.client.commands.VetoUndoCommand;
import org.kie.workbench.common.dmn.client.commands.util.CommandUtils;
import org.kie.workbench.common.dmn.client.editors.expressions.types.dtable.DecisionTableDefaultValueUtilities;
import org.kie.workbench.common.dmn.client.editors.expressions.types.dtable.DecisionTableUIModelMapper;
import org.kie.workbench.common.dmn.client.widgets.grid.model.DMNGridRow;
import org.kie.workbench.common.stunner.core.client.canvas.AbstractCanvasHandler;
import org.kie.workbench.common.stunner.core.client.canvas.command.AbstractCanvasCommand;
import org.kie.workbench.common.stunner.core.client.canvas.command.AbstractCanvasGraphCommand;
import org.kie.workbench.common.stunner.core.client.command.CanvasCommandResultBuilder;
import org.kie.workbench.common.stunner.core.client.command.CanvasViolation;
import org.kie.workbench.common.stunner.core.command.Command;
import org.kie.workbench.common.stunner.core.command.CommandResult;
import org.kie.workbench.common.stunner.core.graph.command.GraphCommandExecutionContext;
import org.kie.workbench.common.stunner.core.graph.command.GraphCommandResultBuilder;
import org.kie.workbench.common.stunner.core.graph.command.impl.AbstractGraphCommand;
import org.kie.workbench.common.stunner.core.rule.RuleViolation;
import org.uberfire.ext.wires.core.grids.client.model.GridData;

public class AddDecisionRuleCommand extends AbstractCanvasGraphCommand implements VetoExecutionCommand,
                                                                                  VetoUndoCommand {

    private final DecisionTable dtable;
    private final DecisionRule rule;
    private final GridData uiModel;
    private final DMNGridRow uiModelRow;
    private final int uiRowIndex;
    private final DecisionTableUIModelMapper uiModelMapper;
    private final org.uberfire.mvp.Command canvasOperation;

    public AddDecisionRuleCommand(final DecisionTable dtable,
                                  final DecisionRule rule,
                                  final GridData uiModel,
                                  final DMNGridRow uiModelRow,
                                  final int uiRowIndex,
                                  final DecisionTableUIModelMapper uiModelMapper,
                                  final org.uberfire.mvp.Command canvasOperation) {
        this.dtable = dtable;
        this.rule = rule;
        this.uiModel = uiModel;
        this.uiModelRow = uiModelRow;
        this.uiRowIndex = uiRowIndex;
        this.uiModelMapper = uiModelMapper;
        this.canvasOperation = canvasOperation;
    }

    @Override
    protected Command<GraphCommandExecutionContext, RuleViolation> newGraphCommand(final AbstractCanvasHandler context) {
        return new AbstractGraphCommand() {
            @Override
            protected CommandResult<RuleViolation> check(final GraphCommandExecutionContext context) {
                return GraphCommandResultBuilder.SUCCESS;
            }

            @Override
            public CommandResult<RuleViolation> execute(final GraphCommandExecutionContext context) {
                dtable.getRule().add(uiRowIndex,
                                     rule);

                for (int ie = 0; ie < dtable.getInput().size(); ie++) {
                    final UnaryTests ut = new UnaryTests();
                    ut.setText(DecisionTableDefaultValueUtilities.INPUT_CLAUSE_UNARY_TEST_TEXT);
                    rule.getInputEntry().add(ut);
                    ut.setParent(rule);
                }
                for (int oe = 0; oe < dtable.getOutput().size(); oe++) {
                    final LiteralExpression le = new LiteralExpression();
                    le.setText(DecisionTableDefaultValueUtilities.OUTPUT_CLAUSE_EXPRESSION_TEXT);
                    rule.getOutputEntry().add(le);
                    le.setParent(rule);
                }
                final Description d = new Description();
                d.setValue(DecisionTableDefaultValueUtilities.RULE_DESCRIPTION);
                rule.setDescription(d);

                rule.setParent(dtable);

                return GraphCommandResultBuilder.SUCCESS;
            }

            @Override
            public CommandResult<RuleViolation> undo(final GraphCommandExecutionContext context) {
                dtable.getRule().remove(rule);

                return GraphCommandResultBuilder.SUCCESS;
            }
        };
    }

    @Override
    protected Command<AbstractCanvasHandler, CanvasViolation> newCanvasCommand(final AbstractCanvasHandler context) {
        return new AbstractCanvasCommand() {
            @Override
            public CommandResult<CanvasViolation> execute(final AbstractCanvasHandler context) {
                int columnIndex = 0;
                uiModel.insertRow(uiRowIndex,
                                  uiModelRow);
                uiModelMapper.fromDMNModel(uiRowIndex,
                                           columnIndex++);
                for (int ici = 0; ici < dtable.getInput().size(); ici++) {
                    uiModelMapper.fromDMNModel(uiRowIndex,
                                               columnIndex++);
                }
                for (int oci = 0; oci < dtable.getOutput().size(); oci++) {
                    uiModelMapper.fromDMNModel(uiRowIndex,
                                               columnIndex++);
                }
                uiModelMapper.fromDMNModel(uiRowIndex,
                                           columnIndex);

                updateRowNumbers();
                updateParentInformation();

                canvasOperation.execute();

                return CanvasCommandResultBuilder.SUCCESS;
            }

            @Override
            public CommandResult<CanvasViolation> undo(final AbstractCanvasHandler context) {
                uiModel.deleteRow(uiRowIndex);

                updateRowNumbers();
                updateParentInformation();

                canvasOperation.execute();

                return CanvasCommandResultBuilder.SUCCESS;
            }
        };
    }

    public void updateRowNumbers() {
        CommandUtils.updateRowNumbers(uiModel,
                                      IntStream.range(0,
                                                      uiModel.getRowCount()));
    }

    public void updateParentInformation() {
        CommandUtils.updateParentInformation(uiModel);
    }
}
