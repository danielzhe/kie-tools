import {
  DMN15__tDecisionService,
  DMN15__tDefinitions,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";

export function repopulateInputDataAndDecisionsOnDecisionService({
  definitions,
  decisionService,
}: {
  definitions: DMN15__tDefinitions;
  decisionService: DMN15__tDecisionService;
}) {
  decisionService.inputData = [];
  decisionService.inputDecision = [];

  const hrefsToDecisionsInsideDecisionService = new Set([
    ...(decisionService.outputDecision ?? []).map((s) => s["@_href"]),
    ...(decisionService.encapsulatedDecision ?? []).map((s) => s["@_href"]),
  ]);

  const requirements = new Array<{ id: string; type: "decisionIr" | "inputDataIr" }>();
  for (let i = 0; i < definitions.drgElement!.length; i++) {
    const drgElement = definitions.drgElement![i];
    if (!hrefsToDecisionsInsideDecisionService.has(`#${drgElement["@_id"]}`) || drgElement.__$$element !== "decision") {
      continue;
    }

    (drgElement.informationRequirement ?? []).flatMap((ir) => {
      if (ir.requiredDecision) {
        requirements.push({ id: ir.requiredDecision["@_href"], type: "decisionIr" });
      } else if (ir.requiredInput) {
        requirements.push({ id: ir.requiredInput["@_href"], type: "inputDataIr" });
      }
    });
  }

  const inputDatas = new Set<string>(); // Using Set for uniqueness
  const inputDecisions = new Set<string>(); // Using Set for uniqueness

  const requirementsArray = [...requirements];
  for (let i = 0; i < requirementsArray.length; i++) {
    const r = requirementsArray[i];
    if (r.type === "inputDataIr") {
      inputDatas.add(r.id);
    } else if (r.type === "decisionIr") {
      inputDecisions.add(r.id);
    } else {
      throw new Error(`Invalid type of element to be referenced by DecisionService: '${r.type}'`);
    }
  }

  decisionService.inputData = [...inputDatas].map((i) => ({ "@_href": `#${i}` }));
  decisionService.inputDecision = [...inputDecisions].flatMap(
    (d) => (hrefsToDecisionsInsideDecisionService.has(`#${d}`) ? [] : { "@_href": `#${d}` }) // Makes sure output and encapsulated Decisions are not listed as inputDecisions
  );
}
