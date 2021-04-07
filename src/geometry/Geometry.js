(function() {

    var Geometry={
        _coordinates:[],
        _map:null, 
        _start:true,
        _fill:false,
        _pointWeight:6,
        _type:0,//type:0-polygon,1-point,2=line,3-rect,4-circle
        style:{},
        lineDashOffset:0,
        lineDash:null,
        loopRender:true,
        setMap:function(map){this._map=map;},
        s2c:function(p){return this._map.screenToCoord(p);},
        c2s:function(c){ return this._map.coordToScreen(c).round(); },
        addCoord:function(coord){ 
            var len=this._coordinates.length;
            if(len>0){
                if(!this._coordinates[len-1].equals(coord)){
                    this._coordinates.push(coord);
                }
            }else{
               this._coordinates.push(coord);
            }
        }, 
        setType:function(gtype,fill){
            this.clear();
            this._fill= fill||false;
             if(typeof gtype == 'string'){
                if(gtype=="Polygon"){
                    this._type=0;
                }else if(gtype == "Point"){
                    this._type=1;
                }else if(gtype == "Line"){
                    this._type=2;
                }else if(gtype== "Rect"){
                    this._type=3;
                }else if(gtype=="Circle"){
                    this._type=4;
                }
            }else{
                this._type=gtype;
            }
            
        },
        push:function(p){ 
            var coord=this.s2c(p);
           this.addCoord(coord);
        },
        clear:function(){
            var oldCoords=this._coordinates;
            this._coordinates=[];
            var len=oldCoords.length;
            for(var i=0;i<len;i++){
                oldCoords[i]=null;
            } 
        },
        moveTo:function(p){
            if(this._start){
               this._movePoint=p;
            }
        },
        end:function(){
            this._movePoint=null;
            this._start=false;
            var len=this._coordinates.length;
            switch(this._type){
                case 0:{
                   if(len>2){
                       this._coordinates.push(this._coordinates[0])
                   }else{
                       this.clearPoint();
                   }
                }
                break;
                case 2:{
                    if(len<2){
                        this.clearPoint();
                    }
                }break;
                case 3:
                case 4:{
                    if(len!=2){
                        this.clearPoint();
                    }
                }break;
                
            }
        },
        isEnd:function(){
            switch(this._type){
                case 1:
                    return this._coordinates.length==1;
               case 3:
                   case 4:
                   return this._coordinates.length==2;
            }
            return false;
        },
        setStyle:function(ctx){
            var options=this.style;
               for (var prop in options) { 
                   ctx[prop]=options[prop];
                }
        },
        render:function(ctx){
            var len=this._coordinates.length;
            if(this.lineDash){
                ctx.setLineDash(this.lineDash);
                ctx.lineDashOffset = this.lineDashOffset;
                this.lineDashOffset += 1;
                this.loopRender=true;
            } else{
                this.loopRender=false;
            }

           if(len>0){ 
               this.setStyle(ctx);
               switch(this._type){
                   case 0:{
                       ctx.beginPath();
                       var p0=this.c2s(this._coordinates[0]);
                       ctx.moveTo(p0.x,p0.y);
                       for(var i=1;i<len;i++){
                           var coord=this._coordinates[i];
                           var p=this.c2s(coord);
                           ctx.lineTo(p.x,p.y);
                       }
                       if(this._start && this._movePoint && this._movePoint != null){
                           ctx.lineTo(this._movePoint.x,this._movePoint.y);
                       }
                        ctx.closePath();
                        ctx.stroke();
                         
                        if(this._fill){
                        ctx.fill();
                        }
                   }break;
                   case 1:{
                       var p=this.c2s(this._coordinates[0]),r=this._point_weight;
                       ctx.fillRect(p.x-r/2,p.y-r/2,r,r);
                   }break;
                   case 2:{
                       ctx.beginPath();
                       var p0=this.c2s(this._coordinates[0]);
                       ctx.moveTo(p0.x,p0.y);
                       for(var i=1;i<len;i++){
                           var coord=this._coordinates[i];
                           var p=this.c2s(coord);
                           ctx.lineTo(p.x,p.y);
                       }
                       if(this._start && this._movePoint && this._movePoint != null){
                           ctx.lineTo(this._movePoint.x,this._movePoint.y);
                       }
                       ctx.stroke();
                   }break;
                   case 3:{
                       var p0=this.c2s(this._coordinates[0]),p1;
                       if(len==2){
                           p1=this.c2s(this._coordinates[1]).subtract(p0);
                           // ctx.strokeRect(p0.x,p0.y,p1.x,p1.y);
                           this._fill?ctx.fillRect(p0.x,p0.y,p1.x,p1.y):ctx.strokeRect(p0.x,p0.y,p1.x,p1.y);
                       }else if(this._start && this._movePoint && this._movePoint != null){
                           p1=this._movePoint.subtract(p0);
                           // ctx.strokeRect(p0.x,p0.y,p1.x,p1.y);
                           this._fill?ctx.fillRect(p0.x,p0.y,p1.x,p1.y):ctx.strokeRect(p0.x,p0.y,p1.x,p1.y);
                       }
                   }
               }
                
              
           }

        }
    };
     
    
    geomap.Geometry=Geometry;
    
  })();
  