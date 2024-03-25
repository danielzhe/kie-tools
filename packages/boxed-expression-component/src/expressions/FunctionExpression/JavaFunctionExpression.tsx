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

import { Popover } from "@patternfly/react-core/dist/js/components/Popover/Popover";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import * as React from "react";
import { useCallback, useEffect, useMemo } from "react";
import * as ReactTable from "react-table";
import {
  BeeTableCellProps,
  BeeTableContextMenuAllowedOperationsConditions,
  BeeTableHeaderVisibility,
  BeeTableOperation,
  BeeTableOperationConfig,
  BeeTableProps,
  FunctionExpressionDefinitionKind,
  generateUuid,
} from "../../api";
import { useBoxedExpressionEditorI18n } from "../../i18n";
import { usePublishedBeeTableResizableColumns } from "../../resizing/BeeTableResizableColumnsContext";
import { useApportionedColumnWidthsIfNestedTable } from "../../resizing/Hooks";
import { ResizerStopBehavior } from "../../resizing/ResizingWidthsContext";
import {
  JAVA_FUNCTION_EXPRESSION_EXTRA_WIDTH,
  JAVA_FUNCTION_EXPRESSION_LABEL_MIN_WIDTH,
  JAVA_FUNCTION_EXPRESSION_VALUES_MIN_WIDTH,
} from "../../resizing/WidthConstants";
import { useBeeTableSelectableCellRef } from "../../selection/BeeTableSelectionContext";
import { BeeTable, BeeTableCellUpdate, BeeTableColumnUpdate, BeeTableRef } from "../../table/BeeTable";
import {
  useBoxedExpressionEditor,
  useBoxedExpressionEditorDispatch,
} from "../BoxedExpressionEditor/BoxedExpressionEditorContext";
import { DEFAULT_EXPRESSION_NAME } from "../ExpressionDefinitionHeaderMenu";
import { useFunctionExpressionControllerCell, useFunctionExpressionParametersColumnHeader } from "./FunctionExpression";
import "./JavaFunctionExpression.css";
import {
  DMN15__tContext,
  DMN15__tFunctionDefinition,
  DMN15__tLiteralExpression,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";

export type JAVA_ROWTYPE = {
  value: string;
  label: string;
};

export type JavaFunctionExpressionDefinition = DMN15__tFunctionDefinition & {
  "@_kind": "Java";
  __$$element: "functionDefinition";
  isNested: boolean;
  parentElementId: string;
};

const JAVA_FUNCTION_CLASS_AND_METHOD_NAMES_WIDTH_INDEX = 2; // 0 is the rowIndex column, 1 is the label column.

export function JavaFunctionExpression({
  functionExpression,
}: {
  functionExpression: JavaFunctionExpressionDefinition & { isNested: boolean };
}) {
  const { i18n } = useBoxedExpressionEditorI18n();
  const { expressionHolderId, widthsById } = useBoxedExpressionEditor();
  const { setExpression, setWidth } = useBoxedExpressionEditorDispatch();

  const getClassContextEntry = useCallback((c: DMN15__tContext) => {
    return c.contextEntry?.find(({ variable }) => variable?.["@_name"] === "class");
  }, []);

  const getVariableContextEntry = useCallback((c: DMN15__tContext) => {
    return c.contextEntry?.find(({ variable }) => variable?.["@_name"] === "method signature");
  }, []);

  const id = functionExpression["@_id"]!;

  const widths = useMemo(() => widthsById.get(id) ?? [], [id, widthsById]);

  const classAndMethodNamesWidth = useMemo(
    () => widths[JAVA_FUNCTION_CLASS_AND_METHOD_NAMES_WIDTH_INDEX] ?? JAVA_FUNCTION_EXPRESSION_VALUES_MIN_WIDTH,
    [widths]
  );

  const setClassAndMethodNamesWidth = useCallback(
    (newWidthAction: React.SetStateAction<number | undefined>) => {
      const newWidth = typeof newWidthAction === "function" ? newWidthAction(classAndMethodNamesWidth) : newWidthAction;

      if (newWidth) {
        const values = [...widths];
        values.splice(JAVA_FUNCTION_CLASS_AND_METHOD_NAMES_WIDTH_INDEX, 1, newWidth);
        setWidth({ id, values });
      }
    },
    [classAndMethodNamesWidth, id, setWidth, widths]
  );

  const parametersColumnHeader = useFunctionExpressionParametersColumnHeader(functionExpression.formalParameter);

  const beeTableColumns = useMemo<ReactTable.Column<JAVA_ROWTYPE>[]>(() => {
    return [
      {
        label: functionExpression["@_label"] ?? DEFAULT_EXPRESSION_NAME,
        accessor: expressionHolderId as any, // FIXME: https://github.com/kiegroup/kie-issues/issues/169
        dataType: functionExpression["@_typeRef"] ?? "<Undefined>",
        isRowIndexColumn: false,
        width: undefined,
        columns: [
          {
            headerCellElement: parametersColumnHeader,
            accessor: "parameters" as any,
            label: "parameters",
            isRowIndexColumn: false,
            dataType: undefined as any,
            width: undefined,
            columns: [
              {
                label: "label",
                accessor: "label" as any,
                dataType: undefined as any,
                isRowIndexColumn: false,
                isWidthPinned: true,
                isWidthConstant: true,
                width: JAVA_FUNCTION_EXPRESSION_LABEL_MIN_WIDTH,
                minWidth: JAVA_FUNCTION_EXPRESSION_LABEL_MIN_WIDTH,
              },
              {
                label: "value",
                accessor: "value" as any,
                dataType: undefined as any,
                isRowIndexColumn: false,
                width: classAndMethodNamesWidth,
                setWidth: setClassAndMethodNamesWidth,
                minWidth: JAVA_FUNCTION_EXPRESSION_VALUES_MIN_WIDTH,
              },
            ],
          },
        ],
      },
    ];
  }, [
    expressionHolderId,
    functionExpression,
    classAndMethodNamesWidth,
    parametersColumnHeader,
    setClassAndMethodNamesWidth,
  ]);

  const headerVisibility = useMemo(() => {
    return functionExpression.isNested
      ? BeeTableHeaderVisibility.SecondToLastLevel
      : BeeTableHeaderVisibility.AllLevels;
  }, [functionExpression.isNested]);

  const onColumnUpdates = useCallback(
    ([{ name, dataType }]: BeeTableColumnUpdate<JAVA_ROWTYPE>[]) => {
      setExpression((prev) => ({
        ...prev,
        "@_label": name,
        "@_typeRef": dataType,
      }));
    },
    [setExpression]
  );

  // It is always a Context
  const context = functionExpression.expression! as DMN15__tContext;
  const clazz = getClassContextEntry(context);
  const method = getVariableContextEntry(context);

  const beeTableOperationConfig = useMemo<BeeTableOperationConfig>(() => {
    return [
      {
        group: i18n.terms.selection.toUpperCase(),
        items: [{ name: i18n.terms.copy, type: BeeTableOperation.SelectionCopy }],
      },
      {
        group: i18n.function.toUpperCase(),
        items: [{ name: i18n.rowOperations.reset, type: BeeTableOperation.RowReset }],
      },
    ];
  }, [i18n]);

  const beeTableRows = useMemo<JAVA_ROWTYPE[]>(() => {
    return [
      {
        label: "Class name",
        value: (clazz?.expression as DMN15__tLiteralExpression | undefined)?.text?.__$$text ?? "",
      },
      {
        label: "Method signature",
        value: (method?.expression as DMN15__tLiteralExpression | undefined)?.text?.__$$text ?? "",
      },
    ];
  }, [clazz?.expression, method?.expression]);

  const controllerCell = useFunctionExpressionControllerCell(FunctionExpressionDefinitionKind.Java);

  const getRowKey = useCallback((r: ReactTable.Row<JAVA_ROWTYPE>) => {
    return r.id;
  }, []);

  const onRowReset = useCallback(() => {
    setExpression((prev) => {
      return {
        ...prev,
        expression: undefined!,
      };
    });
  }, [setExpression]);

  /// //////////////////////////////////////////////////////
  /// ///////////// RESIZING WIDTHS ////////////////////////
  /// //////////////////////////////////////////////////////

  const columns = useMemo(
    () => [
      {
        minWidth: JAVA_FUNCTION_EXPRESSION_LABEL_MIN_WIDTH,
        width: JAVA_FUNCTION_EXPRESSION_LABEL_MIN_WIDTH,
        isFrozen: true,
      },
      {
        minWidth: JAVA_FUNCTION_EXPRESSION_VALUES_MIN_WIDTH,
        width: classAndMethodNamesWidth,
      },
    ],
    [classAndMethodNamesWidth]
  );

  const { onColumnResizingWidthChange, isPivoting, columnResizingWidths } = usePublishedBeeTableResizableColumns(
    functionExpression["@_id"]!,
    columns.length,
    true
  );

  const beeTableRef = React.useRef<BeeTableRef>(null);

  useApportionedColumnWidthsIfNestedTable(
    beeTableRef,
    isPivoting,
    functionExpression.isNested,
    JAVA_FUNCTION_EXPRESSION_EXTRA_WIDTH,
    columns,
    columnResizingWidths,
    useMemo(() => [], []) // rows
  );

  useEffect(() => {
    beeTableRef.current?.updateColumnResizingWidths(
      new Map([[1, { isPivoting: false, value: JAVA_FUNCTION_EXPRESSION_LABEL_MIN_WIDTH }]])
    );
  }, []);

  /// //////////////////////////////////////////////////////

  const cellComponentByColumnAccessor: BeeTableProps<JAVA_ROWTYPE>["cellComponentByColumnAccessor"] = useMemo(
    () => ({
      label: (props) => <JavaFunctionExpressionLabelCell {...props} />,
    }),
    []
  );

  const onCellUpdates = useCallback(
    (cellUpdates: BeeTableCellUpdate<JAVA_ROWTYPE>[]) => {
      for (const u of cellUpdates) {
        const context: DMN15__tContext = functionExpression.expression!;

        const clazz = getClassContextEntry(context) ?? {
          expression: {
            __$$element: "literalExpression",
            "@_id": generateUuid(),
            text: { __$$text: "" },
          },
          variable: {
            "@_name": "class",
          },
        };
        const method = getVariableContextEntry(context) ?? {
          expression: {
            __$$element: "literalExpression",
            "@_id": generateUuid(),
            text: { __$$text: "" },
          },
          variable: {
            "@_name": "method signature",
          },
        };

        // Class
        if (u.rowIndex === 0) {
          setExpression((prev: JavaFunctionExpressionDefinition) => {
            clazz.expression = {
              ...clazz.expression,
              __$$element: "literalExpression",
              text: {
                __$$text: u.value,
              },
            };

            return {
              ...prev,
              expression: {
                __$$element: "context",
                ...context,
                contextEntry: [clazz, method],
              },
            };
          });
        }
        // Method
        else if (u.rowIndex === 1) {
          setExpression((prev: JavaFunctionExpressionDefinition) => {
            method.expression = {
              ...method.expression,
              __$$element: "literalExpression",
              "@_id": method.expression["@_id"] ?? generateUuid(),
              text: {
                __$$text: u.value,
              },
            };

            return {
              ...prev,
              expression: {
                __$$element: "context",
                ...context,
                contextEntry: [clazz, method],
              },
            };
          });
        }
      }
    },
    [functionExpression.expression, getClassContextEntry, getVariableContextEntry, setExpression]
  );

  const allowedOperations = useCallback((conditions: BeeTableContextMenuAllowedOperationsConditions) => {
    return [BeeTableOperation.SelectionCopy];
  }, []);

  return (
    <div className={`function-expression ${functionExpression["@_id"]}`}>
      <BeeTable<JAVA_ROWTYPE>
        forwardRef={beeTableRef}
        onColumnResizingWidthChange={onColumnResizingWidthChange}
        resizerStopBehavior={ResizerStopBehavior.SET_WIDTH_WHEN_SMALLER}
        operationConfig={beeTableOperationConfig}
        allowedOperations={allowedOperations}
        onColumnUpdates={onColumnUpdates}
        getRowKey={getRowKey}
        onRowReset={onRowReset}
        onCellUpdates={onCellUpdates}
        columns={beeTableColumns}
        rows={beeTableRows}
        headerLevelCountForAppendingRowIndexColumn={2}
        skipLastHeaderGroup={true}
        cellComponentByColumnAccessor={cellComponentByColumnAccessor}
        headerVisibility={headerVisibility}
        controllerCell={controllerCell}
        shouldRenderRowIndexColumn={true}
        shouldShowRowsInlineControls={false}
        shouldShowColumnsInlineControls={false}
      />
    </div>
  );
}

function JavaFunctionExpressionLabelCell(props: React.PropsWithChildren<BeeTableCellProps<JAVA_ROWTYPE>>) {
  const label = useMemo(() => {
    return props.data[props.rowIndex].label;
  }, [props.data, props.rowIndex]);

  const { isActive } = useBeeTableSelectableCellRef(
    props.rowIndex,
    props.columnIndex,
    undefined,
    useCallback(() => label, [label])
  );

  const { beeGwtService } = useBoxedExpressionEditor();

  useEffect(() => {
    if (isActive) {
      beeGwtService?.selectObject("");
    }
  }, [beeGwtService, isActive]);

  const getParameterLabelHelp = useCallback((): React.ReactNode => {
    if (props.rowIndex === 0) {
      return <code>org.kie.kogito.MyClass</code>;
    } else {
      return <code>doSomething(java.lang.Integer, double)</code>;
    }
  }, [props.rowIndex]);

  const [isCellHovered, setIsCellHovered] = React.useState<boolean>();

  return (
    <div
      className={"java-function-expression-label"}
      onMouseEnter={() => setIsCellHovered(true)}
      onMouseLeave={() => setIsCellHovered(false)}
    >
      <div className={"name"}>{label}</div>
      <div className={"data-type"}>
        {`(string)`}
        {isCellHovered && (
          <Popover
            className="java-function-parameter-help-popover"
            headerContent={label + " example"}
            bodyContent={getParameterLabelHelp}
          >
            <HelpIcon size="sm" className="java-function-parameter-help-icon" />
          </Popover>
        )}
      </div>
    </div>
  );
}
