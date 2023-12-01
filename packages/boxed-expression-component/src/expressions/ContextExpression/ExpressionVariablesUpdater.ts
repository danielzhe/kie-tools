/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { ExpressionDefinition, ExpressionDefinitionLogicType, FunctionExpressionDefinitionKind } from "../../api";
import { Expression } from "@kie-tools/dmn-feel-antlr4-parser";

export function updateExpressions(
  currentExpressions: ExpressionDefinition[],
  refactoredExpressions: Map<string, Expression>
) {
  for (const expression of currentExpressions) {
    const refactored = refactoredExpressions.get(expression.id);
    switch (expression.logicType) {
      case ExpressionDefinitionLogicType.Undefined:
        break;

      case ExpressionDefinitionLogicType.Literal:
        if (refactored) {
          expression.content = refactored.fullExpression;
        }
        break;

      case ExpressionDefinitionLogicType.Relation:
        if (expression.rows) {
          for (const row of expression.rows) {
            for (const cell of row.cells) {
              const refactored = refactoredExpressions.get(cell.id);
              if (refactored) {
                cell.content = refactored.fullExpression;
              }
            }
          }
        }
        break;

      case ExpressionDefinitionLogicType.Context: // recursive
        const affectedEntries = expression.contextEntries.map((e) => e.entryExpression);
        affectedEntries.push(expression.result);
        updateExpressions(affectedEntries, refactoredExpressions);
        break;

      case ExpressionDefinitionLogicType.DecisionTable:
        if (expression.output) {
          for (const outputClause of expression.output) {
            if (outputClause.clauseUnaryTests) {
              const refactored = refactoredExpressions.get(outputClause.clauseUnaryTests.id);
              if (refactored) {
                outputClause.clauseUnaryTests.text = refactored.fullExpression;
              }
            }
          }
        }

        if (expression.input) {
          for (const inputClause of expression.input) {
            if (inputClause.clauseUnaryTests) {
              const refactored = refactoredExpressions.get(inputClause.clauseUnaryTests.id);
              if (refactored) {
                inputClause.clauseUnaryTests.text = refactored.fullExpression;
              }
            }
          }
        }
        break;

      case ExpressionDefinitionLogicType.List: // recursive
        updateExpressions(expression.items, refactoredExpressions);
        break;

      case ExpressionDefinitionLogicType.Invocation:
        const innerExpressions = expression.bindingEntries.map((b) => b.entryExpression);
        updateExpressions(innerExpressions, refactoredExpressions);
        break;

      case ExpressionDefinitionLogicType.Function:
        switch (expression.functionKind) {
          case FunctionExpressionDefinitionKind.Feel:
            // FIXME: Does that make sense? A Function call inside a Context?
            break;
          case FunctionExpressionDefinitionKind.Pmml:
          case FunctionExpressionDefinitionKind.Java:
            // No refactor in those cases
            break;
        }
        break;
    }
  }
}
