import { FeelVariable } from "./FeelVariable";
import { DmnLiteralExpression } from "./VariablesRepository";
import { Variable } from "./Variable";

export class Expression {
  private readonly _uuid: string;
  private _fullExpression: string;
  private _variables: Array<FeelVariable>;
  private source: DmnLiteralExpression;

  constructor(uuid: string, source: DmnLiteralExpression) {
    this._uuid = uuid;
    this._variables = new Array<FeelVariable>();
    this._fullExpression = source.text?.__$$text ?? "";
    this.source = source;
  }

  public applyChangesToExpressionSource() {
    this.source.text = { __$$text: this._fullExpression };
  }

  public renameVariable(renamedVariable: Variable, newName: String) {
    // We assume that variables are already ordered by the parser

    let offset = 0;
    for (const variable of this._variables) {
      variable.startIndex += offset;
      if (variable.source != undefined && variable.source === renamedVariable) {
        this.replaceAt(variable.startIndex, renamedVariable.value.length, newName);
        offset += newName.length - renamedVariable.value.length;
      }
    }
  }

  private replaceAt(position: number, oldLength: number, newVariable: String) {
    const part1 = this.fullExpression.substring(0, position);
    const newPart = newVariable;
    const part2 = this.fullExpression.substring(position + oldLength);

    this.fullExpression = part1 + newPart + part2;
  }

  get variables(): Array<FeelVariable> {
    return this._variables;
  }

  set variables(value: Array<FeelVariable>) {
    this._variables = value;
  }

  get fullExpression(): string {
    return this._fullExpression;
  }

  set fullExpression(value: string) {
    this._fullExpression = value;
  }

  get uuid(): string {
    return this._uuid;
  }
}
