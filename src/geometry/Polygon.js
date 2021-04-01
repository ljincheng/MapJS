(function() { 
    var Point =geomap.Point;

    //type:0-polygon,1-point,2=line,3-rect,4-circle
    function Polygon(map,coords,fill,style){
        coords= coords || [];
        style= style||{};
        fill= fill||false;
        
        this._coordinates=coords;
        this._map=map;
        this._type=0;
        this._start=true;
        this._point_weight=6;
        this._style=style;
        this._fill=fill;
        this._lineDashOffset=0;
    };

     
    Polygon.prototype={
        s2c:function(p){
            return this._map.screenToCoord(p);
         },
         c2s:function(c){
             return this._map.coordToScreen(c);
         },
         setData:function (data){
             var gtype=data.type;
             var gcoords=data.coordinates;
             this._type=0;
             if(gcoords.length>0){
                 var gcoord=gcoords[0];
                 if(gcoord.length>0){
                     for(var i=0,k=gcoord.length;i<k;i++){
                         this._coordinates.push(new Point(gcoord[i][0],gcoord[i][1]));
                     }
                 }
             }
         },
         push:function(p){ 
             var coord=this.s2c(p);
             var len=this._coordinates.length;
             if(len>0){
                 if(!this._coordinates[len-1].equals(coord)){
                     this._coordinates.push(coord);
                 }
             }else{
                this._coordinates.push(coord);
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
         clearPoint:function(){
            var len=this._coordinates.length;
            for(var i=0;i<len;i++){
                this._coordinates[i]=null;
            }
            this._coordinates=null;
            this._coordinates=[];
         },
         moveTo:function(p){
             if(this._start){
                this._movePoint=p;
             }
         },
         setStyle:function(ctx){
             var options=this._style;
                for (var prop in options) { 
                    ctx[prop]=options[prop];
                 }
         },
         getPoints:function(){
            //  return this.
         },
         render:function(ctx){
             var len=this._coordinates.length;
             this._lineDashOffset += 4;
            //  this._lineDashOffset =this._lineDashOffset/16;
            if(len>0){ 
                this.setStyle(ctx);
                switch(this._type){
                    case 0:{
                        ctx.setLineDash([8, 4]);
                        ctx.lineDashOffset = -this._lineDashOffset;
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
                        //  this._fill?ctx.fill():ctx.stroke();
                         
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
 
    
    geomap.Polygon=Polygon;
    
  })();
  