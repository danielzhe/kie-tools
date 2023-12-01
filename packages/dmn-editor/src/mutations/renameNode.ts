import {
  DMN15__tDefinitions,
  DMN15__tGroup,
  DMN15__tTextAnnotation,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { FeelVariables } from "@kie-tools/dmn-feel-antlr4-parser";

export function renameDrgElement({
  definitions,
  newName,
  index,
}: {
  definitions: DMN15__tDefinitions;
  newName: string;
  index: number;
}) {
  const trimmedNewName = newName.trim();

  const feelVariables = new FeelVariables(definitions);

  const drgElement = definitions.drgElement![index];

  drgElement["@_name"] = trimmedNewName;

  if (drgElement.__$$element !== "knowledgeSource") {
    drgElement.variable ??= { "@_name": trimmedNewName };
    drgElement.variable!["@_name"] = trimmedNewName;
  }

  feelVariables.renameVariable(drgElement["@_id"] ?? "", trimmedNewName);
  feelVariables.applyChangesToDefinition();
}

export function renameGroupNode({
  definitions,
  newName,
  index,
}: {
  definitions: DMN15__tDefinitions;
  newName: string;
  index: number;
}) {
  (definitions.artifact![index] as DMN15__tGroup)["@_name"] = newName;
}

export function updateTextAnnotation({
  definitions,
  newText,
  index,
}: {
  definitions: DMN15__tDefinitions;
  newText: string;
  index: number;
}) {
  (definitions.artifact![index] as DMN15__tTextAnnotation).text = { __$$text: newText };
}
