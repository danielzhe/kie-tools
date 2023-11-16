import * as React from "react";
import { useMemo, useCallback, useRef, useState, useLayoutEffect } from "react";
import { ConstraintsExpression } from "./ConstraintsExpression";
import { DMN15__tItemDefinition } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { DmnBuiltInDataType } from "@kie-tools/boxed-expression-component/dist/api";
import { ConstraintsEnum, isEnum } from "./ConstraintsEnum";
import { ConstraintsRange, isRange } from "./ConstraintsRange";
import { KIE__tConstraintType } from "@kie-tools/dmn-marshaller/dist/schemas/kie-1_0/ts-gen/types";
import { EditItemDefinition } from "./DataTypes";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core/dist/js/components/ToggleGroup";
import { canHaveConstraints, constrainableBuiltInFeelTypes } from "./DataTypeSpec";
import moment from "moment";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { ConstraintDate } from "./ConstraintComponents/ConstraintDate";
import { ConstraintDateTime } from "./ConstraintComponents/ConstraintDateTime";
import {
  ConstraintDateTimeDuration,
  REGEX_DATE_TIME_DURATION,
} from "./ConstraintComponents/ConstraintDateTimeDuration";
import { ConstraintTime } from "./ConstraintComponents/ConstraintTime";
import {
  ConstraintYearsMonthsDuration,
  REGEX_YEARS_MONTH_DURATION,
} from "./ConstraintComponents/ConstraintYearsMonthsDuration";
import { invalidInlineFeelNameStyle } from "../feel/InlineFeelNameInput";
import { ConstraintProps } from "./ConstraintComponents/Constraint";

export type TypeHelper = {
  check: (value: string) => boolean;
  parse: (value: string) => any;
  transform: (value: string) => string;
  recover: (value: string) => string;
  component: (props: any) => React.ReactNode | undefined;
};

export interface ConstraintComponentProps {
  isReadonly: boolean;
  value?: string;
  savedValue?: string;
  type: DmnBuiltInDataType;
  typeHelper: TypeHelper;
  onSave: (value?: string) => void;
  isDisabled: boolean;
}

enum ConstraintsType {
  ENUMERATION = "Enumeration",
  EXPRESSION = "Expression",
  RANGE = "Range",
  NONE = "None",
}

