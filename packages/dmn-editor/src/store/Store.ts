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

import { DmnLatestModel } from "@kie-tools/dmn-marshaller";
import { DMN15__tImport } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { enableMapSet } from "immer";
import * as RF from "reactflow";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { ExternalModelsIndex } from "../DmnEditor";
import { DmnDiagramNodeData } from "../diagram/nodes/Nodes";
import { normalize, Normalized } from "../normalization/normalize";
import { ComputedStateCache } from "./ComputedStateCache";
import { computeAllFeelVariableUniqueNames } from "./computed/computeAllFeelVariableUniqueNames";
import { computeDataTypes } from "./computed/computeDataTypes";
import { computeDiagramData } from "./computed/computeDiagramData";
import { computeExternalModelsByType } from "./computed/computeExternalModelsByType";
import { computeImportsByNamespace } from "./computed/computeImportsByNamespace";
import { computeIndexedDrd } from "./computed/computeIndexes";
import { computeIsDropTargetNodeValidForSelection } from "./computed/computeIsDropTargetNodeValidForSelection";
import { DEFAULT_VIEWPORT } from "../diagram/Diagram";

enableMapSet(); // Necessary because `Computed` has a lot of Maps and Sets.

export interface DmnEditorDiagramNodeStatus {
  selected: boolean;
  dragging: boolean;
  resizing: boolean;
}

export interface DmnEditorDiagramEdgeStatus {
  selected: boolean;
  draggingWaypoint: boolean;
}

export interface DmnEditorDiagramDividerLineStatus {
  moving: boolean;
}

export interface SnapGrid {
  isEnabled: boolean;
  x: number;
  y: number;
}

export enum DiagramLhsPanel {
  NONE = "NONE",
  DRD_SELECTOR = "DRD_SELECTOR",
  DRG_NODES = "DRG_NODES",
  EXTERNAL_NODES = "EXTERNAL_NODES",
}

export type DropTargetNode = undefined | RF.Node<DmnDiagramNodeData>;

export interface State {
  dispatch: (s: State) => Dispatch;
  computed: (s: State) => Computed;
  dmn: { model: Normalized<DmnLatestModel> };
  focus: {
    consumableId: string | undefined;
  };
  settings: {
    readOnly: boolean;
  };
  boxedExpressionEditor: {
    activeDrgElementId: string | undefined;
    selectedObjectId: string | undefined;
    propertiesPanel: {
      isOpen: boolean;
    };
  };
  dataTypesEditor: {
    activeItemDefinitionId: string | undefined;
    expandedItemComponentIds: string[];
  };
  navigation: {
    tab: DmnEditorTab;
  };
  diagram: {
    autoLayout: {
      canAutoGenerateDrd: boolean;
    };
    __unsafeDrdIndex: number;
    edgeIdBeingUpdated: string | undefined;
    dropTargetNode: DropTargetNode;
    ongoingConnection: RF.OnConnectStartParams | undefined;
    propertiesPanel: {
      isOpen: boolean;
      elementId: string | undefined;
    };
    overlaysPanel: {
      isOpen: boolean;
    };
    openLhsPanel: DiagramLhsPanel;
    overlays: {
      enableNodeHierarchyHighlight: boolean;
      enableExecutionHitsHighlights: boolean;
      enableDataTypesToolbarOnNodes: boolean;
      enableCustomNodeStyles: boolean;
    };
    snapGrid: SnapGrid;
    _selectedNodes: Array<string>;
    _selectedEdges: Array<string>;
    draggingNodes: Array<string>;
    resizingNodes: Array<string>;
    draggingWaypoints: Array<string>;
    movingDividerLines: Array<string>;
    isEditingStyle: boolean;
    viewport: {
      x: number;
      y: number;
      zoom: number;
    };
  };
}

// Read this to understand why we need computed as part of the store.
// https://github.com/pmndrs/zustand/issues/132#issuecomment-1120467721
export type Computed = {
  isDiagramEditingInProgress(): boolean;

  importsByNamespace(): Map<string, DMN15__tImport>;

  indexedDrd(): ReturnType<typeof computeIndexedDrd>;

  getDiagramData(e: ExternalModelsIndex | undefined): ReturnType<typeof computeDiagramData>;

  isAlternativeInputDataShape(): boolean;

  isDropTargetNodeValidForSelection(e: ExternalModelsIndex | undefined): boolean;

  getExternalModelTypesByNamespace: (
    e: ExternalModelsIndex | undefined
  ) => ReturnType<typeof computeExternalModelsByType>;

  /**
   * Get a valid DRD index.
   * `__unsafeDrdIndex` can point to a DRD that doens't exist.
   */
  getDrdIndex(): number;

  getDataTypes(e: ExternalModelsIndex | undefined): ReturnType<typeof computeDataTypes>;

  getAllFeelVariableUniqueNames(): ReturnType<typeof computeAllFeelVariableUniqueNames>;
};

