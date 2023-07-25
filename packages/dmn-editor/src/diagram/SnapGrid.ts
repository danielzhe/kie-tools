import { DC__Point, DMNDI13__DMNShape } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_4/ts-gen/types";

// export const SNAP_GRID = { x: 1, y: 1 };
export const SNAP_GRID = { x: 20, y: 20 };

export const MIN_SIZE_FOR_NODES = {
  width: SNAP_GRID.x * 8,
  height: SNAP_GRID.y * 4,
};

export function snapShapePosition(shape: DMNDI13__DMNShape) {
  // Without snapping at opening
  // return {
  //   x: shape["dc:Bounds"]?.["@_x"] ?? 0,
  //   y: shape["dc:Bounds"]?.["@_y"] ?? 0,
  // };
  // With snapping at opening
  return {
    x: Math.floor((shape["dc:Bounds"]?.["@_x"] ?? 0) / SNAP_GRID.x) * SNAP_GRID.x,
    y: Math.floor((shape["dc:Bounds"]?.["@_y"] ?? 0) / SNAP_GRID.y) * SNAP_GRID.y,
  };
}

export function snapShapeDimensions(shape: DMNDI13__DMNShape) {
  // Without snapping at opening
  // return {
  //   width: shape["dc:Bounds"]?.["@_width"],
  //   height: shape["dc:Bounds"]?.["@_height"],
  // };

  // With snapping at opening
  return {
    width: Math.max(
      Math.floor((shape["dc:Bounds"]?.["@_width"] ?? 0) / SNAP_GRID.x) * SNAP_GRID.x,
      MIN_SIZE_FOR_NODES.width
    ),
    height: Math.max(
      Math.floor((shape["dc:Bounds"]?.["@_height"] ?? 0) / SNAP_GRID.y) * SNAP_GRID.y,
      MIN_SIZE_FOR_NODES.height
    ),
  };
}

export function snapPoint(bounds: DC__Point, method: "floor" | "ceil" = "floor"): DC__Point {
  return {
    "@_x": Math[method]((bounds?.["@_x"] ?? 0) / SNAP_GRID.x) * SNAP_GRID.x,
    "@_y": Math[method]((bounds?.["@_y"] ?? 0) / SNAP_GRID.y) * SNAP_GRID.y,
  };
}
