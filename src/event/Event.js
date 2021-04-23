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
          this._inertia=true;
          this._inertia_speed=[0,0];
      };
  
      Drag.prototype={
          addEvent:function(element){
              eventjs.add(element,"drag",this.handle.bind(this));
          },
          dragingSpeed:function(time){
              var ltime=time - this._lastTime ;
            if (ltime > 20) {
                this._lastTime =time;
                var  directionX =this._drag_nowpos[0] - this._drag_lastpos[0];
                var  directionY =this._drag_nowpos[1] - this._drag_lastpos[1];
                this._drag_speed.push([directionX,directionY]);
                this._drag_speed.shift();
                var totalSpeed=[0,0];
                var num=this._drag_speed.length;
                for(var i=0;i<num;i++){
                    totalSpeed[0]=totalSpeed[0]+this._drag_speed[i][0];
                    totalSpeed[1]=totalSpeed[1]+this._drag_speed[i][1];
                }
                var speedX=Math.round(totalSpeed[0]/num);
                var speedY=Math.round(totalSpeed[1]/num);
                this._inertia_speed=[speedX,speedY];
                //this._drag_lastpos=this._drag_nowpos;
                //geomap.debug("######  inertia_speed="+speedX+","+speedY);
            }
            this._drag_lastpos=this._drag_nowpos;
          },
          handle:function(event,self){ 
            if(!self.fingers || self.fingers ==1){
              eventjs.cancel(event);
               event.openInertia=this._inertia;
              if(self.state == 'down'){
                  this._draging=true;
                  this._moved=false;
                  if(this._inertia){
                    var p0= [0,0];
                      this._drag_speed=[p0,p0,p0,p0,p0,p0]; 
                      this._positions=[];
                      this._inertia_speed=[0,0];
                      this._drag_lastpos=[self.x,self.y];
                      this._drag_nowpos=[self.x,self.y];
                    //   this._times = [];
                      this._lastTime = +new Date();
                  }
                  return ;
              }else if(self.state == 'up'){
                  if(!this._moved || !this._draging){
                      this._draging=false;
                      this._moved=false;
                      return this;
                  }
                  this._traging=false; 
                  var newevent=event;
                  newevent.inertiaSpeed= this._inertia_speed;
                  this._map.dragEnd(newevent,new Point(self.x,self.y));
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
                       var time= +new Date();
                     this._drag_nowpos=[self.x,self.y];
                     this.dragingSpeed(time);
                 }
                 var pos=new Point(self.x,self.y);
                 this._map.dragChange(event,pos);
              }
              }
          } 
      };
  
      function ScrollWheelZoom(map){
          this._map=map;
          this.wheelDebounceTime=40;
          this.wheelPxPerZoomLevel=60;
      };
  
      function userAgentContains(str) {
        return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
    }

      ScrollWheelZoom.prototype={
          addEvent:function(element){
              eventjs.add(element,"wheel",this.handle.bind(this));
          },
          getWheelDelta:function(e){
            var ie = 'ActiveXObject' in window;
            var ielt9 = ie && !document.addEventListener;
            var webkit = userAgentContains('webkit');
            var android = userAgentContains('android');
            var android23 = userAgentContains('android 2') || userAgentContains('android 3');
            var opera = !!window.opera;
            var safari = !chrome && userAgentContains('safari');
            var mobile = typeof orientation !== 'undefined' || userAgentContains('mobile');
            var edge = 'msLaunchUri' in navigator && !('documentMode' in document);
            var chrome = !edge && userAgentContains('chrome');
            var win = navigator.platform.indexOf('Win') === 0;
            var gecko = userAgentContains('gecko') && !webkit && !opera && !ie;
            var wheelPxFactor =(win && chrome) ? 2 * window.devicePixelRatio :gecko ? window.devicePixelRatio : 1;

            return edge ? e.wheelDeltaY / 2 : // Don't trust window-geometry-based delta
            (e.deltaY && e.deltaMode === 0) ? -e.deltaY / wheelPxFactor : // Pixels
            (e.deltaY && e.deltaMode === 1) ? -e.deltaY * 20 : // Lines
            (e.deltaY && e.deltaMode === 2) ? -e.deltaY * 60 : // Pages
            (e.deltaX || e.deltaZ) ? 0 :	// Skip horizontal/depth wheel events
            e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : // Legacy IE pixels
            (e.detail && Math.abs(e.detail) < 32765) ? -e.detail * 20 : // Legacy Moz lines
            e.detail ? e.detail / -32765 * 60 : // Legacy Moz pages
            0;
          },
          handle:function(event,self){
              eventjs.cancel(event);
              var delta=self.wheelDelta;//this.getWheelDelta(event);
              if(self.state == 'start'){
                  this._zooming=true;
                  this._zooming_start=false; 
              }else if(self.state == 'end'){
                  if(!this._zooming){
                      this._zooming_start=false;
                          this._zooming=false;
                          return this;
                  }
                //   if(this._timer){
                //       clearTimeout(this._timer);
                //       this._timer=null;
                //   }
                  this._map.wheelZoomEnd(event,new Point(event.offsetX,event.offsetY),delta);
              }else{
                  if(!this._zooming ){
                      return this;
                  }
                  if(!this._zooming_start){
                      this._zooming_start=true;
                      this._map.wheelZoomStart(event,new Point(event.offsetX,event.offsetY));
                      return 
                  }
                //   if(!this._startTime){
                //       this._startTime= +new Date(); 
                //   }
                //   var left=Math.max(this.wheelDebounceTime - (+new Date() - this._startTime),0);
                //   if(this._timer){
                //       clearTimeout(this._timer);
                //       this._timer=null;
                //   }
                  var point=new Point(event.offsetX,event.offsetY);
                //   this._timer=setTimeout(this._preformWheelZoom.bind(this,event,point,self.wheelDelta),left);
                this._map.wheelZoom(event,point,delta);
                  
              } 
          },
          _preformWheelZoom:function(event,point,delta){
              this._map.wheelZoom(event,point,delta);
          }
      };
   
      geomap.Event={TouchZoom:TouchZoom,Drag:Drag,ScrollWheelZoom:ScrollWheelZoom};
       
   
    })();
    