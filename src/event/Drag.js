

(function() {
    var Point =geomap.Point;
    var EventDrag={
        openTouchZoom:false,
          dragEvent:function(event,self){
              
            if(!self.fingers || self.fingers ==1){
                eventjs.cancel(event);

                if(self.state == 'down'){
                    this._draging=true;
                    this._moved=false;
                    //惯性开启
                    if(this._inertia){
                        this._times=[];
                        this._positions=[];
                    }
                    return this;
                }else if(self.state == 'up'){
                    if(!this._moved || !this._draging){
                        this._draging=false;
                        return this;
                    }
                    this._draging=false; 
                    var point=new Point(self.x,self.y);
                    this.end(event,point);
                }else{
                    if(!this._draging  || this.openTouchZoom){
                        this._draging=false;
                        return this;
                    }
                    var point=new Point(self.x,self.y);
                    if(!this._moved ){
                        this.start(event,point);
                        this._moved=true;
                    }
                    this.change(event,point);
                }
                return this;
            }
          }
    }; 

    geomap.EventDrag=EventDrag;
     
 
  })();
  