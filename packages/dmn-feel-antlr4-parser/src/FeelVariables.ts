/*
 *  Licensed to the Apache Software Foundation (ASF) under one
 *  or more contributor license agreements.  See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership.  The ASF licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

import { FeelVariablesParser } from "./parser/FeelVariablesParser";
import { DmnDefinitions, VariablesRepository } from "./parser/VariablesRepository";
import { DmnLatestModel, getMarshaller } from "@kie-tools/dmn-marshaller";
import { ParsedExpression } from "./parser/ParsedExpression";
import { Expression } from "./parser/Expression";

export class FeelVariables {
  private readonly parser: FeelVariablesParser;
  private readonly repository: VariablesRepository;

  constructor(dmnDefinitions: DmnDefinitions, externalDefinitions?: Map<string, DmnLatestModel>) {
    this.repository = new VariablesRepository(dmnDefinitions, externalDefinitions);
    this.parser = new FeelVariablesParser(this.repository);
  }

  static fromModelXml(xml: string): FeelVariables {
    const def = this.getDefinitions(xml);
    return new FeelVariables(def, new Map<string, DmnLatestModel>());
  }

  static getDefinitions(xml: string) {
    const marshaller = getMarshaller(xml, { upgradeTo: "latest" });
    return marshaller.parser.parse().definitions;
  }

  public parse(variableContextUuid: string, expression: string): ParsedExpression {
    return this.parser.parse(variableContextUuid, expression);
  }

  public updateVariableType(variableUuid: string, newType: string) {
    this.repository.updateVariableType(variableUuid, newType);
  }

  public renameVariable(variableUuid: string, newName: string) {
    this.repository.renameVariable(variableUuid, newName);
  }

  public renameImport(oldName: string, newImportName: string) {
    this.repository.renameImport(oldName, newImportName);
  }

  public addVariableToContext(variableUuid: string, variableName: string, parentUuid: string, childUuid?: string) {
    this.repository.addVariableToContext(variableUuid, variableName, parentUuid, childUuid);
  }

  public removeVariable(variableUuid: string, removeChildren?: boolean) {
    this.repository.removeVariable(variableUuid, removeChildren);
  }

  get expressions(): Map<string, Expression> {
    return this.repository.expressions;
  }

  public applyChangesToDefinition() {
    for (const expression of this.expressions.values()) {
      expression.applyChangesToExpressionSource();
    }
  }
}
