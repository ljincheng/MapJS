
(function(global) {

  function draw(ctx,map,geometry){
          var coords=geometry.coordinates,len=coords.length;
          if(len>0){
            switch(geometry.type){
              case "Polygon":{ 
                coords=coords[0];
                len=coords.length;
                if(coords.length>1){
                  ctx.beginPath();
                  var p0=map.coordToScreen(coords[0]).round();
                  ctx.moveTo(p0.x,p0.y);
                  for(var i=1;i<len;i++){
                      var coord=coords[i];
                      var p=map.coordToScreen(coord).round();
                      ctx.lineTo(p.x,p.y);
                  }
                  ctx.closePath();
                  ctx.stroke();
                  ctx.fill();
                }
                  break;
              }
              case "Point":{
                var p=map.coordToScreen(coords[0]).round(),r=geometry.r;
                ctx.fillRect(p.x-r/2,p.y-r/2,r,r);
                ctx.strokeRect(p.x-r/2,p.y-r/2,r,r);
                break;
            }
              default:{
                ctx.beginPath();
                  var p0=map.coordToScreen(coords[0]).round();
                  ctx.moveTo(p0.x,p0.y);
                  for(var i=1;i<len;i++){
                      var coord=coords[i];
                      var p=map.coordToScreen(coord).round();
                      ctx.lineTo(p.x,p.y);
                  }
                  ctx.closePath();
                  ctx.stroke();
              }

            }
          }
    }
  

    geomap.shape = {draw:draw};
  })(typeof exports !== 'undefined' ? exports : this);
