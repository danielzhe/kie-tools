import * as React from "react";
import { DMN15__tDefinitions } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { Unpacked } from "../store/useDiagramData";
import { TypeRefLabel } from "../dataTypes/TypeRefLabel";
import { NodeIcon } from "../icons/Icons";
import { getNodeTypeFromDmnObject } from "../diagram/maths/DmnMaths";
import { buildFeelQNameFromNamespace } from "../feel/buildFeelQName";
import { useDmnEditorDerivedStore } from "../store/DerivedStore";
import { Flex } from "@patternfly/react-core/dist/js/layouts/Flex";
import { DmnBuiltInDataType } from "@kie-tools/boxed-expression-component/dist/api";

export function DmnObjectListItem({
  dmnObject,
  dmnObjectHref,
  namespace,
  relativeToNamespace,
}: {
  dmnObject: Unpacked<DMN15__tDefinitions["drgElement"]> | undefined;
  dmnObjectHref: string;
  namespace: string;
  relativeToNamespace: string;
}) {
  const { importsByNamespace, allTopLevelDataTypesByFeelName } = useDmnEditorDerivedStore();
  if (!dmnObject) {
    return <>{dmnObjectHref}</>;
  }

  const Icon = NodeIcon(getNodeTypeFromDmnObject(dmnObject));
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      justifyContent={{ default: "justifyContentFlexStart" }}
      spaceItems={{ default: "spaceItemsNone" }}
    >
      <div style={{ width: "40px", height: "40px", marginRight: 0 }}>
        <Icon />
      </div>
      <div>{`${
        buildFeelQNameFromNamespace({
          namedElement: dmnObject,
          importsByNamespace,
          namespace,
          relativeToNamespace,
        }).full
      }`}</div>
      <div>
        {dmnObject.__$$element !== "knowledgeSource" ? (
          <TypeRefLabel
            typeRef={dmnObject.variable?.["@_typeRef"]}
            relativeToNamespace={namespace}
            isCollection={
              allTopLevelDataTypesByFeelName.get(dmnObject.variable?.["@_typeRef"] ?? DmnBuiltInDataType.Undefined)
                ?.itemDefinition["@_isCollection"]
            }
          />
        ) : (
          <></>
        )}
      </div>
    </Flex>
  );
}
