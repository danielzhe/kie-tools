import * as React from "react";
import {
  DMN15__tInformationItem,
  DMNDI15__DMNShape,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { DmnBuiltInDataType } from "@kie-tools/boxed-expression-component/dist/api";
import { useDmnEditorStore } from "../../store/Store";
import { OnCreateDataType, OnTypeRefChange, TypeRefSelector } from "../../dataTypes/TypeRefSelector";
import { useDmnEditor } from "../../DmnEditorContext";

function stopPropagation(e: React.MouseEvent | React.KeyboardEvent) {
  e.stopPropagation();
}

export function DataTypeNodePanel(props: {
  isVisible: boolean;
  variable: DMN15__tInformationItem | undefined;
  shape: DMNDI15__DMNShape | undefined;
  onChange: OnTypeRefChange;
  onCreate?: OnCreateDataType;
}) {
  const diagram = useDmnEditorStore((s) => s.diagram);

  const { dmnEditorRootElementRef } = useDmnEditor();

  return (
    <>
      {props.isVisible && diagram.overlays.enableDataTypesToolbarOnNodes && (
        <div
          className={"kie-dmn-editor--data-type-node-panel"}
          // Do not allow any events to go to the node itself...
          onMouseDownCapture={stopPropagation}
          onKeyDownCapture={stopPropagation}
          onClick={stopPropagation}
          onDoubleClick={stopPropagation}
          onMouseLeave={stopPropagation}
        >
          <div>
            <TypeRefSelector
              zoom={0.8}
              heightRef={dmnEditorRootElementRef}
              typeRef={props.variable?.["@_typeRef"] ?? DmnBuiltInDataType.Undefined}
              onChange={props.onChange}
              onCreate={props.onCreate}
              menuAppendTo={"parent"}
            />
          </div>
        </div>
      )}
    </>
  );
}
