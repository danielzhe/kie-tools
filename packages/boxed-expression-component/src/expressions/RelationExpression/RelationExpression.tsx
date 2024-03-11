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

import "@patternfly/react-styles/css/utilities/Text/text.css";
import * as React from "react";
import { useCallback, useMemo, useRef } from "react";
import * as ReactTable from "react-table";
import {
  BeeTableContextMenuAllowedOperationsConditions,
  BeeTableHeaderVisibility,
  BeeTableOperation,
  BeeTableOperationConfig,
  DmnBuiltInDataType,
  generateUuid,
  getNextAvailablePrefixedName,
  InsertRowColumnsDirection,
  RelationExpressionDefinition,
} from "../../api";
import { useBoxedExpressionEditorI18n } from "../../i18n";
import { usePublishedBeeTableResizableColumns } from "../../resizing/BeeTableResizableColumnsContext";
import { useApportionedColumnWidthsIfNestedTable, useNestedTableLastColumnMinWidth } from "../../resizing/Hooks";
import { ResizerStopBehavior } from "../../resizing/ResizingWidthsContext";
import {
  BEE_TABLE_ROW_INDEX_COLUMN_WIDTH,
  RELATION_EXPRESSION_COLUMN_DEFAULT_WIDTH,
  RELATION_EXPRESSION_COLUMN_MIN_WIDTH,
} from "../../resizing/WidthConstants";
import { BeeTable, BeeTableCellUpdate, BeeTableColumnUpdate, BeeTableRef } from "../../table/BeeTable";
import {
  useBoxedExpressionEditor,
  useBoxedExpressionEditorDispatch,
} from "../BoxedExpressionEditor/BoxedExpressionEditorContext";
import { DEFAULT_EXPRESSION_NAME } from "../ExpressionDefinitionHeaderMenu";
import { DMN15__tList, DMN15__tLiteralExpression } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import "./RelationExpression.css";

type ROWTYPE = DMN15__tList;

export const RELATION_EXPRESSION_DEFAULT_VALUE = "";

