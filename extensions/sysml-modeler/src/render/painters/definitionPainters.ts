import { PackagePainter } from "./packagePainter";
import { SymbolPainter } from "../symbolPainter";

export class PartDefPainter implements SymbolPainter {
  readonly kind = "partDef" as const;
  private readonly packagePainter = new PackagePainter();

  paint(node: Parameters<SymbolPainter["paint"]>[0], tokens: Parameters<SymbolPainter["paint"]>[1]): string {
    return this.packagePainter.paint({ ...node, kind: "package" }, tokens);
  }
}

export class InterfacePainter implements SymbolPainter {
  readonly kind = "interface" as const;
  private readonly packagePainter = new PackagePainter();

  paint(node: Parameters<SymbolPainter["paint"]>[0], tokens: Parameters<SymbolPainter["paint"]>[1]): string {
    return this.packagePainter.paint({ ...node, kind: "package" }, tokens);
  }
}
