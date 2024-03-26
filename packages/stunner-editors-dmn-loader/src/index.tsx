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

import { BoxedExpressionEditor } from "@kie-tools/boxed-expression-component/dist/expressions";
import {
  ImportJavaClasses,
  GWTLayerService,
  JavaClass,
  JavaCodeCompletionService,
} from "@kie-tools/import-java-classes-component";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import {
  BeeGwtService,
  DmnDataType,
  BoxedExpression,
  PmmlDocument,
} from "@kie-tools/boxed-expression-component/dist/api";
import { FeelVariables } from "@kie-tools/dmn-feel-antlr4-parser";
import { GwtExpressionDefinition } from "./types";
import { dmnExpressionToGwtExpression, gwtLogicType } from "./mapping";
import { gwtExpressionToDmnExpression } from "./mapping";

export interface BoxedExpressionEditorWrapperProps {
  /** Identifier of the decision node, where the expression will be hold */
  expressionHolderId: string;
  /** All expression properties used to define it */
  gwtExpression: GwtExpressionDefinition;
  /** The data type elements that can be used in the editor */
  dataTypes: DmnDataType[];
  /**
   * A boolean used for making (or not) the "Reset" button available on the root expression
   * Note that this parameter will be used only for the root expression.
   * */
  isResetSupportedOnRootExpression?: boolean;
  /** PMML parameters */
  pmmlDocuments?: PmmlDocument[];
  /** BoxedExpressionWrapper root node */
  boxedExpressionEditorRootNode: Element | null;
  /** The variables used in the current Boxed Expression Editor context */
  variables?: FeelVariables;
}

const BoxedExpressionEditorWrapper: React.FunctionComponent<BoxedExpressionEditorWrapperProps> = ({
  expressionHolderId,
  gwtExpression,
  dataTypes,
  isResetSupportedOnRootExpression,
  pmmlDocuments,
  boxedExpressionEditorRootNode,
  variables,
}) => {
  const [expressionWrapper, setExpressionWrapper] = useState<{
    source: "gwt" | "react";
    expression: BoxedExpression;
    widthsById: Map<string, number[]>;
  }>({ source: "gwt", ...gwtExpressionToDmnExpression(gwtExpression) });

  useEffect(() => {
    setExpressionWrapper({ source: "gwt", ...gwtExpressionToDmnExpression(gwtExpression) });
  }, [gwtExpression]);

  useEffect(() => {
    console.log("Expression is changed. Source is: " + expressionWrapper.source);
    console.log(JSON.stringify(expressionWrapper.expression));

    if (expressionWrapper.source === "react") {
      console.log("Sending expression update to GWT layer.");
      window.beeApiWrapper?.updateExpression(
        dmnExpressionToGwtExpression(expressionWrapper.widthsById, expressionWrapper.expression)
      );
    }
  }, [expressionWrapper]);

  const beeGwtService: BeeGwtService = {
    getDefaultExpressionDefinition(logicType, dataType) {
      return gwtExpressionToDmnExpression(
        window.beeApiWrapper?.getDefaultExpressionDefinition(gwtLogicType(logicType), dataType)
      );
    },
    openDataTypePage(): void {
      window.beeApiWrapper?.openDataTypePage();
    },
    selectObject(uuid: string): void {
      window.beeApiWrapper?.selectObject(uuid);
    },
  };

  const setExpressionNotifyingUserAction = useCallback((newExpressionAction: React.SetStateAction<BoxedExpression>) => {
    setExpressionWrapper((prevState) => {
      return {
        source: "react",
        expression:
          typeof newExpressionAction === "function"
            ? newExpressionAction(prevState.expression as any)
            : newExpressionAction,
        widthsById: prevState.widthsById,
      };
    });
  }, []);

  const setWidthsByIdNotifyingUserAction = useCallback(
    (newWidthsByIdAction: React.SetStateAction<Map<string, number[]>>) => {
      setExpressionWrapper((prevState) => ({
        source: "react",
        expression: prevState.expression,
        widthsById:
          typeof newWidthsByIdAction === "function"
            ? newWidthsByIdAction(prevState.widthsById as any)
            : newWidthsByIdAction,
      }));
    },
    []
  );

  const emptyRef = React.useRef<HTMLElement>(null);

  // Stop propagation to Editor and forward keydown events down the tree;
  useEffect(() => {
    const listener = (ev: KeyboardEvent) => {
      if (!ev.ctrlKey && !ev.metaKey) {
        ev.stopPropagation();
      }
    };

    boxedExpressionEditorRootNode?.addEventListener("keydown", listener);
    boxedExpressionEditorRootNode?.addEventListener("keyup", listener);
    boxedExpressionEditorRootNode?.addEventListener("keypress", listener);

    return () => {
      boxedExpressionEditorRootNode?.removeEventListener("keydown", listener);
      boxedExpressionEditorRootNode?.removeEventListener("keyup", listener);
      boxedExpressionEditorRootNode?.removeEventListener("keypress", listener);
    };
  }, [boxedExpressionEditorRootNode]);

  return (
    <BoxedExpressionEditor
      scrollableParentRef={emptyRef}
      beeGwtService={beeGwtService}
      expressionHolderId={expressionHolderId}
      dataTypes={dataTypes}
      isResetSupportedOnRootExpression={isResetSupportedOnRootExpression}
      pmmlDocuments={pmmlDocuments}
      variables={variables}
      expression={expressionWrapper.expression}
      onExpressionChange={setExpressionNotifyingUserAction}
      widthsById={expressionWrapper.widthsById}
      onWidthsChange={setWidthsByIdNotifyingUserAction}
    />
  );
};

