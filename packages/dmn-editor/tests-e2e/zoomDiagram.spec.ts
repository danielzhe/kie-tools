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

import { expect, test } from "./__fixtures__/base";
import { NodeType } from "./__fixtures__/nodes";
import { TabName } from "./__fixtures__/editor";

test.beforeEach(async ({ editor }) => {
  await editor.open();
});

test.describe("Zoom and Panning Diagram", () => {
  test("should zoom in diagram", async ({ nodes, palette, diagram, multipleNodesPropertiesPanel }) => {
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 100, y: 10 } });
    await diagram.resetFocus();
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 100, y: 110 } });
    await diagram.resetFocus();
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 100, y: 210 } });
    await diagram.zoomIn({ clicks: 1 });
    await expect(diagram.get()).toHaveScreenshot("zoom-in-diagram.png");
  });

  test("should zoom out diagram", async ({ nodes, palette, diagram, multipleNodesPropertiesPanel }) => {
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 100, y: 10 } });
    await diagram.resetFocus();
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 100, y: 110 } });
    await diagram.resetFocus();
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 100, y: 210 } });
    await diagram.zoomOut({ clicks: 2 });
    await expect(diagram.get()).toHaveScreenshot("zoom-out-diagram.png");
  });

  test("should fit to view diagram", async ({ nodes, palette, diagram, multipleNodesPropertiesPanel }) => {
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 10, y: 10 } });
    await diagram.resetFocus();
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 400, y: 400 } });
    await diagram.resetFocus();
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 200, y: 200 } });
    await diagram.zoomIn({ clicks: 2 });
    await diagram.fitView();
    await expect(diagram.get()).toHaveScreenshot("fit-to-view-diagram.png");
  });

  test("should keep view settings after swap tabs", async ({ palette, diagram, page, editor }) => {
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 100, y: 100 } });
    await diagram.resetFocus();
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 200, y: 200 } });
    await diagram.resetFocus();
    await palette.dragNewNode({ type: NodeType.DECISION, targetPosition: { x: 200, y: 300 } });
    await diagram.zoomOut({ clicks: 3 });

    // This is to pan the viewport, to make more changes on it despite the zoom to
    // make sure that they are kept after swapping between tabs.
    await page.mouse.move(500, 500);
    await page.mouse.down({ button: "middle" });
    await page.mouse.move(300, 300);
    await page.mouse.up({ button: "middle" });

    await editor.changeTab({ tab: TabName.DATA_TYPES });
    await editor.changeTab({ tab: TabName.EDITOR });

    await expect(diagram.get()).toHaveScreenshot("keep-view-settings-after-swap-tabs.png");
  });
});
