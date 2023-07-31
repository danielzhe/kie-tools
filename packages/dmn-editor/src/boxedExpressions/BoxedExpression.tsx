import { DmnBuiltInDataType, ExpressionDefinition } from "@kie-tools/boxed-expression-component/dist/api";
import { BoxedExpressionEditor } from "@kie-tools/boxed-expression-component/dist/expressions";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { Label } from "@patternfly/react-core/dist/js/components/Label";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { updateExpression } from "../mutations/updateExpression";
import { DmnNodeWithExpression, useDmnEditorStore, useDmnEditorStoreApi } from "../store/Store";
import { dmnToBee, getUndefinedExpressionDefinition } from "./dmnToBee";

export function BoxedExpression({ container }: { container: React.RefObject<HTMLElement> }) {
  const { dispatch, dmn, boxedExpression } = useDmnEditorStore();

  const dmnEditorStoreApi = useDmnEditorStoreApi();

  const widthsById = useMemo(() => {
    return (
      dmn.model.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"]?.[0]["di:extension"]?.[
        "kie:ComponentsWidthsExtension"
      ]?.["kie:ComponentWidths"] ?? []
    ).reduce((acc, c) => {
      if (c["@_dmnElementRef"] === undefined) {
        return acc;
      } else {
        return acc.set(c["@_dmnElementRef"], c["kie:width"] ?? []);
      }
    }, new Map<string, number[]>());
  }, [dmn.model.definitions]);

  const initial = useMemo(() => {
    return boxedExpression.node
      ? dmnNodeToBoxedExpression(widthsById, boxedExpression.node)
      : getUndefinedExpressionDefinition();
  }, [boxedExpression.node, widthsById]);

  const [expression, setExpression] = useState(initial);
  useEffect(() => setExpression(initial), [initial]); // Keeps internal state updated when boxedExpression.node changes.
  useEffect(() => {
    if (expression === initial) {
      return;
    }

    dmnEditorStoreApi.setState((state) => {
      updateExpression({ definitions: state.dmn.model.definitions, expression, index: 0 });
    });
  }, [dmnEditorStoreApi, expression, initial]);

  const dataTypes = useMemo(
    () =>
      (dmn.model.definitions.itemDefinition ?? []).map((item) => ({
        isCustom: true,
        typeRef: item.typeRef!,
        name: item["@_name"]!,
      })),
    [dmn.model.definitions.itemDefinition]
  );

  return (
    <>
      <Label
        isCompact={true}
        className={"kie-dmn-editor--boxed-expression-back"}
        onClick={dispatch.boxedExpression.close}
      >
        Back to Diagram
      </Label>
      <Divider inset={{ default: "insetMd" }} />
      <br />
      <>
        <BoxedExpressionEditor
          decisionNodeId={boxedExpression.node!.content["@_id"]!}
          expressionDefinition={expression}
          setExpressionDefinition={setExpression}
          dataTypes={dataTypes}
          scrollableParentRef={container}
        />
      </>
    </>
  );
}

function dmnNodeToBoxedExpression(
  widthsById: Map<string, number[]>,
  dmnNode: DmnNodeWithExpression
): ExpressionDefinition {
  if (dmnNode.type == NODE_TYPES.bkm) {
    return {
      ...dmnToBee(widthsById, {
        expression: { __$$element: "functionDefinition", ...dmnNode.content.encapsulatedLogic },
      }),
      dataType: dmnNode.content.variable?.["@_typeRef"] as DmnBuiltInDataType,
      name: dmnNode.content["@_name"],
    };
  } else if (dmnNode.type == NODE_TYPES.decision) {
    return {
      ...dmnToBee(widthsById, dmnNode.content),
      dataType: dmnNode.content.variable?.["@_typeRef"] as DmnBuiltInDataType,
      name: dmnNode.content["@_name"],
    };
  } else {
    throw new Error(`Unknown type of node that has an expression '${(dmnNode as any).type}'.`);
  }
}
