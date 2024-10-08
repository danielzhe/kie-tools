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
import { useMemo } from "react";
import { BoxedExpressionIndex } from "../../boxedExpressions/boxedExpressionIndex";
import { DMN15__tContext, DMN15__tInformationItem } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { useBoxedExpressionUpdater } from "./useBoxedExpressionUpdater";
import { InformationItemCell } from "./InformationItemCell";
import { useDmnEditorStore } from "../../store/StoreContext";
import { Normalized } from "../../normalization/normalize";

export function ContextInformationItemCell(props: {
  boxedExpressionIndex?: BoxedExpressionIndex;
  isReadOnly: boolean;
}) {
  const selectedObjectId = useDmnEditorStore((s) => s.boxedExpressionEditor.selectedObjectId);
  const selectedObjectInfos = useMemo(
    () => props.boxedExpressionIndex?.get(selectedObjectId ?? ""),
    [props.boxedExpressionIndex, selectedObjectId]
  );

  const cellPath = useMemo(
    () => selectedObjectInfos?.expressionPath[selectedObjectInfos?.expressionPath.length - 1],
    [selectedObjectInfos?.expressionPath]
  );
  const rootPath = useMemo(
    () => props.boxedExpressionIndex?.get(cellPath?.root ?? "")?.expressionPath,
    [cellPath?.root, props.boxedExpressionIndex]
  );

  const updater = useBoxedExpressionUpdater<Normalized<DMN15__tInformationItem>>(
    selectedObjectInfos?.expressionPath ?? []
  );
  const rootExpressionUpdater = useBoxedExpressionUpdater<Normalized<DMN15__tContext>>(rootPath ?? []);

  return (
    <>
      <InformationItemCell
        {...props}
        onDescriptionChange={(newDescription) => {
          updater((dmnObject) => {
            dmnObject.description ??= { __$$text: "" };
            dmnObject.description.__$$text = newDescription;
          });
        }}
        onNameChange={(newName) => {
          updater((dmnObject) => {
            dmnObject["@_name"] = newName;
          });
        }}
        onTypeRefChange={(newTypeRef) => {
          updater((dmnObject) => {
            dmnObject["@_typeRef"] = newTypeRef;
          });
          rootExpressionUpdater((dmnObject) => {
            if (cellPath?.type === "context") {
              const expression = (dmnObject as Normalized<DMN15__tContext>).contextEntry![cellPath.row ?? 0].expression;
              if (expression) {
                expression["@_typeRef"] = newTypeRef;
              }
            }
          });
        }}
      />
    </>
  );
}