export function RelationExpression(
  relationExpression: RelationExpressionDefinition & {
    isNested: boolean;
    parentElementId: string;
  }
) {
  const { i18n } = useBoxedExpressionEditorI18n();
  const { widthsById, variables, expressionHolderId } = useBoxedExpressionEditor();
  const { setExpression, setWidth } = useBoxedExpressionEditorDispatch();

  const id = relationExpression["@_id"]!;

  const beeTableOperationConfig = useMemo<BeeTableOperationConfig>(
    () => [
      {
        group: i18n.columns,
        items: [
          { name: i18n.columnOperations.insertLeft, type: BeeTableOperation.ColumnInsertLeft },
          { name: i18n.columnOperations.insertRight, type: BeeTableOperation.ColumnInsertRight },
          { name: i18n.insert, type: BeeTableOperation.ColumnInsertN },
          { name: i18n.columnOperations.delete, type: BeeTableOperation.ColumnDelete },
        ],
      },
      {
        group: i18n.rows,
        items: [
          { name: i18n.rowOperations.insertAbove, type: BeeTableOperation.RowInsertAbove },
          { name: i18n.rowOperations.insertBelow, type: BeeTableOperation.RowInsertBelow },
          { name: i18n.insert, type: BeeTableOperation.RowInsertN },
          { name: i18n.rowOperations.delete, type: BeeTableOperation.RowDelete },
          { name: i18n.rowOperations.duplicate, type: BeeTableOperation.RowDuplicate },
        ],
      },
      {
        group: i18n.terms.selection.toUpperCase(),
        items: [
          { name: i18n.terms.copy, type: BeeTableOperation.SelectionCopy },
          { name: i18n.terms.cut, type: BeeTableOperation.SelectionCut },
          { name: i18n.terms.paste, type: BeeTableOperation.SelectionPaste },
          { name: i18n.terms.reset, type: BeeTableOperation.SelectionReset },
        ],
      },
    ],
    [i18n]
  );

  const widths = useMemo(() => widthsById.get(id) ?? [], [id, widthsById]);

  const getColumnWidth = useCallback(
    (column: number) => {
      return widths[column] ?? RELATION_EXPRESSION_COLUMN_DEFAULT_WIDTH;
    },
    [widths]
  );

  const columns = useMemo(() => {
    return (relationExpression.column ?? []).map((c, index) => ({
      ...c,
      minWidth: RELATION_EXPRESSION_COLUMN_MIN_WIDTH,
      width: getColumnWidth(index),
    }));
  }, [getColumnWidth, relationExpression.column]);

  const rows = useMemo<DMN15__tList[]>(() => {
    return relationExpression.row ?? [];
  }, [relationExpression]);

  const setColumnWidth = useCallback(
    (columnIndex: number) => (newWidthAction: React.SetStateAction<number | undefined>) => {
      const columnWidth = getColumnWidth(columnIndex);
      const newWidth = typeof newWidthAction === "function" ? newWidthAction(columnWidth) : newWidthAction;

      if (newWidth && columnWidth) {
        const values = [...widths];
        values.splice(columnIndex, 1, newWidth);
        setWidth({ id, values });
      }
    },
    [getColumnWidth, widths, setWidth, id]
  );
  /// //////////////////////////////////////////////////////
  /// ///////////// RESIZING WIDTHS ////////////////////////
  /// //////////////////////////////////////////////////////

  const beeTableRef = useRef<BeeTableRef>(null);
  const { onColumnResizingWidthChange, columnResizingWidths, isPivoting } = usePublishedBeeTableResizableColumns(
    relationExpression["@_id"]!,
    columns.length,
    true
  );

  const lastColumnMinWidth = useNestedTableLastColumnMinWidth(columnResizingWidths);

  useApportionedColumnWidthsIfNestedTable(
    beeTableRef,
    isPivoting,
    relationExpression.isNested,
    BEE_TABLE_ROW_INDEX_COLUMN_WIDTH,
    columns,
    columnResizingWidths,
    rows
  );

  /// //////////////////////////////////////////////////////

  const beeTableColumns = useMemo<ReactTable.Column<ROWTYPE>[]>(() => {
    return [
      {
        accessor: expressionHolderId as any, // FIXME: https://github.com/kiegroup/kie-issues/issues/169
        label: relationExpression["@_label"] ?? DEFAULT_EXPRESSION_NAME,
        dataType: relationExpression["@_typeRef"] ?? "<Undefined>",
        isRowIndexColumn: false,
        width: undefined,
        columns: columns.map((column, columnIndex) => ({
          accessor: column["@_id"] as any,
          label: column["@_name"],
          dataType: column["@_typeRef"] ?? "<Undefined>",
          isRowIndexColumn: false,
          minWidth: RELATION_EXPRESSION_COLUMN_MIN_WIDTH,
          setWidth: setColumnWidth(columnIndex),
          width: column.width ?? RELATION_EXPRESSION_COLUMN_MIN_WIDTH,
        })),
      },
    ];

    // return columns.map((c) => {
    //   return {
    //     accessor: c["@_id"] as any, // FIXME: https://github.com/kiegroup/kie-issues/issues/169
    //     label: c["@_name"] ?? DEFAULT_EXPRESSION_NAME,
    //     dataType: c["@_typeRef"] ?? "<Undefined>",
    //     isRowIndexColumn: false,
    //     setColumnWidth,
    //     width: undefined,
    //   };
    // });
  }, [columns, setColumnWidth]);

  const beeTableRows = useMemo<ROWTYPE[]>(
    () =>
      rows.map((row) => {
        return columns.reduce(
          (tableRow, column, columnIndex) => {
            if (row.expression?.[columnIndex].__$$element === "literalExpression") {
              const value = (row.expression?.[columnIndex] as DMN15__tLiteralExpression).text?.__$$text ?? "";
              (tableRow as any)[column["@_id"]!] = {
                ...(tableRow as any)[column["@_id"]!],
                content: value,
              };
            }
            return tableRow;
          },
          { id: row["@_id"] } as ROWTYPE
        );
      }),
    [rows, columns]
  );

  const onCellUpdates = useCallback(
    (cellUpdates: BeeTableCellUpdate<ROWTYPE>[]) => {
      setExpression((prev: RelationExpressionDefinition) => {
        const n = { ...prev };
        cellUpdates.forEach((u) => {
          const newRows = [...(n.row ?? [])];

          // The expressions are always literal
          const newCells = [...(newRows[u.rowIndex].expression ?? [])];
          if (newCells[u.columnIndex].__$$element == "literalExpression") {
            newCells[u.columnIndex] = {
              __$$element: "literalExpression",
              ...(newCells[u.columnIndex] as DMN15__tLiteralExpression),
              text: {
                __$$text: u.value,
              },
            };
          }

          newRows[u.rowIndex] = {
            ...newRows[u.rowIndex],
            expression: newCells,
          };

          n.row = newRows;
        });

        return n;
      });
    },
    [setExpression]
  );

  const onColumnUpdates = useCallback(
    (columnUpdates: BeeTableColumnUpdate<ROWTYPE>[]) => {
      setExpression((prev: RelationExpressionDefinition) => {
        const n = {
          ...prev,
        };
        const newColumns = [...(prev.column ?? [])];

        for (const u of columnUpdates) {
          if (u.column.depth === 0) {
            n["@_typeRef"] = u.dataType;
            n["@_label"] = u.name;
          } else {
            newColumns[u.columnIndex] = {
              ...newColumns[u.columnIndex],
              "@_name": u.name,
              "@_typeRef": u.dataType,
            };
          }
        }

        return {
          ...n,
          column: newColumns,
        };
      });
    },
    [setExpression]
  );

  const createCell = useCallback(() => {
    const cell: {
      __$$element: "literalExpression";
      "@_id": string;
      text: { __$$text: string };
    } = {
      __$$element: "literalExpression",
      "@_id": generateUuid(),
      text: {
        __$$text: RELATION_EXPRESSION_DEFAULT_VALUE,
      },
    };
    variables?.repository.addVariableToContext(cell["@_id"]!, cell["@_id"]!, relationExpression.parentElementId);
    return cell;
  }, [relationExpression.parentElementId, variables?.repository]);

  const onRowAdded = useCallback(
    (args: { beforeIndex: number; rowsCount: number; insertDirection: InsertRowColumnsDirection }) => {
      setExpression((prev: RelationExpressionDefinition) => {
        const newRows = [...(prev.row ?? [])];
        const newItems = [];

        for (let i = 0; i < args.rowsCount; i++) {
          newItems.push({
            "@_id": generateUuid(),
            expression: Array.from(new Array(prev.column?.length ?? 0)).map(() => {
              return createCell();
            }),
          });
        }

        for (const newEntry of newItems) {
          let index = args.beforeIndex;
          newRows.splice(index, 0, newEntry);
          if (args.insertDirection === InsertRowColumnsDirection.AboveOrRight) {
            index++;
          }
        }

        return {
          ...prev,
          row: newRows,
        };
      });
    },
    [createCell, setExpression]
  );

  const onColumnAdded = useCallback(
    (args: { beforeIndex: number; columnsCount: number; insertDirection: InsertRowColumnsDirection }) => {
      setExpression((prev: RelationExpressionDefinition) => {
        const newColumns = [...(prev.column ?? [])];

        const newItems = [];
        const availableNames = prev.column?.map((c) => c["@_name"]) ?? [];

        for (let i = 0; i < args.columnsCount; i++) {
          const name = getNextAvailablePrefixedName(availableNames, "column");
          availableNames.push(name);

          newItems.push({
            "@_id": generateUuid(),
            "@_name": name,
            "@_typeRef": DmnBuiltInDataType.Undefined,
            width: RELATION_EXPRESSION_COLUMN_DEFAULT_WIDTH,
          });
        }

        for (const newEntry of newItems) {
          let index = args.beforeIndex;
          newColumns.splice(index, 0, newEntry);
          if (args.insertDirection === InsertRowColumnsDirection.BelowOrLeft) {
            index++;
          }
        }

        const newRows = [...(prev.row ?? [])].map((row) => {
          const newCells = [...(row.expression ?? [])];
          newCells.splice(args.beforeIndex, 0, createCell());
          return {
            ...row,
            expression: newCells,
          };
        });

        return {
          ...prev,
          column: newColumns,
          row: newRows,
        };
      });
    },
    [createCell, setExpression]
  );

  const onColumnDeleted = useCallback(
    (args: { columnIndex: number }) => {
      setExpression((prev: RelationExpressionDefinition) => {
        const newColumns = [...(prev.column ?? [])];
        newColumns.splice(args.columnIndex, 1);

        const newRows = [...(prev.row ?? [])].map((row) => {
          const newCells = [...(row.expression ?? [])];
          newCells.splice(args.columnIndex, 1);
          return {
            ...row,
            expression: newCells,
          };
        });

        return {
          ...prev,
          column: newColumns,
          row: newRows,
        };
      });
    },
    [setExpression]
  );

  const onRowDeleted = useCallback(
    (args: { rowIndex: number }) => {
      setExpression((prev: RelationExpressionDefinition) => {
        const newRows = [...(prev.row ?? [])];
        newRows.splice(args.rowIndex, 1);
        return {
          ...prev,
          row: newRows,
        };
      });
    },
    [setExpression]
  );

  const onRowDuplicated = useCallback(
    (args: { rowIndex: number }) => {
      setExpression((prev: RelationExpressionDefinition) => {
        const duplicatedRow = {
          "@_id": generateUuid(),
          expression: prev.row![args.rowIndex].expression?.map((cell) => ({
            ...cell,
            "@_id": generateUuid(),
          })),
        };

        const newRows = [...(prev.row ?? [])];
        newRows.splice(args.rowIndex, 0, duplicatedRow);
        return {
          ...prev,
          row: newRows,
        };
      });
    },
    [setExpression]
  );

  const beeTableHeaderVisibility = useMemo(() => {
    return relationExpression.isNested ? BeeTableHeaderVisibility.LastLevel : BeeTableHeaderVisibility.AllLevels;
  }, [relationExpression.isNested]);

  const allowedOperations = useCallback(
    (conditions: BeeTableContextMenuAllowedOperationsConditions) => {
      if (!conditions.selection.selectionStart || !conditions.selection.selectionEnd) {
        return [];
      }

      const columnIndex = conditions.selection.selectionStart.columnIndex;

      const columnCanBeDeleted = (conditions.columns?.length ?? 0) > 2; // That's a regular column and the rowIndex column

      const columnOperations =
        columnIndex === 0 // This is the rowIndex column
          ? []
          : [
              BeeTableOperation.ColumnInsertLeft,
              BeeTableOperation.ColumnInsertRight,
              BeeTableOperation.ColumnInsertN,
              ...(columnCanBeDeleted ? [BeeTableOperation.ColumnDelete] : []),
            ];

      return [
        ...columnOperations,
        BeeTableOperation.SelectionCopy,
        ...(columnIndex > 0 && conditions.selection.selectionStart.rowIndex >= 0
          ? [BeeTableOperation.SelectionCut, BeeTableOperation.SelectionPaste, BeeTableOperation.SelectionReset]
          : []),
        ...(conditions.selection.selectionStart.rowIndex >= 0
          ? [
              BeeTableOperation.RowInsertAbove,
              BeeTableOperation.RowInsertBelow,
              BeeTableOperation.RowInsertN,
              ...(beeTableRows.length > 1 ? [BeeTableOperation.RowDelete] : []),
              BeeTableOperation.RowReset,
              BeeTableOperation.RowDuplicate,
            ]
          : []),
      ];
    },
    [beeTableRows.length]
  );

  return (
    <div className={`relation-expression`}>
      <BeeTable
        resizerStopBehavior={
          isPivoting ? ResizerStopBehavior.SET_WIDTH_ALWAYS : ResizerStopBehavior.SET_WIDTH_WHEN_SMALLER
        }
        forwardRef={beeTableRef}
        headerLevelCountForAppendingRowIndexColumn={1}
        editColumnLabel={i18n.editRelation}
        columns={beeTableColumns}
        headerVisibility={beeTableHeaderVisibility}
        rows={beeTableRows}
        onCellUpdates={onCellUpdates}
        onColumnUpdates={onColumnUpdates}
        operationConfig={beeTableOperationConfig}
        allowedOperations={allowedOperations}
        onRowAdded={onRowAdded}
        onRowDuplicated={onRowDuplicated}
        onRowDeleted={onRowDeleted}
        onColumnAdded={onColumnAdded}
        onColumnDeleted={onColumnDeleted}
        onColumnResizingWidthChange={onColumnResizingWidthChange}
        shouldRenderRowIndexColumn={true}
        shouldShowRowsInlineControls={true}
        shouldShowColumnsInlineControls={true}
        variables={variables}
        widthsById={widthsById}
        // lastColumnMinWidth={lastColumnMinWidth} // FIXME: Check if this is a good strategy or not when doing https://github.com/kiegroup/kie-issues/issues/181
      />
    </div>
  );
}
