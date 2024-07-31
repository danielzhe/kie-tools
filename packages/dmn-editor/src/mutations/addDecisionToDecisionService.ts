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

import { DMN15__tDefinitions, DMNDI15__DMNShape } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { getContainmentRelationship, getDecisionServiceDividerLineLocalY } from "../diagram/maths/DmnMaths";
import { addOrGetDrd } from "./addOrGetDrd";
import { repopulateInputDataAndDecisionsOnDecisionService } from "./repopulateInputDataAndDecisionsOnDecisionService";
import { SnapGrid } from "../store/Store";
import { MIN_NODE_SIZES } from "../diagram/nodes/DefaultSizes";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { Normalized } from "../normalization/normalize";
import {
  DMN15__tBusinessKnowledgeModel,
  DMN15__tDecision,
  DMN15__tDecisionService,
  DMN15__tInputData,
  DMN15__tKnowledgeSource,
} from "@kie-tools/dmn-marshaller/src/schemas/dmn-1_5/ts-gen/types";

export type DrgElement =
  | Normalized<{ __$$element: "decision" } & DMN15__tDecision>
  | Normalized<{ __$$element: "businessKnowledgeModel" } & DMN15__tBusinessKnowledgeModel>
  | Normalized<{ __$$element: "decisionService" } & DMN15__tDecisionService>
  | Normalized<{ __$$element: "inputData" } & DMN15__tInputData>
  | Normalized<{ __$$element: "knowledgeSource" } & DMN15__tKnowledgeSource>;

export function addDecisionToDecisionService({
  definitions,
  drgElement,
  decisionServiceId,
  drdIndex,
  snapGrid,
  decisionShape,
  elementId,
}: {
  definitions: Normalized<DMN15__tDefinitions>;
  drgElement: DrgElement;
  decisionServiceId: string;
  drdIndex: number;
  snapGrid: SnapGrid;
  decisionShape: Normalized<DMNDI15__DMNShape>;
  elementId: string;
}) {
  console.debug(`DMN MUTATION: Adding Decision '${elementId}' to Decision Service '${decisionServiceId}'`);

  if (drgElement?.__$$element !== "decision") {
    throw new Error(`DMN MUTATION: DRG Element with id '${elementId}' is either not a Decision or doesn't exist.`);
  }

  const decisionService = definitions.drgElement?.find((s) => s["@_id"] === decisionServiceId);
  if (decisionService?.__$$element !== "decisionService") {
    throw new Error(
      `DMN MUTATION: DRG Element with id '${decisionServiceId}' is either not a Decision Service or doesn't exist.`
    );
  }

  const diagram = addOrGetDrd({ definitions, drdIndex });

  const decisionServiceShape = diagram.diagramElements.find(
    (s) => s["@_dmnElementRef"] === decisionServiceId && s.__$$element === "dmndi:DMNShape"
  ) as Normalized<DMNDI15__DMNShape>;

  const section = getSectionForDecisionInsideDecisionService({ decisionShape, decisionServiceShape, snapGrid });
  if (section === "encapsulated") {
    decisionService.encapsulatedDecision ??= [];
    decisionService.encapsulatedDecision.push({ "@_href": `${elementId}` });
  } else if (section === "output") {
    decisionService.outputDecision ??= [];
    decisionService.outputDecision.push({ "@_href": `${elementId}` });
  } else {
    throw new Error(`DMN MUTATION: Invalid section to add decision to: '${section}' `);
  }

  repopulateInputDataAndDecisionsOnDecisionService({ definitions, decisionService });
}

export function getSectionForDecisionInsideDecisionService({
  decisionShape,
  decisionServiceShape,
  snapGrid,
}: {
  decisionShape: Normalized<DMNDI15__DMNShape>;
  decisionServiceShape: Normalized<DMNDI15__DMNShape>;
  snapGrid: SnapGrid;
}): "output" | "encapsulated" {
  if (!decisionShape?.["dc:Bounds"] || !decisionServiceShape?.["dc:Bounds"]) {
    throw new Error(
      `DMN MUTATION: Can't determine Decision Service section for Decision '${decisionShape["@_dmnElementRef"]}' because it doens't have a DMNShape.`
    );
  }

  const contaimentRelationship = getContainmentRelationship({
    bounds: decisionShape["dc:Bounds"],
    container: decisionServiceShape["dc:Bounds"],
    divingLineLocalY: getDecisionServiceDividerLineLocalY(decisionServiceShape),
    snapGrid,
    isAlternativeInputDataShape: false,
    containerMinSizes: MIN_NODE_SIZES[NODE_TYPES.decisionService],
    boundsMinSizes: MIN_NODE_SIZES[NODE_TYPES.decision],
  });

  if (!contaimentRelationship.isInside) {
    throw new Error(
      `DMN MUTATION: Decision '${decisionShape["@_dmnElementRef"]}' can't be added to Decision Service '${decisionServiceShape["@_dmnElementRef"]}' because its shape is not visually contained by the Decision Service's shape.`
    );
  }

  return contaimentRelationship.section === "upper" ? "output" : "encapsulated";
}
