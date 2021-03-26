(function() {

    var Point =geomap.Point;

    function TouchZoom(map){
        this.map=map; 
    };

    TouchZoom.prototype={
        handle:function(event,self){
            eventjs.cancel(event);
            geomap.debug("======================touchzoom======"+self.state);
            if(self.state == 'start'){
                this.start(event,self);
            }else if(self.state == 'end'){
                this.stop(event,self);
            }else{
                this.change(event,self);
            }
        },
        start:function(event,self){
            this._zooming=true;
            this._moved=false;
            // this._startZoom=this.map.zoom;
            this._zoom=this.map.zoom;
           return this;
        },
        stop:function(event,self){
            this.map._touchZoomStatus=false;
            if(!this._moved || !this._zooming){
                this._zooming=false;
                return this;
              }

              this._zooming=false; 
              var cpos=this._centerPos;
              var scale=self.scale;
              var scale0= Math.floor(scale);
            var scaleR=geomap.util.formatNum(scale-scale0,1);
            var r=0.1;
            var toScale=geomap.util.formatNum(scale0,1);
            var fromScale=geomap.util.formatNum(scale,1);
            if(scaleR<0.5){
              r *=-1;
              toScale=scale0;
            }
            
            function endTouchFn(){
              var z=toScale-1+this._zoom;
              var opts={x:cpos.x,y:cpos.y,z:z};
              var cet=this.map.model.center;
              this.map.model.setZoomScreen(opts);
              this.map.zoom=z;
              this.map.fire("zoomend",{event:event,scale:toScale,center:this._centerPos.clone()})
            }

           
            if(this.TIMEOUTTAG){ 
                window.clearInterval(this.TIMEOUTTAG);
                this.TIMEOUTTAG=null;
              }
              this.TIMEOUTTAG= window.setInterval(function(){ 

                    var scaleV=this.scale+this.r; 
                    this.scale=scaleV;
                    geomap.debug("scaleV="+scaleV);
                   this.map.fire("zoom",{event:this.eventObj,scale:scaleV,center:this.center}) ;
                   if((this.r>0 && scaleV>=this.toScale) || (this.r<0 && scaleV <= this.toScale)){
                    this.endFn();
                    window.clearInterval(this.other.TIMEOUTTAG);
                    this.other.TIMEOUTTAG=null;
                }
            }.bind({endFn:endTouchFn.bind(this),scale:fromScale,map:this.map,eventsObj:event,r:r,toScale:toScale,other:this,center:this._centerPos.clone()}),20);
              
            return this;
        },
        change:function(event,self){
            if(!this._zooming ){
                this._zooming=false;
                return this;
            }
            if(!this._moved){ 
                if(self.gesture =="wheel"){
                    this._centerPos=new Point(self.x,self.y); 
                }else{
                    var p0=new Point(self.touches[0].x,self.touches[0].y);
                    var p1=new Point(self.touches[1].x,self.touches[1].y);
                    var cpos=p0.add(p1)._divideBy(2);
                    this._centerPos=cpos;
                }
                geomap.debug("START:_centerPos="+cpos.toString());  
                // this._startCoord=this.map.model.screenToCoord(cpos);
                this._zoom=this.map.zoom;
                this.map.fire("zoomstart",{event:event,self:self,center:this._centerPos});
                this._moved=true;
              }
              if(self.gesture =="wheel"){ 
                    var scale= this._wheelScale || 1;
                  scale += self.wheelDelta/60;
                this.map.fire("zoom",{event:event,scale:scale,center:this._centerPos.clone()})
              }else{
                var scale=self.scale;
                var cpos=this._centerPos;
                var z=Math.round(scale)-1+this._zoom;
                var opts={x:cpos.x,y:cpos.y,z:z};
                var cet=this.map.model.center;
                this.map.model.setZoomScreen(opts);
                this.map.zoom=z;
                this.map.fire("zoom",{event:event,scale:scale,center:this._centerPos.clone()})
              }
            return this;
        }  
    };

    function Drag(map){
        this.map=map;
        this._inertia=false;
    };

    Drag.prototype={
        handle:function(event,self){ 
            geomap.debug("dragInfo:fingers="+self.fingers);
          if(!self.fingers || self.fingers ==1){
            eventjs.cancel(event);
            if(self.state == 'down'){
                this.down(event,self);
            }else if(self.state == 'up'){
                this.up(event,self);
            }else{
                this.move(event,self);
            }
            }
        },
        down:function(event,self){
            this._draging=true;
            this._moved=false;
            this._zoom=this.map.zoom;
            if(this._inertia){
                this._times=[];
                this._positions=[];
            }
          
            return this;
        },
        up:function(event,self){
            if(!this._moved || !this._draging){
                this._draging=false;
                return this;
            }
            this._traging=false; 
            this.map.fire("dragend",{event:event,self:self});
            eventjs.cancel(event);
            return this;
        },
        move:function(event,self){
            if(!this._draging  || this.map._touchZoomStatus){
                this._draging=false;
                return this;
            }
 
            if(!this._moved ){
                this._startPos=new Point(self.x,self.y);
                this.map.fire("dragstart",{event:event,self:self});
                this._moved=true;
            }
            if(this._inertia){
                //TODO 惯性操作
                // var time=this._lastTime = +new Date(),
                // pos=this._lastPos=new Point(self.x,self.y);
                // this._positions.push(pos);
                // this._times.push(time);
           }
           var pos=new Point(self.x,self.y)
           pos.subtract(this._startPos);

           this.map.model.panScreen(this._startPos.subtract(pos));
           this._startPos=pos;
            this.map.fire("drag",{event:event,self:self})
            geomap.debug("TEST:"+self.gesture+":state="+self.state);  
            return this;
        }
    };

 

    geomap.MapEvent={TouchZoom:TouchZoom,Drag:Drag};
     
 
  })();
  