(function() {

    //type:0-polygon,1-point,2=line,3-rect,4-circle
    function Path(map,pathType,fill,style){
        pathType = pathType || 0;
        style= style||{};
        fill= fill||false;
        
        this._points=[];
        this._map=map;
        this._type=pathType;
        this._start=true;
        this._point_weight=6;
        this._style=style;
        this._fill=fill;
    };

     
    Path.prototype={
        s2c:function(p){
            return this._map.screenToCoord(p);
         },
         c2s:function(c){
             return this._map.coordToScreen(c);
         },
         push:function(p){ 
             var coord=this.s2c(p);
             var len=this._points.length;
             if(len>0){
                 if(!this._points[len-1].equals(coord)){
                     this._points.push(coord);
                 }
             }else{
                this._points.push(coord);
             }
         },
         end:function(){
             this._movePoint=null;
             this._start=false;
             var len=this._points.length;
             switch(this._type){
                 case 0:{
                    if(len>2){
                        this._points.push(this._points[0])
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
                     return this._points.length==1;
                case 3:
                    case 4:
                    return this._points.length==2;
             }
             return false;
         },
         clearPoint:function(){
            var len=this._points.length;
            for(var i=0;i<len;i++){
                this._points[i]=null;
            }
            this._points=null;
            this._points=[];
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
             var len=this._points.length;
            if(len>0){ 
                this.setStyle(ctx);
                switch(this._type){
                    case 0:{
                        ctx.beginPath();
                        var p0=this.c2s(this._points[0]);
                        ctx.moveTo(p0.x,p0.y);
                        for(var i=1;i<len;i++){
                            var coord=this._points[i];
                            var p=this.c2s(coord);
                            ctx.lineTo(p.x,p.y);
                        }
                        if(this._start && this._movePoint && this._movePoint != null){
                            ctx.lineTo(this._movePoint.x,this._movePoint.y);
                        }
                         ctx.closePath();
                         this._fill?ctx.fill():ctx.stroke();
                         
                    }break;
                    case 1:{
                        var p=this.c2s(this._points[0]),r=this._point_weight;
                        ctx.fillRect(p.x-r/2,p.y-r/2,r,r);
                    }break;
                    case 2:{
                        ctx.beginPath();
                        var p0=this.c2s(this._points[0]);
                        ctx.moveTo(p0.x,p0.y);
                        for(var i=1;i<len;i++){
                            var coord=this._points[i];
                            var p=this.c2s(coord);
                            ctx.lineTo(p.x,p.y);
                        }
                        if(this._start && this._movePoint && this._movePoint != null){
                            ctx.lineTo(this._movePoint.x,this._movePoint.y);
                        }
                        ctx.stroke();
                    }break;
                    case 3:{
                        var p0=this.c2s(this._points[0]),p1;
                        if(len==2){
                            p1=this.c2s(this._points[1]).subtract(p0);
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
 
    
    geomap.Path=Path;
    
  })();
  