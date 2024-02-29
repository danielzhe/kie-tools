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
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as ReactTable from "react-table";
import {
  BeeTableContextMenuAllowedOperationsConditions,
  BeeTableHeaderVisibility,
  BeeTableOperation,
  LiteralExpressionDefinition,
} from "../../api";
import { useNestedExpressionContainer } from "../../resizing/NestedExpressionContainerContext";
import { LITERAL_EXPRESSION_EXTRA_WIDTH, LITERAL_EXPRESSION_MIN_WIDTH } from "../../resizing/WidthConstants";
import { BeeTable, BeeTableCellUpdate, BeeTableColumnUpdate, BeeTableRef } from "../../table/BeeTable";
import { usePublishedBeeTableResizableColumns } from "../../resizing/BeeTableResizableColumnsContext";
import { useBeeTableCoordinates, useBeeTableSelectableCellRef } from "../../selection/BeeTableSelectionContext";
import {
  useBoxedExpressionEditor,
  useBoxedExpressionEditorDispatch,
} from "../BoxedExpressionEditor/BoxedExpressionEditorContext";
import "./LiteralExpression.css";
import { DEFAULT_EXPRESSION_NAME } from "../ExpressionDefinitionHeaderMenu";
import { ResizerStopBehavior } from "../../resizing/ResizingWidthsContext";
import { useBoxedExpressionEditorI18n } from "../../i18n";

type ROWTYPE = any;

