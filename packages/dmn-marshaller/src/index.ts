import { Meta, XmlParserTs, getInstanceNs, getParser } from "@kie-tools/xml-parser-ts";
import { meta as dmn10meta, root as dmn10root, ns as dmn10ns } from "./schemas/dmn-1_0/ts-gen/meta";
import { meta as dmn11meta, root as dmn11root, ns as dmn11ns } from "./schemas/dmn-1_1/ts-gen/meta";
import { meta as dmn12meta, root as dmn12root, ns as dmn12ns } from "./schemas/dmn-1_2/ts-gen/meta";
import { meta as dmn13meta, root as dmn13root, ns as dmn13ns } from "./schemas/dmn-1_3/ts-gen/meta";
import { meta as dmn14meta, root as dmn14root, ns as dmn14ns } from "./schemas/dmn-1_4/ts-gen/meta";
// import { dmn3__tDefinitions as DMN10__tDefinitions } from "./schemas/dmn-1_0/ts-gen/types";
// import { dmn__tDefinitions as DMN11__tDefinitions } from "./schemas/dmn-1_1/ts-gen/types";
import { DMN14__tDefinitions } from "./schemas/dmn-1_4/ts-gen/types";
import { DMN13__tDefinitions } from "./schemas/dmn-1_3/ts-gen/types";
import { DMN12__tDefinitions } from "./schemas/dmn-1_2/ts-gen/types";
import "./kie-extensions"; // Necessary to include the type extensions and patch the ns maps. Do not remove.

type DmnMarshaller = {
  parser: { parse(): DmnDefinitions };
  builder: { build(json: DmnDefinitions): string };
  instanceNs: Map<string, string>;
  root: { element: string; type: string };
  meta: Meta;
  version: "1.0" | "1.1" | "1.2" | "1.3" | "1.4";
};

export type DmnDefinitions = {
  definitions: DMN12__tDefinitions | DMN13__tDefinitions | DMN14__tDefinitions;
};

// FIXME: Tiago --> DMN 1.1 doesn't seem to have diagram types, which is too much of a deal breaker... What to do?
// | { definitions: DMN11__tDefinitions };

// FIXME: Tiago --> DMN 1.0 is not included because it doesn't seem to be retro-compatble, as it declares some elements with an Upper Case first letter. E.g., "Definitions". Need to double-check that, as XML seems to be case-sensitive.
// | { Definitions: DMN10__tDefinitions };

export function getMarshaller(xml: string): DmnMarshaller {
  const instanceNs = getInstanceNs(xml);

  // Do not remove this '!== undefined', as "" is a valid namespace on the instanceNs map, although it is a falsy value.
  if (instanceNs.get(dmn10ns.get("")!) !== undefined) {
    const p = getParser<DmnDefinitions>({
      ns: dmn10ns,
      meta: dmn10meta,
      root: dmn10root,
    });

    return {
      instanceNs,
      version: "1.0",
      root: dmn10root,
      meta: dmn10meta,
      parser: { parse: () => p.parse({ xml, instanceNs }).json },
      builder: { build: (json: DmnDefinitions) => p.build({ json, instanceNs }) },
    };
    // Do not remove this '!== undefined', as "" is a valid namespace on the instanceNs map, although it is a falsy value.
  } else if (instanceNs.get(dmn11ns.get("")!) !== undefined) {
    const p = getParser<DmnDefinitions>({
      ns: dmn11ns,
      meta: dmn11meta,
      root: dmn11root,
    });

    return {
      instanceNs,
      version: "1.1",
      root: dmn11root,
      meta: dmn11meta,
      parser: { parse: () => p.parse({ xml, instanceNs }).json },
      builder: { build: (json: DmnDefinitions) => p.build({ json, instanceNs }) },
    };
    // Do not remove this '!== undefined', as "" is a valid namespace on the instanceNs map, although it is a falsy value.
  } else if (instanceNs.get(dmn12ns.get("")!) !== undefined) {
    const p = getParser<DmnDefinitions>({
      ns: dmn12ns,
      meta: dmn12meta,
      root: dmn12root,
    });

    return {
      instanceNs,
      version: "1.2",
      root: dmn12root,
      meta: dmn12meta,
      parser: { parse: () => p.parse({ xml, instanceNs }).json },
      builder: { build: (json: DmnDefinitions) => p.build({ json, instanceNs }) },
    };
    // Do not remove this '!== undefined', as "" is a valid namespace on the instanceNs map, although it is a falsy value.
  } else if (instanceNs.get(dmn13ns.get("")!) !== undefined) {
    const p = getParser<DmnDefinitions>({
      ns: dmn13ns,
      meta: dmn13meta,
      root: dmn13root,
    });

    return {
      instanceNs,
      version: "1.3",
      root: dmn13root,
      meta: dmn13meta,
      parser: { parse: () => p.parse({ xml, instanceNs }).json },
      builder: { build: (json: DmnDefinitions) => p.build({ json, instanceNs }) },
    };
    // Do not remove this '!== undefined', as "" is a valid namespace on the instanceNs map, although it is a falsy value.
  } else if (instanceNs.get(dmn14ns.get("")!) !== undefined) {
    const p = getParser<DmnDefinitions>({
      ns: dmn14ns,
      meta: dmn14meta,
      root: dmn14root,
    });

    return {
      instanceNs,
      version: "1.4",
      root: dmn14root,
      meta: dmn14meta,
      parser: { parse: () => p.parse({ xml, instanceNs }).json },
      builder: { build: (json: DmnDefinitions) => p.build({ json, instanceNs }) },
    };
  } else {
    throw new Error(
      `Unknown version declared for DMN. Instance NS --> '${JSON.stringify([...instanceNs.entries()])}'.`
    );
  }
}
