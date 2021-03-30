(function() {

      var Point =geomap.Point;
  
      function TouchZoom(map){
          this._map=map; 
      };
  
      TouchZoom.prototype={
          addEvent:function(element){
              eventjs.add(element,"gesture",this.handle.bind(this));
          },
          handle:function(event,self){
              eventjs.cancel(event);
              if(self.state == 'start'){
                  this._zooming=true;
                  this._moved=false;
                  this._zoom=this._map.zoom;
                   return ;
              }else if(self.state == 'end'){
                  this._map._touchZoomStatus=false;
                  if(!this._moved || !this._zooming){
                      this._zooming=false;
                      return this;
                    }
                    this._zooming=false; 
                   this._map.touchZoomEnd(event,this._centerPos,self.scale);
                  return ;
              }else{
                  if(!this._zooming ){
                      this._zooming=false;
                      return this;
                  }
                  if(!this._moved){ 
                      var p0=new Point(self.touches[0].x,self.touches[0].y);
                      var p1=new Point(self.touches[1].x,self.touches[1].y);
                      var cpos=p0.add(p1)._divideBy(2);
                      this._centerPos=cpos;
                     this._map.touchZoomStart(event,this._centerPos);
                      this._moved=true;
                      return;
                    }
                 
                    this._map.touchZoom(event,this._centerPos,self.scale);
                  return ;
              }
          } 
           
      };
  
      function Drag(map){
          this._map=map;
          this._inertia=false;
      };
  
      Drag.prototype={
          addEvent:function(element){
              eventjs.add(element,"drag",this.handle.bind(this));
          },
          handle:function(event,self){ 
              geomap.debug("dragInfo:fingers="+self.fingers+",xy="+self.x+"|" +self.y);
            if(!self.fingers || self.fingers ==1){
              eventjs.cancel(event);
              if(self.state == 'down'){
                  this._draging=true;
                  this._moved=false;
                  if(this._inertia){
                      this._times=[];
                      this._positions=[];
                  }
                  return ;
              }else if(self.state == 'up'){
                  if(!this._moved || !this._draging){
                      this._draging=false;
                      this._moved=false;
                      return this;
                  }
                  this._traging=false; 
                  this._map.dragEnd(event,new Point(self.x,self.y));
                  return this;
              }else{
                  if(!this._draging  || this._map._touchZoomStatus){
                      this._draging=false;
                      return this;
                  }
                  if(!this._moved ){
                      this._map.dragStart(event,new Point(self.x,self.y));
                      this._moved=true;
                      return ;
                  }
                  if(this._inertia){
                      //TODO 惯性操作
                      // var time=this._lastTime = +new Date(),
                      // pos=this._lastPos=new Point(self.x,self.y);
                      // this._positions.push(pos);
                      // this._times.push(time);
                 }
                 var pos=new Point(self.x,self.y);
                 this._map.dragChange(event,pos);
              }
              }
          } 
      };
  
      function ScrollWheelZoom(map){
          this._map=map;
      };
  
      ScrollWheelZoom.prototype={
          addEvent:function(element){
              eventjs.add(element,"wheel",this.handle.bind(this));
          },
          handle:function(event,self){
              eventjs.cancel(event);
              if(self.state == 'start'){
                  this._zooming=true;
                  this._zooming_start=false; 
              }else if(self.state == 'end'){
                  if(!this._zooming){
                      this._zooming_start=false;
                          this._zooming=false;
                          return this;
                  }
                  if(this._timer){
                      clearTimeout(this._timer);
                      this._timer=null;
                  }
                  this._map.wheelZoomEnd(event,new Point(event.offsetX,event.offsetY),self.wheelDelta);
              }else{
                  if(!this._zooming ){
                      return this;
                  }
                  if(!this._zooming_start){
                      this._zooming_start=true;
                      this._map.wheelZoomStart(event,new Point(event.offsetX,event.offsetY));
                      return 
                  }
                  if(this._timer){
                      clearTimeout(this._timer);
                      this._timer=null;
                  }
                  var point=new Point(event.offsetX,event.offsetY);
                  this._timer=setTimeout(this._preformWheelZoom.bind(this,event,point,self.wheelDelta),10);
                  
              } 
          },
          _preformWheelZoom:function(event,point,delta){
              this._map.wheelZoom(event,point,delta);
          }
      };
   
      geomap.Event={TouchZoom:TouchZoom,Drag:Drag,ScrollWheelZoom:ScrollWheelZoom};
       
   
    })();
    