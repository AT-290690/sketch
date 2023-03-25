<- [SKETCH; MATH] [LIBRARY]; 
<- [sketch; line; circle; rectangle; polygon; text; roughness; write; group; add; add_to; fill; stroke; fill_style; fill_styles; draw; move; scale; rotate; opacity] [SKETCH];
<- [cos; sin; PI] [MATH];
  := [width; 500; height; 350];
  sketch [width; height; "none"; "none"];
  := [theta; 0.6; 
      step; 0.7; 
      angle; * [PI; 0.5]; 
      length; 
      * [height; 0.25];
      level; 0;
      max_level; 10; 
      x; * [width; 0.5]; 
      y; * [height; 1];
  
  ;; ARRAY FOR STACK OF TREE POSITIONS
      x_stack; .: [max_level];
      y_stack; .: [max_level]];
  
  := [draw_branch; -> [dir; : [
  
  ;; CALCULATE NEXT POINT
  := [delta_x; * [length; cos [angle]];
      delta_y; * [length; sin [angle]];
      next_x; + [x; delta_x];
      next_y; - [y; delta_y]];
  
  ;; DRAW A SINGLE BRANCH!
  |> [line [x; y; next_x; next_y]; stroke ["white"]; roughness [1.2]; draw []];
  .: >= [x_stack; x];
  .: >= [y_stack; y];
  = [x; next_x];
  = [y; next_y];
  = [level; + [level; 1]];
  = [angle; + [angle; * [theta; dir]]];
  = [length; * [length; step]];
  
  ;; EXIT CONDITION OF RECURSION
  ? [< [level; max_level]; : [
    draw_branch [1];
    draw_branch [-1]]]; 
  = [angle; - [angle; * [theta; dir]]];
  = [length; * [length; / [step]]];
  = [level; - [level; 1]];
  = [x; .: >!=. [x_stack]];
  = [y; .: >!=. [y_stack]]]]];
  
  draw_branch [0]