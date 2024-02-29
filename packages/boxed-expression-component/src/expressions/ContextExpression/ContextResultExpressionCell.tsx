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

import * as React from "react";
import { useCallback, useMemo } from "react";
import { ContextExpressionDefinition } from "../../api";
import {
  NestedExpressionDispatchContextProvider,
  useBoxedExpressionEditorDispatch,
} from "../BoxedExpressionEditor/BoxedExpressionEditorContext";
import { ExpressionContainer } from "../ExpressionDefinitionRoot/ExpressionContainer";

export function ContextResultExpressionCell(props: {
  contextExpression: ContextExpressionDefinition;
  rowIndex: number;
  columnIndex: number;
  widthsById: Map<string, number[]>;
}) {
  const { setExpression } = useBoxedExpressionEditorDispatch();

  const onSetExpression = useCallback(
    ({ getNewExpression }) => {
      setExpression((prev: ContextExpressionDefinition) => {
        const entries = [...(prev.contextEntry ?? [])];
        const result = entries.find((e) => !e.variable);
        const index = entries.findIndex((value) => !value.variable);

        entries.splice(index, 1, {
          ...result,
          expression: getNewExpression(result?.expression),
        });

        return {
          ...prev,
          contextEntry: entries,
        };
      });
    },
    [setExpression]
  );

  // It is not possible to have a ContextExpression without any entry (props.contextExpression.contextEntries.length === 0)
  const lastEntry = props.contextExpression.contextEntry?.[props.contextExpression.contextEntry.length - 1];

  const resultExpression = useMemo(() => {
    return props.contextExpression.contextEntry?.find((e) => !e.variable)?.expression;
  }, [props.contextExpression.contextEntry]);

  return (
    <NestedExpressionDispatchContextProvider onSetExpression={onSetExpression}>
      <ExpressionContainer
        expression={resultExpression!}
        isResetSupported={true}
        isNested={true}
        rowIndex={props.rowIndex}
        columnIndex={props.columnIndex}
        parentElementId={lastEntry?.variable?.["@_id"]}
        widthsById={props.widthsById}
      />
    </NestedExpressionDispatchContextProvider>
  );
}
