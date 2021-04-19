(function() {

    var Point =geomap.Point;
    var Bounds =geomap.Bounds;
    var toPoint=geomap.util.toPoint;
    geomap.MapRectSelect={
        _rectPoints:[],
        _movingPos:[0,0], 
        RectSelectBindEvent:function(eventTarget){
            if(!this._RectSelectDrawDownID){
                this._RectSelectDrawDownID=this.RectSelectDrawDown.bind(this);
                this._RectSelectDrawUpID=this.RectSelectDrawUp.bind(this);
                this._RectSelectDrawMovingID=this.RectSelectDrawMoving.bind(this);
                // this._RectSelectDrawEndID=this.RectSelectDrawEnd.bind(this);
                this._RectSelectDrawID=this.RectSelectDraw.bind(this);
                eventTarget.on("mousedown",this._RectSelectDrawDownID);
                eventTarget.on("mouseup",this._RectSelectDrawUpID);
                eventTarget.on("mousemove",this._RectSelectDrawMovingID);
                // eventTarget.on("draw_end",this._RectSelectDrawEndID);
                eventTarget.on("drawingCanvas",this._RectSelectDrawID);
            }
            // this.on("draw_end",this.RectSelectDrawEnd);
        },
        RectSelectDrawDown:function(e){
            if(e.event.altKey){
            this.__status_draw=true;
            this.__status_draw_p0=e.point; 
            this._movingPos=e.point; 
            this.fire("drawCanvas");
            }
        },
        RectSelectDrawMoving:function(e){
            this._movingPos=e.point;
        },
        RectSelectDrawUp:function(e){ 
            if(this.__status_draw &&  this.__status_draw_p0){
                if( this.__status_draw_p0.equals(e.point)){
                    var coord=this.screenToCoord(e.point);
                    var arg={event:e,coord:coord};
                    this.fire("pointcoord",arg);
                    this.__status_draw=false;
                    
                    return;
                }else{
                    this.__status_draw_p1=e.point; 
                    var minP=this.screenToCoord(this.__status_draw_p0);
                    var maxP=this.screenToCoord(this.__status_draw_p1);
                    var arg={event:e,minx:Math.min(minP.x,maxP.x),miny:Math.min(minP.y,maxP.y),maxx:Math.max(minP.x,maxP.x),maxy:Math.max(minP.y,maxP.y)};
                    this.fire("rectcoord",arg);
                    this.__status_draw=false;
                }
            }
            
        },
        RectSelectDraw:function(ctx){
            if(this.__status_draw && this._movingPos){
                var p0=this.__status_draw_p0,
                   p1=this._movingPos;
                   ctx.setLineDash([]);
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.strokeStyle="#fff";
                ctx.beginPath();
                ctx.moveTo(p0.x,p0.y);
                ctx.lineTo(p0.x,p1.y);
                ctx.lineTo(p1.x,p1.y);
                ctx.lineTo(p1.x,p0.y);
                ctx.closePath();
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                this.fire("drawCanvas");
            } 
        }

    }; 
     
  })();
  