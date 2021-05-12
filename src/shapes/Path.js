

  (function() { 

    var toPoint=geomap.util.toPoint,extend = geomap.util.object.extend;

    function Path(group,type){
       this.type="Path";
       this._group=group;
       this._geometry={type:type,coordinates:[]}};
    } 

    Path.prototype={
        setData:function(type,coords){
            this._geometry.type=type;
            this._geometry.coordinates=coords;
        },
        bounds:function(){
            var geom=this._geometry,minx=null,miny=null,maxx=null,maxy=null;
            switch(geom.type){
                case 'Polygon':{
                    var cs=geom.coordinates;
                    if(cs.length>0){
                        cs=cs[0];
                        if(cs.length>0){
                            maxx = minx = cs[0].x; maxy = miny = cs[0].y;
                            for(var i=1,k=cs.length;i<k;i++){
                                minx=Math.min(minx,cs[i].x);
                                miny=Math.min(miny,cs[i].y);
                                maxx=Math.max(maxx,cs[i].x);
                                maxy=Math.max(maxy,cs[i].y);
                            }
                        }
                    }
                    break;
                }
                case 'Line':{
                    break;
                }
            }
        },
        draw:function(ctx,options){
            for(var i=0,k=this._data.length;i<k;i++){
                this._data[i].draw(ctx,options);
            }
        },
        getData:function(){
           return this._geometry;
        }
    };
   

    geomap.shape.Path=Path;
    
  })();