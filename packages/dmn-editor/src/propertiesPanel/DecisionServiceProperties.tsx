import * as React from "react";
import {
  DMN15__tDecision,
  DMN15__tDecisionService,
  DMN15__tInputData,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { ClipboardCopy } from "@patternfly/react-core/dist/js/components/ClipboardCopy";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { DocumentationLinksFormGroup } from "./DocumentationLinksFormGroup";
import { TypeRefSelector } from "../dataTypes/TypeRefSelector";
import { useDmnEditorStore, useDmnEditorStoreApi } from "../store/Store";
import { useMemo } from "react";
import { buildXmlHref, parseXmlHref } from "../xml/xmlHrefs";
import { DmnObjectListItem } from "../externalNodes/DmnObjectListItem";
import { renameDrgElement } from "../mutations/renameNode";
import { InlineFeelNameInput } from "../feel/InlineFeelNameInput";
import { useDmnEditorDerivedStore } from "../store/DerivedStore";

export type AllKnownDrgElementsByHref = Map<
  string,
  ({ __$$element: "decision" } & DMN15__tDecision) | ({ __$$element: "inputData" } & DMN15__tInputData)
>;

export function DecisionServiceProperties({
  decisionService,
  namespace,
  index,
}: {
  decisionService: DMN15__tDecisionService;
  namespace: string | undefined;
  index: number;
}) {
  const { setState } = useDmnEditorStoreApi();

  const thisDmn = useDmnEditorStore((s) => s.dmn);
  const { externalDmnsByNamespace, allFeelVariableUniqueNames } = useDmnEditorDerivedStore();

  const allDrgElementsByHref = useMemo(() => {
    const ret: AllKnownDrgElementsByHref = new Map();

    const allDmns = [{ model: thisDmn.model }, ...externalDmnsByNamespace.values()];

    for (let i = 0; i < allDmns.length; i++) {
      const anyDmn = allDmns[i]!;

      const namespace = anyDmn.model.definitions["@_namespace"];

      const drgElements = anyDmn.model.definitions.drgElement ?? [];
      for (let i = 0; i < drgElements.length; i++) {
        const element = drgElements[i];
        if (element.__$$element === "decision" || element.__$$element === "inputData") {
          ret.set(buildXmlHref({ namespace, id: element["@_id"]! }), element);
        }
      }
    }

    return ret;
  }, [externalDmnsByNamespace, thisDmn]);

  const thisDmnsNamespace = useDmnEditorStore((s) => s.dmn.model.definitions["@_namespace"]);
  const isReadonly = !!namespace && namespace !== thisDmnsNamespace;

  return (
    <>
      <FormGroup label="Name">
        <InlineFeelNameInput
          isPlain={false}
          id={decisionService["@_id"]!}
          name={decisionService["@_name"]}
          isReadonly={isReadonly}
          shouldCommitOnBlur={true}
          className={"pf-c-form-control"}
          onRenamed={(newName) => {
            setState((state) => {
              renameDrgElement({
                definitions: state.dmn.model.definitions,
                index,
                newName,
              });
            });
          }}
          allUniqueNames={allFeelVariableUniqueNames}
        />
      </FormGroup>

      <FormGroup label="Data type">
        <TypeRefSelector
          typeRef={decisionService.variable?.["@_typeRef"]}
          onChange={(newTypeRef) => {
            setState((state) => {
              (state.dmn.model.definitions.drgElement![index] as DMN15__tDecisionService).variable!["@_typeRef"] =
                newTypeRef;
            });
          }}
        />
      </FormGroup>

      <FormGroup label="Description">
        <TextArea
          aria-label={"Description"}
          type={"text"}
          isDisabled={isReadonly}
          value={decisionService.description}
          onChange={(newDescription) => {
            setState((state) => {
              (state.dmn.model.definitions.drgElement![index] as DMN15__tDecisionService).description = newDescription;
            });
          }}
          placeholder={"Enter a description..."}
          style={{ resize: "vertical", minHeight: "40px" }}
          rows={6}
        />
      </FormGroup>

      <FormGroup label="ID">
        <ClipboardCopy isReadOnly={true} hoverTip="Copy" clickTip="Copied">
          {decisionService["@_id"]}
        </ClipboardCopy>
      </FormGroup>

      <FormGroup label="Output decisions">
        <DecisionServiceElementList
          decisionServiceNamespace={namespace}
          elements={decisionService.outputDecision}
          allDrgElementsByHref={allDrgElementsByHref}
        />
      </FormGroup>
      <FormGroup label="Encapsulated decisions">
        <DecisionServiceElementList
          decisionServiceNamespace={namespace}
          elements={decisionService.encapsulatedDecision}
          allDrgElementsByHref={allDrgElementsByHref}
        />
      </FormGroup>
      <FormGroup label="Input decisions">
        <DecisionServiceElementList
          decisionServiceNamespace={namespace}
          elements={decisionService.inputDecision}
          allDrgElementsByHref={allDrgElementsByHref}
        />
      </FormGroup>
      <FormGroup label="Input data">
        <DecisionServiceElementList
          decisionServiceNamespace={namespace}
          elements={decisionService.inputData}
          allDrgElementsByHref={allDrgElementsByHref}
        />
      </FormGroup>

      <DocumentationLinksFormGroup
        value={decisionService.extensionElements?.["kie:attachment"]}
        onChange={(newExtensionElements) => {
          setState((state) => {
            (state.dmn.model.definitions.drgElement![index] as DMN15__tDecisionService).extensionElements = {
              "kie:attachment": newExtensionElements,
            };
          });
        }}
      />
    </>
  );
}

export function DecisionServiceElementList({
  decisionServiceNamespace,
  elements,
  allDrgElementsByHref,
}: {
  decisionServiceNamespace: string | undefined;
  elements: DMN15__tDecisionService["outputDecision"];
  allDrgElementsByHref: AllKnownDrgElementsByHref;
}) {
  const thisDmnsNamespace = useDmnEditorStore((s) => s.dmn.model.definitions["@_namespace"]);

  return (
    <ul>
      {(elements ?? []).length <= 0 && (
        <li>
          <small>
            <i>(Empty)</i>
          </small>
        </li>
      )}
      {(elements ?? []).map((e) => {
        const localHref = parseXmlHref(e["@_href"]);

        // If the localHref has a namespace, then that's the one to use, as it can be that an external node is pointing to another external node in their perspective
        // E.g., (This DMN) --includes--> (DMN A) --includes--> (DMN B)
        // In this case, localHref will have DMN B's namespace, and we need to respect it. It `DMN B` in included in `This DMN`, then
        // we can resolve it, otherwise, the dmnObject referenced by localHref won't be present on `dmnObjectsByHref`, and we'll only show the href.
        // Now, if the localHref doesn't have a namespace, then it is local to the model where the Decision Service is declared, so we use `decisionServiceNamespace`.
        // If none of that is true, then it means that the Decision Service is local to "This DMN", so the namespace is simply "".
        const resolvedNamespace = localHref.namespace ?? decisionServiceNamespace ?? thisDmnsNamespace;

        const potentialExternalHref = buildXmlHref({
          namespace: resolvedNamespace,
          id: localHref.id,
        });

        return (
          <li key={potentialExternalHref}>
            <DmnObjectListItem
              dmnObjectHref={potentialExternalHref}
              dmnObject={allDrgElementsByHref.get(potentialExternalHref)}
              relativeToNamespace={thisDmnsNamespace}
              namespace={resolvedNamespace}
            />
          </li>
        );
      })}
    </ul>
  );
}
