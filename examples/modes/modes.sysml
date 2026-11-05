package Modes {
  state off;
  state running;
  transition off then running;

  view modes : StateTransitionView {
    expose Modes::*;
  }
}
