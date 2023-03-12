<- [SKETCH] [LIBRARY]; 
<- [sketch; line; circle; rectangle; polygon; text; write; group; add; add_to; fill; stroke; fill_style; fill_styles; draw; move; scale; rotate; opacity] [SKETCH];
:= [X; 8; Y; 8; size; 40; padding; 10; style; fill_styles [3]; w; + [* [size; X]; * [padding; 2]]; h; + [* [size; Y]; * [padding; 2]]];
sketch [w; h; "#666"; "white"];
:= [rectangles; group []];
* loop [X; -> [x; 
  * loop [Y; -> [y; 
      add [rectangles; |> [rectangle [* [x; size]; * [y; size]; size; size]; 
      fill [? [% [+ [x; y]; 2]; "black"; "white"]]; 
      fill_style [style];
      stroke ["black"];
      draw []]]]]]];
|> [rectangles; move [padding; 10]];