export const constraintTypeHelper = (typeRef: DmnBuiltInDataType): TypeHelper => {
  return {
    // check if the value has the correct type
    check: (value: string) => {
      const recoveredValue = constraintTypeHelper(typeRef).recover(value);
      switch (typeRef) {
        case DmnBuiltInDataType.Any:
          return true;
        case DmnBuiltInDataType.String:
          if (constraintTypeHelper(DmnBuiltInDataType.Date).check(value)) {
            return false;
          }
          if (constraintTypeHelper(DmnBuiltInDataType.DateTime).check(value)) {
            return false;
          }
          if (constraintTypeHelper(DmnBuiltInDataType.DateTimeDuration).check(value)) {
            return false;
          }
          if (constraintTypeHelper(DmnBuiltInDataType.Time).check(value)) {
            return false;
          }
          if (constraintTypeHelper(DmnBuiltInDataType.YearsMonthsDuration).check(value)) {
            return false;
          }
          return typeof recoveredValue === "string";
        case DmnBuiltInDataType.Date:
          return moment(recoveredValue, "YYYY-MM-DD", true).isValid() || value === "";
        case DmnBuiltInDataType.DateTime:
          return moment(recoveredValue, "YYYY-MM-DDTHH:mm:ssZZ", true).isValid() || value === "";
        case DmnBuiltInDataType.DateTimeDuration:
          return REGEX_DATE_TIME_DURATION.test(recoveredValue) || value === "";
        case DmnBuiltInDataType.Number:
          return !isNaN(parseFloat(recoveredValue)) || value === "";
        case DmnBuiltInDataType.Time:
          return moment(recoveredValue, "HH:mm:ss", true).isValid() || value === "";
        case DmnBuiltInDataType.YearsMonthsDuration:
          return REGEX_YEARS_MONTH_DURATION.test(recoveredValue) || value === "";
        default:
          return false;
      }
    },
    // parse the value to the type
    // useful for comparisons
    parse: (value: string) => {
      const recoveredValue = constraintTypeHelper(typeRef).recover(value);
      switch (typeRef) {
        case DmnBuiltInDataType.Number:
          return parseFloat(recoveredValue);
        case DmnBuiltInDataType.DateTimeDuration:
        case DmnBuiltInDataType.YearsMonthsDuration:
          return moment.duration(recoveredValue);
        case DmnBuiltInDataType.DateTime:
          return moment(recoveredValue).toDate();
        case DmnBuiltInDataType.Date:
        case DmnBuiltInDataType.String:
        case DmnBuiltInDataType.Time:
        default:
          return recoveredValue;
      }
    },
    // transform the value before save
    transform: (value: string) => {
      switch (typeRef) {
        case DmnBuiltInDataType.Any:
        case DmnBuiltInDataType.String:
          return JSON.stringify(value);
        case DmnBuiltInDataType.Date:
          return `date("${value}")`;
        case DmnBuiltInDataType.DateTime:
          return `date and time("${value}")`;
        case DmnBuiltInDataType.DateTimeDuration:
        case DmnBuiltInDataType.YearsMonthsDuration:
          return `duration("${value}")`;
        case DmnBuiltInDataType.Number:
          return `${value}`;
        case DmnBuiltInDataType.Time:
          return `time("${value}")`;
        default:
          return value;
      }
    },
    // recover the value before use it
    recover: (value: string) => {
      switch (typeRef) {
        case DmnBuiltInDataType.Any:
        case DmnBuiltInDataType.String:
          try {
            return `${JSON.parse(value)}`;
          } catch (error) {
            return `${value}`;
          }
        case DmnBuiltInDataType.Date:
          return value.replace('date("', "").replace('")', "");
        case DmnBuiltInDataType.DateTime:
          return value.replace('date and time("', "").replace('")', "");
        case DmnBuiltInDataType.DateTimeDuration:
          return value.replace('duration("', "").replace('")', "");
        case DmnBuiltInDataType.Number:
          return `${value}`;
        case DmnBuiltInDataType.Time:
          return value.replace('time("', "").replace('")', "");
        case DmnBuiltInDataType.YearsMonthsDuration:
          return value.replace('duration("', "").replace('")', "");
        default:
          return `${value}`;
      }
    },
    component: (props: ConstraintProps) => {
      switch (typeRef) {
        case DmnBuiltInDataType.Date:
          return <ConstraintDate {...props} />;
        case DmnBuiltInDataType.DateTime:
          return <ConstraintDateTime {...props} />;
        case DmnBuiltInDataType.DateTimeDuration:
          return <ConstraintDateTimeDuration {...props} />;
        case DmnBuiltInDataType.Time:
          return <ConstraintTime {...props} />;
        case DmnBuiltInDataType.YearsMonthsDuration:
          return <ConstraintYearsMonthsDuration {...props} />;
        case DmnBuiltInDataType.Number:
          return (
            <TextInput
              {...props}
              style={{ ...props.style, ...(props.isValid ? {} : invalidInlineFeelNameStyle) }}
              type={"number"}
            />
          );
        case DmnBuiltInDataType.Any:
        case DmnBuiltInDataType.String:
        default:
          return (
            <TextInput
              {...props}
              style={{ ...props.style, ...(props.isValid ? {} : invalidInlineFeelNameStyle) }}
              type={"text"}
            />
          );
      }
    },
  };
};