export type Dispatch = {
  dmn: {
    reset: (model: State["dmn"]["model"]) => void;
  };
  boxedExpressionEditor: {
    open: (id: string) => void;
    close: () => void;
  };
  diagram: {
    setNodeStatus: (nodeId: string, status: Partial<DmnEditorDiagramNodeStatus>) => void;
    setEdgeStatus: (edgeId: string, status: Partial<DmnEditorDiagramEdgeStatus>) => void;
    setDividerLineStatus: (decisionServiceId: string, status: Partial<DmnEditorDiagramDividerLineStatus>) => void;
  };
};

export enum DmnEditorTab {
  EDITOR,
  DATA_TYPES,
  INCLUDED_MODELS,
}

export const defaultStaticState = (): Omit<State, "dmn" | "dispatch" | "computed"> => ({
  boxedExpressionEditor: {
    activeDrgElementId: undefined,
    selectedObjectId: undefined,
    propertiesPanel: {
      isOpen: false,
    },
  },
  navigation: {
    tab: DmnEditorTab.EDITOR,
  },
  focus: {
    consumableId: undefined,
  },
  settings: {
    readOnly: false,
  },
  dataTypesEditor: {
    activeItemDefinitionId: undefined,
    expandedItemComponentIds: [],
  },
  diagram: {
    autoLayout: {
      canAutoGenerateDrd: false,
    },
    __unsafeDrdIndex: 0,
    edgeIdBeingUpdated: undefined,
    dropTargetNode: undefined,
    ongoingConnection: undefined,
    propertiesPanel: {
      isOpen: false,
      elementId: undefined,
    },
    overlaysPanel: {
      isOpen: false,
    },
    openLhsPanel: DiagramLhsPanel.NONE,
    overlays: {
      enableNodeHierarchyHighlight: false,
      enableExecutionHitsHighlights: false,
      enableCustomNodeStyles: true,
      enableDataTypesToolbarOnNodes: true,
    },
    snapGrid: {
      isEnabled: true,
      x: 20,
      y: 20,
    },
    _selectedNodes: [],
    _selectedEdges: [],
    draggingNodes: [],
    resizingNodes: [],
    draggingWaypoints: [],
    movingDividerLines: [],
    isEditingStyle: false,
    viewport: DEFAULT_VIEWPORT,
  },
});

