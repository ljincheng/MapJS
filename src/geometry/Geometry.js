(function() {

     /**
      * Data:{coordinates:[[[x,y],[x,y]...],[[x,y]...]],type:"Polygon",}
      */
     
    
    geomap.Geometry=geomap.Class(geomap.CommonMethods, geomap.Observable ,{
        _coordinates:[],
        _map:null, 
        _start:true,
        _fill:false,
        _pointWeight:6,
        _type:0,//type:0-polygon,1-point,2=line,3-rect,4-circle
        style:{fillStyle:"rgba(0, 0, 0, 0.4)",strokeStyle:"rgba(0,255,255,0.9)",lineWidth:2},
        lineDashOffset:0,
        lineDash:[],
        loopRender:false,
           initialize: function(map, options) { 
                options || (options = { });
                // Extend(this,Geometry);
                this._setOptions(options); 
                this._map=map;
                this._type=0;
              },
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
        getType:function(){
            var mtype="Polygon";
            
            switch(this._type){
                case 1:
                    mtype="Point";
                    break;
                case 2:
                    mtype="Line";
                    break;
                case 3:
                    mtype="Rect";
                    break;
                case 4:
                    mtype="Circle";
                    break;

            }
            return mtype;
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
                       this.clear();
                   }
                }
                break;
                case 2:{
                    if(len<2){
                        this.clear();
                    }
                }break;
                case 3:
                case 4:{
                    if(len!=2){
                        this.clear();
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
        getText:function(){
            var jsonObj=this.getJson();
            return JSON.stringify(jsonObj);
        },
        getJson:function(){
            var coords=this._coordinates,num=coords.length;
            var geoJson={type:"",coordinates:[]};
            if(num<1){
                return geoJson;
            } 
            switch(this._type){
                case 1:{
                    geoJson.type="Point";
                    geoJson.coordinates=[coords[0].x,coords[0].y];
                }
                    break;
                case 2:{
                    geoJson.type="Line";
                    for(var i=0;i<num;i++){
                        geoJson.coordinates.push([coords[i].x,coords[i].y]);
                    }
                }
                    break;
                case 3:{
                    geoJson.type="Polygon";
                    if(num>1){

                        var p1=coords[0],p2=coords[1],pg1=[];
                        pg1.push([p1.x,p1.y]);
                        pg1.push([p1.x,p2.y]);
                        pg1.push([p2.x,p2.y]);
                        pg1.push([p2.x,p1.y]);
                        pg1.push([p1.x,p1.y]);
                        geoJson.coordinates.push(pg1);
                    }
                }
                    break;
                default:{
                    geoJson.type="Polygon";
                    if(num>1){

                        var p1=coords[0],p2=coords[1],pg1=[];
                        for(var i=0;i<num;i++){
                            pg1.push([coords[i].x,coords[i].y]);
                        }
                        geoJson.coordinates.push(pg1);
                    }
                }

            }
            return geoJson; 

        },
        render:function(ctx){
            var len=this._coordinates.length;
            ctx.setLineDash([]);
            
            if(this.lineDash && this.lineDash.length>1){
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
                       ctx.strokeRect(p.x-r/2,p.y-r/2,r,r);
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
    });
    
  })();
  