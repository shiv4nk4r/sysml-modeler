package Vehicle {
  part def Engine {
    port fuelIn;
    port powerOut;
  }

  part engine : Engine {
    part piston;
  }

  part tank {
    port fuelOut;
  }

  connect tank.fuelOut to engine.fuelIn;

  view wiring : InterconnectionView {
    expose Vehicle::*;
    render asInterconnectionDiagram;
    attribute fileName = "wiring";
    attribute fileType = "svg";
  }

  view structure : GeneralView {
    expose Vehicle::**;
    render asTreeDiagram;
  }
}
