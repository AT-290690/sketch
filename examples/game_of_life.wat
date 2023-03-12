  <- [SKETCH; MATH; TIME; CONSOLE] [LIBRARY]; 
  <- [random_int] [MATH];
  <- [set_interval; clear_intervals] [TIME];
  <- [console_log] [CONSOLE];
  <- [sketch; line; circle; animate; fill_styles; rectangle; polygon; text; write; group; add; add_to; fill; stroke; fill_style; fill_styles; draw; move; scale; rotate; opacity] [SKETCH];
  ' [view; next; alive; x; y];
  := [W; 315; H; 315;
      N; 17; 
      factor; 1; 
      r; * [N; factor];
      h; * [r; factor; -1];
      cols; N; rows; N;
      bound; * [rows; cols]; cells; .: []; 
      style; fill_styles[1];
      
      get_cell; -> [x; y; ^ [cells; % [+ [x; * [rows; y]]; bound]]]; 
  
    make_grid; -> [cells; : [
  := [cells_container; group []]; 
  
  *loop [bound; -> [count; : [
    ? [! [% [count; cols]]; += [h; r]]; 
    ' [x; y];
    := [is_alive; random_int [0; 1];
        next_is_alive; random_int [0; 1]; 
        rect; |> [rectangle [% [* [count; r]; * [r; cols]]; h; r; r]; 
        fill ["black"];
        fill_style [style];
        draw [];   opacity [is_alive]];
        cell; :: [alive; is_alive;
                  next; next_is_alive;
                  view; rect]]; 
    add [cells_container; rect]; 
    .: append [cells; cell]]]]; cells_container]];
  
  iterate_cells; -> [cells; callback; : [
  := [y; -1]; 
  >> [cells; -> [cell; i; cells; : [
    = [y; ? [% [i; rows]; 
    y; += [y]]]; 
    := [x; % [i; cols]; 
        cell; get_cell [x; y]]; 
    callback [cell; x; y]]]]]]; 
  directions; .: [
    :: [x; 0; y; 1]; 
    :: [x; 1; y; 0]; 
    :: [x; -1; y; 0]; 
    :: [x; 0; y; -1]; 
    :: [x; 1; y; -1]; 
    :: [x; -1; y; -1]; 
    :: [x; 1; y; 1]; 
    :: [x; -1; y; 1]]; 
  
  adjacent; -> [X; Y; : [
  := [sum; 0]; 
  >> [directions; -> [dir; : [
    := [cell; get_cell [
      + [X; . [dir; x]]; 
      + [Y; . [dir; y]]]]; 
    = [sum; + [sum; ? [cell; . [cell; alive]; 0]]]]]]; sum]];
  
  update_state; -> [iterate_cells [cells; -> [cell; x; y; : [
    := [is_alive; . [cell; alive]; 
    neighbors; adjacent [x; y]]; 
    ? [&& [is_alive; < [neighbors; 2]]; 
      .= [cell; next; 0]; 
        ? [&& [is_alive; > [neighbors; 3]]; 
          .= [cell; next; 0]; 
             ? [&& [! [is_alive]; 
               == [neighbors; 3]]; 
    .= [cell; next; 1]]]]]]]]; 
  
  render; -> [iterate_cells [cells; -> [cell; x; y; : [
    := [is_alive; . [cell; alive]]; 
    |> [. [cell; view]; opacity [is_alive]]; 
    .= [cell; alive; . [cell; next]]]]]]]; 
  
  sketch [W; H; "#666"; "white"];
|>[rectangle [10; 10; - [W; 20]; -[H; 20]]; fill ["white"]; fill_style [fill_styles[3]]; draw []];
   |> [cells; 
      make_grid []; 
      move [10; 10]];
clear_intervals [];
set_interval[-> [: [update_state []; render []]]; 100];