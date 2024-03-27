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
import { useEffect, useState, useCallback } from "react";
import { BeeGwtService, DmnBuiltInDataType, BoxedExpression } from "../../src/api";
import { getDefaultExpressionDefinitionByLogicType } from "./defaultExpression";
import type { Meta, StoryObj } from "@storybook/react";
import { BoxedExpressionEditorStory, BoxedExpressionEditorStoryArgs } from "../boxedExpressionStoriesWrapper";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Button, Flex, FlexItem, Tooltip } from "@patternfly/react-core/dist/js";
import { canDriveExpressionDefinition, canDriveWidthsById } from "../useCases/CanDrive/CanDrive.stories";
import {
  findEmployeesByKnowledgeExpression,
  findEmployeesByKnowledgeWidthsById,
} from "../useCases/FindEmployees/FindEmployees.stories";
import {
  postBureauAffordabilityExpression,
  postBureauAffordabilityWidthsById,
} from "../useCases/LoanOriginations/RoutingDecisionService/PostBureauAffordability/PostBureauAffordability.stories";

/**
 * Constants copied from tests to fix debugger
 */
const dataTypes = [
  { name: "<Undefined>", isCustom: false },
  { name: "Any", isCustom: false },
  { name: "boolean", isCustom: false },
  { name: "context", isCustom: false },
  { name: "date", isCustom: false },
  { name: "date and time", isCustom: false },
  { name: "days and time duration", isCustom: false },
  { name: "number", isCustom: false },
  { name: "string", isCustom: false },
  { name: "time", isCustom: false },
  { name: "years and months duration", isCustom: false },
  { name: "tPerson", isCustom: true },
];

const pmmlDocuments = [
  {
    document: "document",
    modelsFromDocument: [
      {
        model: "model",
        parametersFromModel: [{ "@_id": "p1", "@_name": "p-1", "@_typeRef": DmnBuiltInDataType.Number }],
      },
    ],
  },
  {
    document: "mining pmml",
    modelsFromDocument: [
      {
        model: "MiningModelSum",
        parametersFromModel: [
          { "@_id": "i1", "@_name": "input1", "@_typeRef": DmnBuiltInDataType.Any },
          { "@_id": "i2", "@_name": "input2", "@_typeRef": DmnBuiltInDataType.Any },
          { "@_id": "i3", "@_name": "input3", "@_typeRef": DmnBuiltInDataType.Any },
        ],
      },
    ],
  },
  {
    document: "regression pmml",
    modelsFromDocument: [
      {
        model: "RegressionLinear",
        parametersFromModel: [
          { "@_id": "i1", "@_name": "i1", "@_typeRef": DmnBuiltInDataType.Number },
          { "@_id": "i2", "@_name": "i2", "@_typeRef": DmnBuiltInDataType.Number },
        ],
      },
    ],
  },
];

const INITIAL_EXPRESSION: BoxedExpression | undefined = undefined;
const INITIAL_WIDTHS_BY_ID: Record<string, number[]> = {};

//Defining global function that will be available in the Window namespace and used by the BoxedExpressionEditor component
const beeGwtService: BeeGwtService = {
  getDefaultExpressionDefinition(logicType, typeRef) {
    return {
      expression: getDefaultExpressionDefinitionByLogicType(logicType, typeRef, 0),
      widthsById: new Map(),
    };
  },
  openDataTypePage(): void {},
  selectObject(): void {},
};

function App() {
  const [version, setVersion] = useState(-1);
  const [boxedExpression, setBoxedExpression] = useState<BoxedExpression | undefined>(INITIAL_EXPRESSION);
  const [widthsById, setWidthsById] = useState<Record<string, number[]>>(INITIAL_WIDTHS_BY_ID);

  useEffect(() => {
    setVersion((prev) => prev + 1);
  }, [boxedExpression]);

  const setSample = useCallback((sample: BoxedExpression | undefined, widthsById: Record<string, number[]>) => {
    setBoxedExpression(sample);
    setWidthsById(widthsById);
  }, []);

  return (
    <div>
      <Flex direction={{ default: "column" }}>
        <FlexItem>
          <Flex style={{ width: "96vw" }}>
            <FlexItem>
              <Button onClick={() => setSample(INITIAL_EXPRESSION, INITIAL_WIDTHS_BY_ID)}>Empty</Button>
            </FlexItem>
            <FlexItem>
              <Button onClick={() => setSample(canDriveExpressionDefinition, canDriveWidthsById)}>Can Drive?</Button>
            </FlexItem>
            <FlexItem>
              <Button onClick={() => setSample(findEmployeesByKnowledgeExpression, {})}>
                Find Employees by Knowledge
              </Button>
            </FlexItem>
            <FlexItem>
              <Button onClick={() => setSample(postBureauAffordabilityExpression, {})}>Affordability</Button>
            </FlexItem>
            <FlexItem align={{ default: "alignRight" }}>
              <Tooltip content={"This number updates everytime the expressionDefinition object is updated"}>
                <Title headingLevel="h2">Updates count: {version}</Title>
              </Tooltip>
            </FlexItem>
          </Flex>
        </FlexItem>
        <FlexItem>
          <div>
            {BoxedExpressionEditorStory({
              expressionHolderId: "_00000000-0000-0000-0000-000000000000",
              expression: boxedExpression,
              onExpressionChange: setBoxedExpression,
              widthsById: widthsById,
              onWidthsChange: setWidthsById,
              isResetSupportedOnRootExpression: true,
            })}
          </div>
        </FlexItem>
      </Flex>
    </div>
  );
}

const meta: Meta<BoxedExpressionEditorStoryArgs> = {
  title: "Dev/Web App",
  component: App,
};

export default meta;
type Story = StoryObj<BoxedExpressionEditorStoryArgs>;

export const WebApp: Story = {
  render: (args) => App(),
  argTypes: {
    expression: { control: "object" },
    widthsById: { control: "object" },
  },
  args: {
    expressionHolderId: undefined, // Needs to be here to be displayed.
    expression: undefined, // Needs to be here to be displayed.
    widthsById: {}, // Needs to be here to be displayed.
    dataTypes: dataTypes,
    beeGwtService: beeGwtService,
    pmmlDocuments: pmmlDocuments,
  },
};
