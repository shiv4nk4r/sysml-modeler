export interface LayoutSidecar {
  positions: Record<string, { x: number; y: number }>;
}

export function emptySidecar(): LayoutSidecar {
  return { positions: {} };
}

export function moveNode(sidecar: LayoutSidecar, qualifiedName: string, x: number, y: number): LayoutSidecar {
  return {
    positions: {
      ...sidecar.positions,
      [qualifiedName]: { x: Math.round(x), y: Math.round(y) },
    },
  };
}

export function sidecarPathFor(modelPath: string): string {
  return `${modelPath}view.json`;
}
