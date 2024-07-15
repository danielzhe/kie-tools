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

import { expect, test } from "../../__fixtures__/base";

test.describe("Relation context menu", () => {
  test.describe("Rows control", () => {
    test.beforeEach(async ({ stories }) => {
      await stories.openRelation();
    });

    test("shouldn't render column context menu", async ({ bee }) => {
      const cell = bee.expression.asRelation().cellAt({ row: 1, column: 1 });
      await cell.fill('"test"');
      await cell.contextMenu.open();

      await expect(cell.contextMenu.heading("ROWS")).toBeAttached();
      await expect(cell.contextMenu.heading("SELECTION")).toBeAttached();
      await expect(cell.contextMenu.heading("COLUMNS")).toBeAttached();
    });

    test("should open row context menu and insert row above", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.open();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.option("Insert above").click();
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("new cell");
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 1 }).content).toContainText("new cell");
      await expect(bee.expression.asRelation().cellAt({ row: 2, column: 1 }).content).toContainText("test");
    });

    test("should open row context menu and insert row below", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.open();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.option("Insert below").click();
      await bee.expression.asRelation().cellAt({ row: 2, column: 1 }).fill("new cell");
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 1 }).content).toContainText("test");
      await expect(bee.expression.asRelation().cellAt({ row: 2, column: 1 }).content).toContainText("new cell");
    });

    test("should open row context menu and insert multiples rows above", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.open();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.option("Insert").click();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.button("plus").click();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.button("Insert").click();
      await expect(bee.expression.asRelation().cellAt({ row: 4, column: 1 }).content).toContainText("test");
    });

    test("should open row context menu and insert multiples rows below", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.open();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.option("Insert").click();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.button("minus").click();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.radio("Below").click();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.button("Insert").click();

      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 1 }).content).toContainText("test");
      await expect(bee.expression.asRelation().cellAt({ row: 2, column: 1 }).content).not.toContainText("test");
    });

    test("should open row context menu and delete row", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.open();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.option("Insert above").click();

      await expect(bee.expression.asRelation().cellAt({ row: 2, column: 1 }).content).toContainText("test");

      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.open();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.option("Delete").click();

      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 1 }).content).toContainText("test");
    });

    test("should open row context menu and duplicate row", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.open();
      await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.option("Duplicate").click();

      await expect(bee.expression.asRelation().cellAt({ row: 2, column: 1 }).content).toContainText("test");
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 1 }).content).toContainText("test");
    });
  });

  test.describe("Columns controls", () => {
    test.beforeEach(async ({ stories }) => {
      await stories.openRelation();
    });

    test("shouldn't render row context menu", async ({ bee }) => {
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.open();
      await expect(bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.heading("COLUMNS")).toBeAttached();
      await expect(bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.heading("SELECTION")).toBeAttached();
      await expect(bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.heading("ROWS")).not.toBeAttached();
    });

    test("should open column context menu and insert column right", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.open();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.option("Insert right").click();
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 1 }).content).toContainText("test");
    });

    test("should open column context menu and insert column left", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.open();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.option("Insert left").click();
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 2 }).content).toContainText("test");
    });

    test("should open column context menu and insert multiples columns on right", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test-1");
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.open();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.option("Insert").click();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.button("plus").click();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.button("Insert").click();
      await bee.expression.asRelation().cellAt({ row: 1, column: 2 }).fill("test-2");
      await bee.expression.asRelation().cellAt({ row: 1, column: 3 }).fill("test-3");
      await bee.expression.asRelation().cellAt({ row: 1, column: 4 }).fill("test-4");

      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 1 }).content).toContainText("test-1");
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 2 }).content).toContainText("test-2");
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 3 }).content).toContainText("test-3");
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 4 }).content).toContainText("test-4");
    });

    test("should open column context menu and insert multiples columns on left", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test-1");
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.open();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.option("Insert").click();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.button("minus").click();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.radio("To the left").click();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.button("Insert").click();
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test-2");

      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 1 }).content).toContainText("test-2");
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 2 }).content).toContainText("test-1");
    });

    test("should open column context menu and delete column", async ({ bee }) => {
      await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.open();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.option("Insert left").click();
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 2 }).content).toContainText("test");
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.open();
      await bee.expression.asRelation().columnHeaderAtIndex(1).contextMenu.option("Delete").click();
      await expect(bee.expression.asRelation().cellAt({ row: 1, column: 1 }).content).toContainText("test");
    });
  });

  test("should reset insert multiples menu when opening another cell context menu", async ({ bee, stories }) => {
    await stories.openRelation();
    await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).fill("test");
    await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).contextMenu.open();
    await bee.expression.asRelation().cellAt({ row: 1, column: 1 }).contextMenu.option("Insert").first().click();

    await bee.expression.asRelation().cellAt({ row: 1, column: 0 }).contextMenu.open();

    await expect(
      bee.expression
        .asRelation()
        .cellAt({
          row: 1,
          column: 0,
        })
        .contextMenu.heading("ROWS")
    ).toBeAttached();

    await expect(
      bee.expression
        .asRelation()
        .cellAt({
          row: 1,
          column: 0,
        })
        .contextMenu.heading("SELECTION")
    ).toBeAttached();
  });
});
