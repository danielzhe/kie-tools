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
import { DMN15__tDefinitions, DMN15__tInputData } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { Normalized } from "@kie-tools/dmn-marshaller/dist/normalization/normalize";
import { ClipboardCopy } from "@patternfly/react-core/dist/js/components/ClipboardCopy";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { DocumentationLinksFormGroup } from "./DocumentationLinksFormGroup";
import { TypeRefSelector } from "../dataTypes/TypeRefSelector";
import { useDmnEditorStore, useDmnEditorStoreApi } from "../store/StoreContext";
import { renameDrgElement } from "../mutations/renameNode";
import { InlineFeelNameInput } from "../feel/InlineFeelNameInput";
import { useDmnEditor } from "../DmnEditorContext";
import { useResolvedTypeRef } from "../dataTypes/useResolvedTypeRef";
import { useCallback, useMemo, useState } from "react";
import { generateUuid } from "@kie-tools/boxed-expression-component/dist/api";
import { useSettings } from "../settings/DmnEditorSettingsContext";
import { DmnLatestModel } from "@kie-tools/dmn-marshaller";
import { OnEditableNodeLabelChange } from "../diagram/nodes/EditableNodeLabel";
import {
  isIdentifierReferencedInSomeExpression,
  RefactorConfirmationDialog,
} from "../refactor/RefactorConfirmationDialog";

export function InputDataProperties({
  inputData,
  namespace,
  index,
  externalDmnModelsByNamespaceMap,
}: {
  inputData: Normalized<DMN15__tInputData>;
  namespace: string | undefined;
  index: number;
  externalDmnModelsByNamespaceMap: Map<string, Normalized<DmnLatestModel>>;
}) {
  const { setState } = useDmnEditorStoreApi();
  const settings = useSettings();

  const thisDmnsNamespace = useDmnEditorStore((s) => s.dmn.model.definitions["@_namespace"]);
  const isReadOnly = settings.isReadOnly || (!!namespace && namespace !== thisDmnsNamespace);

  const { dmnEditorRootElementRef } = useDmnEditor();

  const resolvedTypeRef = useResolvedTypeRef(inputData.variable?.["@_typeRef"], namespace);

  const [isRefactorModalOpen, setIsRefactorModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const identifierId = useMemo(() => inputData["@_id"], [inputData]);
  const oldName = useMemo(() => inputData["@_label"] ?? inputData["@_name"], [inputData]);

  const applyRename = useCallback(
    (args: {
      definitions: Normalized<DMN15__tDefinitions>;
      newName: string;
      shouldRenameReferencedExpressions: boolean;
    }) => {
      renameDrgElement({
        ...args,
        index,
        externalDmnModelsByNamespaceMap,
      });
    },
    [externalDmnModelsByNamespaceMap, index]
  );

  const setName = useCallback<OnEditableNodeLabelChange>(
    (name: string) => {
      if (name === oldName) {
        return;
      }
      setState((state) => {
        if (
          isIdentifierReferencedInSomeExpression({
            identifierUuid: identifierId,
            dmnDefinitions: state.dmn.model.definitions,
            externalDmnModelsByNamespaceMap,
          })
        ) {
          setNewName(name);
          setIsRefactorModalOpen(true);
        } else {
          applyRename({
            definitions: state.dmn.model.definitions,
            newName: name,
            shouldRenameReferencedExpressions: false,
          });
        }
      });
    },
    [applyRename, externalDmnModelsByNamespaceMap, oldName, identifierId, setState]
  );

  return (
    <>
      <RefactorConfirmationDialog
        onConfirmExpressionRefactor={() => {
          setIsRefactorModalOpen(false);
          setState((state) => {
            applyRename({
              definitions: state.dmn.model.definitions,
              newName,
              shouldRenameReferencedExpressions: true,
            });
          });
        }}
        onConfirmRenameOnly={() => {
          setIsRefactorModalOpen(false);
          setState((state) => {
            applyRename({
              definitions: state.dmn.model.definitions,
              newName,
              shouldRenameReferencedExpressions: false,
            });
          });
        }}
        isRefactorModalOpen={isRefactorModalOpen}
        fromName={oldName}
        toName={newName}
      />
      <FormGroup label="Name">
        <InlineFeelNameInput
          enableAutoFocusing={false}
          isPlain={false}
          id={inputData["@_id"]!}
          name={inputData["@_name"]}
          isReadOnly={isReadOnly}
          shouldCommitOnBlur={true}
          className={"pf-c-form-control"}
          onRenamed={setName}
          allUniqueNames={useCallback((s) => s.computed(s).getAllFeelVariableUniqueNames(), [])}
        />
      </FormGroup>
      <FormGroup label="Data type">
        <TypeRefSelector
          heightRef={dmnEditorRootElementRef}
          typeRef={resolvedTypeRef}
          isDisabled={isReadOnly}
          onChange={(newTypeRef) => {
            setState((state) => {
              const drgElement = state.dmn.model.definitions.drgElement![index] as Normalized<DMN15__tInputData>;
              drgElement.variable ??= { "@_id": generateUuid(), "@_name": inputData["@_name"] };
              drgElement.variable["@_typeRef"] = newTypeRef;
            });
          }}
        />
      </FormGroup>
      <FormGroup label="Description">
        <TextArea
          aria-label={"Description"}
          type={"text"}
          isDisabled={isReadOnly}
          value={inputData.description?.__$$text}
          onChange={(newDescription) => {
            setState((state) => {
              (state.dmn.model.definitions.drgElement![index] as Normalized<DMN15__tInputData>).description = {
                __$$text: newDescription,
              };
            });
          }}
          placeholder={"Enter a description..."}
          style={{ resize: "vertical", minHeight: "40px" }}
          rows={6}
        />
      </FormGroup>

      <FormGroup label="ID">
        <ClipboardCopy isReadOnly={true} hoverTip="Copy" clickTip="Copied">
          {inputData["@_id"]}
        </ClipboardCopy>
      </FormGroup>

      <DocumentationLinksFormGroup
        isReadOnly={isReadOnly}
        values={inputData.extensionElements?.["kie:attachment"]}
        onChange={(newExtensionElements) => {
          setState((state) => {
            (state.dmn.model.definitions.drgElement![index] as Normalized<DMN15__tInputData>).extensionElements = {
              "kie:attachment": newExtensionElements,
            };
          });
        }}
      />
    </>
  );
}