export function createDmnEditorStore(model: DmnLatestModel, computedCache: ComputedStateCache<Computed>) {
  const { diagram, ...defaultState } = defaultStaticState();
  return create(
    immer<State>(() => ({
      dmn: {
        model: normalize(model),
      },
      ...defaultState,
      diagram: {
        ...diagram,
        // A model without DRD and with DRG element can be auto generated
        autoLayout: {
          canAutoGenerateDrd:
            model.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"] === undefined &&
            model.definitions.drgElement !== undefined,
        },
      },
      dispatch(s: State) {
        return {
          dmn: {
            reset: () => {
              s.diagram._selectedNodes = [];
              s.diagram.draggingNodes = [];
              s.diagram.resizingNodes = [];
              s.navigation.tab = DmnEditorTab.EDITOR;
              s.boxedExpressionEditor.activeDrgElementId = undefined;
              s.boxedExpressionEditor.selectedObjectId = undefined;
            },
          },
          boxedExpressionEditor: {
            open: (id) => {
              s.boxedExpressionEditor.activeDrgElementId = id;
              s.boxedExpressionEditor.selectedObjectId = undefined;
              s.boxedExpressionEditor.propertiesPanel.isOpen = s.diagram.propertiesPanel.isOpen;
            },
            close: () => {
              s.diagram.propertiesPanel.isOpen = s.boxedExpressionEditor.propertiesPanel.isOpen;
              s.boxedExpressionEditor.activeDrgElementId = undefined;
              s.boxedExpressionEditor.selectedObjectId = undefined;
            },
          },
          diagram: {
            setNodeStatus: (nodeId, newStatus) => {
              //selected
              if (newStatus.selected !== undefined) {
                if (newStatus.selected) {
                  s.diagram._selectedNodes.push(nodeId);
                } else {
                  s.diagram._selectedNodes = s.diagram._selectedNodes.filter((s) => s !== nodeId);
                }
              }
              //dragging
              if (newStatus.dragging !== undefined) {
                if (newStatus.dragging) {
                  s.diagram.draggingNodes.push(nodeId);
                } else {
                  s.diagram.draggingNodes = s.diagram.draggingNodes.filter((s) => s !== nodeId);
                }
              }
              // resizing
              if (newStatus.resizing !== undefined) {
                if (newStatus.resizing) {
                  s.diagram.resizingNodes.push(nodeId);
                } else {
                  s.diagram.resizingNodes = s.diagram.resizingNodes.filter((s) => s !== nodeId);
                }
              }
            },
            setEdgeStatus: (edgeId, newStatus) => {
              //selected
              if (newStatus.selected !== undefined) {
                if (newStatus.selected) {
                  s.diagram._selectedEdges.push(edgeId);
                } else {
                  s.diagram._selectedEdges = s.diagram._selectedEdges.filter((s) => s !== edgeId);
                }
              }
              //dragging
              if (newStatus.draggingWaypoint !== undefined) {
                if (newStatus.draggingWaypoint) {
                  s.diagram.draggingWaypoints.push(edgeId);
                } else {
                  s.diagram.draggingWaypoints = s.diagram.draggingWaypoints.filter((s) => s !== edgeId);
                }
              }
            },
            setDividerLineStatus: (decisionServiceId, newStatus) => {
              //dragging
              if (newStatus.moving !== undefined) {
                if (newStatus.moving) {
                  s.diagram.movingDividerLines.push(decisionServiceId);
                } else {
                  s.diagram.movingDividerLines = s.diagram.movingDividerLines.filter((s) => s !== decisionServiceId);
                }
              }
            },
          },
        };
      },
      computed(s: State) {
        return {
          isDiagramEditingInProgress: () => {
            return computedCache.cached(
              "isDiagramEditingInProgress",
              (
                draggingNodesCount: number,
                resizingNodesCount: number,
                draggingWaypointsCount: number,
                movingDividerLinesCount: number,
                isisEditingStyle: boolean
              ) =>
                draggingNodesCount > 0 ||
                resizingNodesCount > 0 ||
                draggingWaypointsCount > 0 ||
                movingDividerLinesCount > 0 ||
                isisEditingStyle,
              [
                s.diagram.draggingNodes.length,
                s.diagram.resizingNodes.length,
                s.diagram.draggingWaypoints.length,
                s.diagram.movingDividerLines.length,
                s.diagram.isEditingStyle,
              ]
            );
          },

          indexedDrd: () => {
            return computedCache.cached("indexedDrd", computeIndexedDrd, [
              s.dmn.model.definitions["@_namespace"],
              s.dmn.model.definitions,
              s.computed(s).getDrdIndex(),
            ]);
          },

          importsByNamespace: () => {
            return computedCache.cached("importsByNamespace", computeImportsByNamespace, [
              s.dmn.model.definitions.import,
            ]);
          },

          isAlternativeInputDataShape: () =>
            computedCache.cached(
              "isAlternativeInputDataShape",
              (drdIndex, dmnDiagram) => dmnDiagram?.[drdIndex]?.["@_useAlternativeInputDataShape"] ?? false,
              [s.computed(s).getDrdIndex(), s.dmn.model.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"]] as const
            ),

          isDropTargetNodeValidForSelection: (externalModelsByNamespace: ExternalModelsIndex | undefined) =>
            computedCache.cached("isDropTargetNodeValidForSelection", computeIsDropTargetNodeValidForSelection, [
              s.diagram.dropTargetNode,
              s.computed(s).getDiagramData(externalModelsByNamespace),
            ]),

          getDrdIndex: () =>
            computedCache.cached(
              "getDrdIndex",
              (__unsafeDrdIndex, dmnDiagram) =>
                dmnDiagram?.length && __unsafeDrdIndex > dmnDiagram.length - 1
                  ? dmnDiagram.length - 1
                  : __unsafeDrdIndex,
              [s.diagram.__unsafeDrdIndex, s.dmn.model.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"]] as const
            ),

          getDataTypes: (externalModelsByNamespace: ExternalModelsIndex | undefined) =>
            computedCache.cached("getDataTypes", computeDataTypes, [
              s.dmn.model.definitions["@_namespace"],
              s.dmn.model.definitions.itemDefinition,
              s.computed(s).getExternalModelTypesByNamespace(externalModelsByNamespace),
              s.computed(s).importsByNamespace(),
            ]),

          getAllFeelVariableUniqueNames: () =>
            computedCache.cached("getAllFeelVariableUniqueNames", computeAllFeelVariableUniqueNames, [
              s.dmn.model.definitions.drgElement,
              s.dmn.model.definitions.import,
            ]),

          getExternalModelTypesByNamespace: (externalModelsByNamespace: ExternalModelsIndex | undefined) =>
            computedCache.cached("getExternalModelTypesByNamespace", computeExternalModelsByType, [
              s.dmn.model.definitions.import,
              externalModelsByNamespace,
            ]),

          getDiagramData: (externalModelsByNamespace: ExternalModelsIndex | undefined) =>
            computedCache.cached("getDiagramData", computeDiagramData, [
              s.diagram,
              s.dmn.model.definitions,
              s.computed(s).getExternalModelTypesByNamespace(externalModelsByNamespace),
              s.computed(s).indexedDrd(),
              s.computed(s).isAlternativeInputDataShape(),
            ]),
        };
      },
    }))
  );
}
