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

import { Locator } from "@playwright/test";
import { Monaco } from "../../__fixtures__/monaco";

import { ExpressionElementEntry } from "../expressionContainer";
import { NameAndDataTypeCell } from "../nameAndDataTypeCell";

export class ContextExpressionElement {
  constructor(
    private locator: Locator,
    private monaco: Monaco
  ) {}

  public entry(index: number) {
    return new ExpressionElementEntry(this.locator.getByTestId(`expression-row-${index}`).nth(0), this.monaco);
  }

  get resultEntry() {
    return new ExpressionElementEntry(this.locator.locator(`.additional-row`).nth(0), this.monaco);
  }

  async entriesCount() {
    return (await this.locator.getByRole("row").count()) - 2;
  }

  async addEntryAboveOfEntryAtIndex(index: number) {
    await this.locator
      .getByTestId(`expression-row-${index}`)
      .getByTestId("expression-column-1")
      .nth(0)
      .hover({
        position: {
          x: 0,
          y: 0,
        },
      });

    await this.locator
      .getByTestId(`expression-row-${index}`)
      .getByTestId("expression-column-1")
      .nth(0)
      .locator("svg")
      .click();
  }

  async addEntryBelowOfEntryAtIndex(index: number) {
    await this.locator.getByTestId(`expression-row-${index}`).getByTestId("expression-column-1").nth(0).hover();

    await this.locator
      .getByTestId(`expression-row-${index}`)
      .getByTestId("expression-column-1")
      .nth(0)
      .locator("svg")
      .click();
  }

  get expressionHeaderCell() {
    return new NameAndDataTypeCell(this.locator.getByRole("columnheader").nth(0));
  }
}
