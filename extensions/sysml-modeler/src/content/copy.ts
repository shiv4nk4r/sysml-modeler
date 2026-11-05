export const homeCopy = {
  title: "SysML Diagram Modeler",
  lede: "A modeling desk for SysML v2 text and the README that explains it.",
  newModel: "New model",
  openDiagram: "Open diagram",
  openGuide: "Open guide",
};

export const newModelTemplate = `package NewModel {
  part subsystem {
    port signal;
  }

  view structure : GeneralView {
    expose NewModel::*;
    render asTreeDiagram;
  }
}
`;