const renderBoxedExpressionEditor = (
  selector: string,
  expressionHolderId: string,
  gwtExpression: GwtExpressionDefinition,
  dataTypes: DmnDataType[],
  isResetSupportedOnRootExpression: boolean,
  pmmlDocuments: PmmlDocument[],
  variables: FeelVariables
) => {
  const boxedExpressionEditorRootNode = document.querySelector(selector);
  ReactDOM.render(
    <BoxedExpressionEditorWrapper
      expressionHolderId={expressionHolderId}
      gwtExpression={gwtExpression}
      dataTypes={dataTypes}
      isResetSupportedOnRootExpression={isResetSupportedOnRootExpression}
      pmmlDocuments={pmmlDocuments}
      boxedExpressionEditorRootNode={boxedExpressionEditorRootNode}
      variables={variables}
    />,
    boxedExpressionEditorRootNode
  );
};

const unmountBoxedExpressionEditor = (selector: string) => {
  const boxedExpressionEditorRootNode = document.querySelector(selector);
  ReactDOM.unmountComponentAtNode(boxedExpressionEditorRootNode!);
};

const ImportJavaClassesWrapper = () => {
  window.ImportJavaClassesAPI = {
    importJavaClasses: (javaClasses: JavaClass[]) => {
      window.ImportJavaClassesAPIWrapper?.importJavaClasses?.(javaClasses);
    },
  };

  const gwtLayerService: GWTLayerService = {
    importJavaClassesInDataTypeEditor: (javaClasses) => window.ImportJavaClassesAPI?.importJavaClasses?.(javaClasses),
  };

  const javaCodeCompletionService: JavaCodeCompletionService = {
    getClasses: (query: string) => window.envelope.javaCodeCompletionService.getClasses(query),
    getFields: (fullClassName: string) => window.envelope.javaCodeCompletionService.getAccessors(fullClassName, ""),
    isLanguageServerAvailable: () => window.envelope.javaCodeCompletionService.isLanguageServerAvailable(),
  };

  return <ImportJavaClasses gwtLayerService={gwtLayerService} javaCodeCompletionService={javaCodeCompletionService} />;
};

const renderImportJavaClasses = (selector: string) => {
  ReactDOM.render(<ImportJavaClassesWrapper />, document.querySelector(selector));
};

const getVariables = (xml: string): FeelVariables => {
  return FeelVariables.fromModelXml(xml);
};

export { renderBoxedExpressionEditor, renderImportJavaClasses, unmountBoxedExpressionEditor, getVariables };
