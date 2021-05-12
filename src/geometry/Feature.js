

  (function() { 

    var toPoint=geomap.util.toPoint,extend = geomap.util.object.extend;

    function Feature(feature,map){
        var data=extend({id:null,properties:null,geometry:{type:null,coordinates:[]}},feature);
        this._data=data;
        if(map != undefined){
            this._map=map;
        }
        // this.id=id;
        // this.geometry=data.geometry;
        // this.properties=data.prop;
    }
    Feature.prototype={
        drawOptions:{lineWidth:2,
            lineDash:[],
            radius:5,
            dashOffset:1,
            animated:false,
            strokeStyle:"rgba(3,169, 244,1)",
            fillStyle:"rgba(41,182,246,1)",
            fill:true},
        setMap:function(map){
            this._map=map;
        },
        initCoords:function(){
            if(!this._coords){
                this._coords=[];
                var geometry=this._data.geometry;
                var coords=geometry.coordinates;
                if(coords && coords.length>0){
                    if(geometry.type === "Polygon"){
                        coords=coords[0];
                    }
                    for(var i=0,k=coords.length;i<k;i++){
                        this._coords.push(toPoint(coords[i]));
                    }
                }    
            }
        },
        clearCanvasOpt:function(ctx){
            ctx.fillStyle=null;
            ctx.strokeStyle=null;
            //还原
            ctx.lineDashOffset=1;
            ctx.lineWidth =1;
            ctx.setLineDash([]);
        },
        drawPolygon:function(ctx,opt){
            if(!this._coords){
                this.initCoords();
            }
            if(this._coords.length>3){
                var m=this._map,s=this,c=s._coords,len=c.length;
                ctx.lineWidth = opt.lineWidth;
                ctx.setLineDash(opt.lineDash);
                ctx.strokeStyle =opt.strokeStyle;
                ctx.fillStyle=opt.fillStyle;
                ctx.lineDashOffset = (s.drawOptions.dashOffset+=0.5);
                ctx.beginPath();
                    var p0=m.coordToScreen(c[0]);
                    ctx.moveTo(p0.x,p0.y);
                    for(var i=1;i<len;i++){
                        var coord=c[i];
                        var p=m.coordToScreen(coord);
                        ctx.lineTo(p.x,p.y);
                    }
                ctx.closePath();
                ctx.stroke();
                if(opt.fill){
                    ctx.fill();
                }
                
            }
        },
        drawPoint:function(ctx,opt){
            if(!this._coords){
                this.initCoords();
            }
            if(this._coords.length>0){
                var m=this._map,s=this,c=s._coords,len=c.length,r=s.radius;
                var p0=m.coordToScreen(c[0]);
                ctx.lineWidth = opt.lineWidth;
                ctx.setLineDash(opt.lineDash);
                ctx.strokeStyle =opt.strokeStyle;
                ctx.fillStyle=opt.fillStyle;
                ctx.lineDashOffset = (s.drawOptions.dashOffset+=1);
                ctx.beginPath();
                ctx.arc(p0.x, p0.y, r, 0, Math.PI * 2, true);
                ctx.closePath();
               
                ctx.stroke();
                if(opt.fill){
                    ctx.fill();
                }
            }
        },
        draw:function(ctx,options){
            var geometry=this._data.geometry,option=options||{};

             var opt=extend({},this.drawOptions);
              extend(opt,option);
            
           this.clearCanvasOpt(ctx);
           switch(geometry.type){
               case "Polygon":{
                this.drawPolygon(ctx,opt);
                break;
               }
               case "Point":{
                   this.drawPoint(ctx,opt);
                   break;
               }
           }

           this.clearCanvasOpt(ctx);
           if(opt.animated){
               this._map.animated();
           }
        }
    };
   

    geomap.Feature=Feature;
  })();