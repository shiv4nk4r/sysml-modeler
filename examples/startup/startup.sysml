package Startup {
  action start;
  action run;
  succession start then run;

  view flow : ActionFlowView {
    expose Startup::*;
  }
}