export function LiteralExpression(literalExpression: LiteralExpressionDefinition & { isNested: boolean }) {
  const { setExpression } = useBoxedExpressionEditorDispatch();
  const { decisionNodeId, variables, widthsById } = useBoxedExpressionEditor();

  const getValue = useCallback(() => {
    return literalExpression.text?.__$$text ?? "";
  }, [literalExpression.text]);

  const setValue = useCallback(
    (value: string) => {
      setExpression(() => ({ ...literalExpression, text: { __$$text: value } }));
    },
    [literalExpression, setExpression]
  );

  const getWidth = useCallback(
    (id: string | undefined) => {
      const widths = widthsById.get(id ?? "");
      if (widths && widths.length > 0) {
        return widths[0];
      } else {
        return undefined;
      }
    },
    [widthsById]
  );

  const { containerCellCoordinates } = useBeeTableCoordinates();
  useBeeTableSelectableCellRef(
    containerCellCoordinates?.rowIndex ?? 0,
    containerCellCoordinates?.columnIndex ?? 0,
    setValue,
    getValue
  );

  const onColumnUpdates = useCallback(
    ([{ name, dataType }]: BeeTableColumnUpdate<ROWTYPE>[]) => {
      setExpression(() => ({
        ...literalExpression,
        "@_label": name,
        "@_typeRef": dataType,
      }));
    },
    [literalExpression, setExpression]
  );

  const setWidth = useCallback(
    (newWidthAction: React.SetStateAction<number | undefined>) => {
      setExpression((prev: LiteralExpressionDefinition) => {
        const newWidth = typeof newWidthAction === "function" ? newWidthAction(getWidth(prev["@_id"])) : newWidthAction;
        return { ...prev, width: newWidth };
      });
    },
    [setExpression]
  );

  const onCellUpdates = useCallback(
    (cellUpdates: BeeTableCellUpdate<ROWTYPE>[]) => {
      setValue(cellUpdates[0].value);
    },
    [setValue]
  );

  /// //////////////////////////////////////////////////////
  /// ///////////// RESIZING WIDTHS ////////////////////////
  /// //////////////////////////////////////////////////////

  const { onColumnResizingWidthChange, isPivoting } = usePublishedBeeTableResizableColumns(
    literalExpression["@_id"] ?? "",
    1,
    false
  );

  const nestedExpressionContainer = useNestedExpressionContainer();

  const minWidth = useMemo(() => {
    return Math.max(
      nestedExpressionContainer.minWidth - LITERAL_EXPRESSION_EXTRA_WIDTH, //
      LITERAL_EXPRESSION_MIN_WIDTH
    );
  }, [nestedExpressionContainer]);

  const beeTableRef = useRef<BeeTableRef>(null);

  useEffect(() => {
    if (isPivoting || !literalExpression.isNested) {
      return;
    }

    const COLUMN_INDEX = 1;
    beeTableRef.current?.updateColumnResizingWidths(
      new Map([
        [
          COLUMN_INDEX,
          {
            value: Math.max(nestedExpressionContainer.resizingWidth.value - LITERAL_EXPRESSION_EXTRA_WIDTH, minWidth),
            isPivoting: false,
          },
        ],
      ])
    );
  }, [isPivoting, literalExpression.isNested, minWidth, nestedExpressionContainer.resizingWidth.value]);

  /// //////////////////////////////////////////////////////

  const beeTableColumns = useMemo<ReactTable.Column<ROWTYPE>[]>(() => {
    return [
      {
        accessor: decisionNodeId as any, // FIXME: https://github.com/kiegroup/kie-issues/issues/169
        label: literalExpression["@_label"] ?? DEFAULT_EXPRESSION_NAME,
        isRowIndexColumn: false,
        dataType: literalExpression["@_typeRef"] ?? "<Undefined>",
        minWidth,
        width: getWidth(literalExpression["@_id"]) ?? LITERAL_EXPRESSION_MIN_WIDTH,
        setWidth,
      },
    ];
  }, [decisionNodeId, getWidth, literalExpression, minWidth, setWidth]);

  const beeTableRows = useMemo<ROWTYPE[]>(() => {
    return [{ [decisionNodeId]: { content: literalExpression.text?.__$$text ?? "", id: literalExpression["@_id"] } }];
  }, [decisionNodeId, literalExpression.text]);

  const beeTableHeaderVisibility = useMemo(() => {
    return literalExpression.isNested ? BeeTableHeaderVisibility.None : BeeTableHeaderVisibility.AllLevels;
  }, [literalExpression.isNested]);

  const getRowKey = useCallback((row: ReactTable.Row<ROWTYPE>) => {
    return row.id;
  }, []);

  const { i18n } = useBoxedExpressionEditorI18n();

  const beeTableOperationConfig = useMemo(() => {
    return [
      {
        group: i18n.terms.selection.toUpperCase(),
        items: [
          { name: i18n.terms.copy, type: BeeTableOperation.SelectionCopy },
          { name: i18n.terms.cut, type: BeeTableOperation.SelectionCut },
          { name: i18n.terms.paste, type: BeeTableOperation.SelectionPaste },
          { name: i18n.terms.reset, type: BeeTableOperation.SelectionReset },
        ],
      },
    ];
  }, [i18n]);

  const allowedOperations = useCallback((conditions: BeeTableContextMenuAllowedOperationsConditions) => {
    if (!conditions.selection.selectionStart || !conditions.selection.selectionEnd) {
      return [];
    }

    return [
      BeeTableOperation.SelectionCopy,
      ...(conditions.selection.selectionStart.rowIndex === 0
        ? [BeeTableOperation.SelectionCut, BeeTableOperation.SelectionPaste, BeeTableOperation.SelectionReset]
        : []),
    ];
  }, []);

  return (
    <div className={`literal-expression`}>
      <div className={"literal-expression-body-container"}>
        <div className={"equals-sign"}>{`=`}</div>
        <BeeTable
          resizerStopBehavior={ResizerStopBehavior.SET_WIDTH_WHEN_SMALLER}
          forwardRef={beeTableRef}
          getRowKey={getRowKey}
          columns={beeTableColumns}
          rows={beeTableRows}
          headerVisibility={beeTableHeaderVisibility}
          onColumnUpdates={onColumnUpdates}
          onCellUpdates={onCellUpdates}
          operationConfig={beeTableOperationConfig}
          allowedOperations={allowedOperations}
          onColumnResizingWidthChange={onColumnResizingWidthChange}
          shouldRenderRowIndexColumn={false}
          shouldShowRowsInlineControls={false}
          shouldShowColumnsInlineControls={false}
          variables={variables}
          widthsById={widthsById}
        ></BeeTable>
      </div>
    </div>
  );
}
