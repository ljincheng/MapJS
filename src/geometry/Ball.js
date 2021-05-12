

  (function() { 

    var toPoint=geomap.util.toPoint;
    var Ball = {
        x: 100,
        y: 100,
        vx: 5,
        vy: 2,
        radius: 50,
        color: '#e57373a8',
        drawType:0,
        times:0,
        setMap:function(map){
            this._map=map;
            this._play=false;
            this._map.on("drawingCanvas",this.draw.bind(this));
            this._radius=0;
            this._dashOffset=1;
        },
        play:function(event){
            this._radius=0;
            this._play=true;
            this._alpha=0;
            this.drawType=0;
            this.times=2,
            geomap.debug("====Ball do play.");
            if(this._coords){
                this._coords.forEach(function (item, index, array) {
                    delete item;
                    array[index]=null;
                });
                this._coords=[];
            }else{
                this._coords=[];
            }
            
            if(event!=undefined){
                var feature=event.feature;
                if(feature!=undefined &&  feature.geometry && feature.geometry.type=='Polygon'){
                    var coords=feature.geometry.coordinates; 
                    if(coords && coords.length>0){
                        var coord1=coords[0];
                        for(var i=0,k=coord1.length;i<k;i++){
                            this._coords.push(toPoint(coord1[i]));
                        }
                        this.drawType=1;
                    }
                }
            }
        },
        drawPolygon:function(ctx){
               if(this.times>0){
                            var coords=this._coords;
                            if(coords.length>0){
                                var m=this._map,len=coords.length;
                               
                                ctx.beginPath();
                                ctx.lineWidth = 3;
                                ctx.setLineDash([15,4]);
                                ctx.lineDashOffset = (this._dashOffset+=1);
                                    var p0=m.coordToScreen(coords[0]);
                                    ctx.moveTo(p0.x,p0.y);
                                    for(var i=1;i<len;i++){
                                        var coord=coords[i];
                                        var p=m.coordToScreen(coord);
                                        ctx.lineTo(p.x,p.y);
                                    }
                                ctx.closePath();
                                ctx.strokeStyle = 'rgba(255,87,34,'+this._alpha+')';
                                ctx.stroke();
                                ctx.lineWidth = 1;
                                this._alpha+=0.1;
                                if(this._alpha<1){
                                    m.draw();
                                }else{
                                    this._alpha=0;
                                    this.times-=1;
                                }
                        }
                    
                }

        },
        drawPoint:function(ctx){
            if(this.times>0){
                var m=this._map,r, center=m.center; 
                var pos1=m.coordToScreen(center).round(); 
                this.x=pos1.x,this.y=pos1.y;
                
                if(this._radius<this.radius){
                    this._radius+=1;
                   
                    r=this._radius;
                    var co= (this.radius-r)/this.radius;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, r, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(33, 150, 243,'+co+')';
                    ctx.fill();
                    m.draw(); 
                }else{
                    this.times -=1;
                    // this.drawText(ctx,pos1);
                    
                }
            }
        },
        drawLock:function(ctx){
            if(this.times>0){
                var m=this._map,r, center=m.center; 
                var pos1=m.coordToScreen(center).round(); 
                this.x=pos1.x,this.y=pos1.y;
                
                if(this._radius<this.radius){
                    this._radius+=1;
                   
                    r=this._radius;
                    var co= (this.radius-r)/this.radius;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, r, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(33, 150, 243,'+co+')';
                    ctx.fill();
                    m.draw(); 
                }else{
                    this.drawText(ctx,pos1);
                    
                }
            }
        },
        draw: function(ctx) {
           if(this.times>0){
               switch(this.drawType){
                   case 1:{
                       this.drawPolygon(ctx);
                       break;
                   }
                   default:
                       this.drawPoint(ctx);
               }
           }
        },
        drawText:function(ctx,pos){
            if(this._alpha<=1){
                var rx=100,ry=-100,sx=pos.x,sy=pos.y,ex=pos.x+rx,ey=pos.y+ry,r=4,lw=100;
                ctx.beginPath();
                ctx.moveTo(sx,sy);
                ctx.arc(sx,sy, r, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fillStyle = 'rgba(103 ,58,183,'+this._alpha+')';
                ctx.fill();
                ctx.strokeStyle = 'rgba(103 ,58,183,'+this._alpha+')';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.setLineDash([15,4]);
                ctx.moveTo(sx,sy);
                ctx.lineTo(ex, ey);
                ctx.lineTo(ex+lw,ey);
                ctx.stroke();
                this._alpha+=0.1;
                if(this._alpha<1){
                    this._map.draw(); 
                }
            }else{
                this.times -=1;
            }
        }
        
      };

    geomap.Ball=Ball;
  })();