export function Constraints({
  isReadonly,
  itemDefinition,
  editItemDefinition,
}: {
  isReadonly: boolean;
  itemDefinition: DMN15__tItemDefinition;
  editItemDefinition: EditItemDefinition;
}) {
  const allowedValues = useMemo(() => itemDefinition?.allowedValues, [itemDefinition?.allowedValues]);
  const constraintValue = useMemo(
    () => allowedValues?.text.__$$text ?? allowedValues?.text.__$$text,
    [allowedValues?.text.__$$text]
  );
  const kieConstraintType = useMemo(() => allowedValues?.["@_kie:constraintType"], [allowedValues]);
  const typeRef: DmnBuiltInDataType = useMemo(
    () => (itemDefinition?.typeRef?.__$$text ?? DmnBuiltInDataType.Undefined) as DmnBuiltInDataType,
    [itemDefinition?.typeRef?.__$$text]
  );
  const isConstraintEnum = useMemo(
    () => isEnum(constraintValue, constraintTypeHelper(typeRef).check),
    [constraintValue, typeRef]
  );
  const isConstraintRange = useMemo(
    () => isRange(constraintValue, constraintTypeHelper(typeRef).check),
    [constraintValue, typeRef]
  );

  const enumToKieConstraintType: (selection: ConstraintsType) => KIE__tConstraintType | undefined = useCallback(
    (selection) => {
      switch (selection) {
        case ConstraintsType.ENUMERATION:
          return "enumeration";
        case ConstraintsType.EXPRESSION:
          return "expression";
        case ConstraintsType.RANGE:
          return "range";
        case ConstraintsType.NONE:
        default:
          return undefined;
      }
    },
    []
  );

  const isConstraintEnabled = useMemo(() => {
    const enabledConstraints = constrainableBuiltInFeelTypes.get(typeRef);
    return {
      enumeration: (enabledConstraints ?? []).includes(enumToKieConstraintType(ConstraintsType.ENUMERATION)!),
      range: (enabledConstraints ?? []).includes(enumToKieConstraintType(ConstraintsType.RANGE)!),
      expression: (enabledConstraints ?? []).includes(enumToKieConstraintType(ConstraintsType.EXPRESSION)!),
    };
  }, [enumToKieConstraintType, typeRef]);

  // Correctly set the selection on the first load
  // This ref is necessary to sync with external events.
  // During the internal change it will set to false, as the selected constraint will already
  // be updated. Everytime the constraintValue or kieConstraintType is updated, it will be reseted to true
  // which will enable to update from external events.
  const shouldUpdateSelection = useRef(false);
  const [selectedConstraint, setSelectedConstraint] = useState<ConstraintsType>(() => {
    if (kieConstraintType === undefined && constraintValue && isConstraintEnabled.enumeration && isConstraintEnum) {
      return ConstraintsType.ENUMERATION;
    }
    if (kieConstraintType === undefined && constraintValue && isConstraintEnabled.range && isConstraintRange) {
      return ConstraintsType.RANGE;
    }
    if (kieConstraintType === undefined && constraintValue) {
      return ConstraintsType.EXPRESSION;
    }
    if (isConstraintEnabled.enumeration && kieConstraintType === "enumeration") {
      return ConstraintsType.ENUMERATION;
    }
    if (isConstraintEnabled.range && kieConstraintType === "range") {
      return ConstraintsType.RANGE;
    }
    if (isConstraintEnabled.expression && kieConstraintType === "expression") {
      return ConstraintsType.EXPRESSION;
    }
    return ConstraintsType.NONE;
  });

  useLayoutEffect(() => {
    if (!shouldUpdateSelection.current) {
      shouldUpdateSelection.current = true;
      return;
    }
    if (isConstraintEnabled.enumeration && kieConstraintType === "enumeration") {
      setSelectedConstraint(ConstraintsType.ENUMERATION);
    }
    if (isConstraintEnabled.range && kieConstraintType === "range") {
      setSelectedConstraint(ConstraintsType.RANGE);
    }
    if (isConstraintEnabled.expression && kieConstraintType === "expression") {
      setSelectedConstraint(ConstraintsType.EXPRESSION);
    }
    setSelectedConstraint(ConstraintsType.NONE);
  }, [
    constraintValue,
    isConstraintEnabled.enumeration,
    isConstraintEnabled.expression,
    isConstraintEnabled.range,
    kieConstraintType,
  ]);

  // Updates the XML value only if the constraint is valid
  const onInternalChange = useCallback(
    (args: { constraintType: ConstraintsType; value?: string }) => {
      const kieConstraintType = enumToKieConstraintType(args.constraintType);

      if (isReadonly) {
        return;
      }

      editItemDefinition(itemDefinition["@_id"]!, (itemDefinition) => {
        if (
          args.value === itemDefinition.allowedValues?.text?.__$$text ||
          (args.value === "" && itemDefinition.allowedValues?.text?.__$$text === undefined)
        ) {
          return;
        }

        shouldUpdateSelection.current = false;
        if (args.value === undefined || args.value === "") {
          itemDefinition.allowedValues = undefined;
          return;
        }

        itemDefinition.allowedValues = {
          text: { __$$text: args.value },
          "@_id": itemDefinition?.["@_id"],
          "@_kie:constraintType": kieConstraintType,
        };
      });
    },
    [editItemDefinition, enumToKieConstraintType, isReadonly, itemDefinition]
  );

  const onToggleGroupChange = useCallback(
    (newSelection, event) => {
      if (!newSelection) {
        return;
      }
      const selection = event.currentTarget.id as ConstraintsType;
      setSelectedConstraint((prevSelection) => {
        if (selection === ConstraintsType.NONE) {
          onInternalChange({
            constraintType: ConstraintsType.NONE,
            value: undefined,
          });
          return selection;
        }

        if (prevSelection === ConstraintsType.EXPRESSION && selection === ConstraintsType.ENUMERATION) {
          onInternalChange({
            constraintType: ConstraintsType.ENUMERATION,
            value: constraintValue ?? "",
          });
          return selection;
        } else if (selection === ConstraintsType.ENUMERATION) {
          onInternalChange({
            constraintType: ConstraintsType.ENUMERATION,
            value: undefined,
          });
          return selection;
        }

        if (prevSelection === ConstraintsType.EXPRESSION && selection === ConstraintsType.RANGE) {
          onInternalChange({
            constraintType: ConstraintsType.RANGE,
            value: constraintValue ?? "",
          });
          return selection;
        } else if (selection === ConstraintsType.RANGE) {
          onInternalChange({
            constraintType: ConstraintsType.RANGE,
            value: undefined,
          });
          return selection;
        }

        if (selection === ConstraintsType.EXPRESSION) {
          onInternalChange({
            constraintType: ConstraintsType.EXPRESSION,
            value: constraintValue ?? "",
          });
          return selection;
        }

        return selection;
      });
    },
    [constraintValue, onInternalChange]
  );

  const constraintComponent = useMemo(() => {
    if (selectedConstraint === ConstraintsType.ENUMERATION) {
      return (
        <ConstraintsEnum
          isReadonly={isReadonly}
          type={typeRef}
          typeHelper={constraintTypeHelper(typeRef)}
          value={isConstraintEnum ? constraintValue : undefined}
          savedValue={constraintValue}
          onSave={(value?: string) =>
            onInternalChange({
              constraintType: ConstraintsType.ENUMERATION,
              value,
            })
          }
          isDisabled={!isConstraintEnabled.enumeration}
        />
      );
    }
    if (selectedConstraint === ConstraintsType.RANGE) {
      return (
        <ConstraintsRange
          isReadonly={isReadonly}
          savedValue={constraintValue}
          type={typeRef}
          typeHelper={constraintTypeHelper(typeRef)}
          value={isConstraintRange ? constraintValue : undefined}
          onSave={(value?: string) =>
            onInternalChange({
              constraintType: ConstraintsType.RANGE,
              value,
            })
          }
          isDisabled={!isConstraintEnabled.range}
        />
      );
    }
    if (selectedConstraint === ConstraintsType.EXPRESSION) {
      return (
        <ConstraintsExpression
          isReadonly={isReadonly}
          type={typeRef}
          value={constraintValue}
          savedValue={constraintValue}
          onSave={(value?: string) =>
            onInternalChange({
              constraintType: ConstraintsType.EXPRESSION,
              value,
            })
          }
          isDisabled={false}
        />
      );
    }

    return (
      <p
        style={{
          padding: "24px",
          background: "#eee",
          borderRadius: "10px",
          textAlign: "center",
        }}
      >
        {`All values are allowed`}
      </p>
    );
  }, [
    constraintValue,
    isConstraintEnabled.enumeration,
    isConstraintEnabled.range,
    isConstraintEnum,
    isConstraintRange,
    isReadonly,
    onInternalChange,
    selectedConstraint,
    typeRef,
  ]);

  return (
    <>
      {!canHaveConstraints(itemDefinition) ? (
        <p
          style={{
            padding: "10px",
            background: "#eee",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          {`This data type doesn't support constraints`}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div>
            <ToggleGroup aria-label={"Constraint toggle group"}>
              <ToggleGroupItem
                text={ConstraintsType.NONE}
                buttonId={ConstraintsType.NONE}
                isSelected={selectedConstraint === ConstraintsType.NONE}
                onChange={onToggleGroupChange}
                isDisabled={isReadonly}
              />
              <ToggleGroupItem
                text={ConstraintsType.EXPRESSION}
                buttonId={ConstraintsType.EXPRESSION}
                isSelected={selectedConstraint === ConstraintsType.EXPRESSION}
                onChange={onToggleGroupChange}
                isDisabled={isReadonly}
              />
              <ToggleGroupItem
                text={ConstraintsType.ENUMERATION}
                buttonId={ConstraintsType.ENUMERATION}
                isSelected={selectedConstraint === ConstraintsType.ENUMERATION}
                onChange={onToggleGroupChange}
                isDisabled={isReadonly || !isConstraintEnabled.enumeration}
              />
              <ToggleGroupItem
                text={ConstraintsType.RANGE}
                buttonId={ConstraintsType.RANGE}
                isSelected={selectedConstraint === ConstraintsType.RANGE}
                onChange={onToggleGroupChange}
                isDisabled={isReadonly || !isConstraintEnabled.range}
              />
            </ToggleGroup>
          </div>

          <div style={{ paddingTop: "20px" }}>{constraintComponent}</div>
        </div>
      )}
    </>
  );
}
