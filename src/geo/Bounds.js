(function() {

    var Point =geomap.Point;

    function Bounds(p0,p1){
        this.min=p0;
        this.max=p1;
    };

    Bounds.prototype={
        clone:function(){
            return new Bounds(this.min.clone(),this.max.clone());
        },
        getCenter:function(){
            return new Point((this.min.x+this.max.x)/2,(this.min.y+this.max.y)/2);
        },
        getBottomLeft:function(){
            return new Point(this.min.x,this.max.y);
        },
        getTopRigth:function(){
            return new Point(this.max.x,this.min.y);
        },
        getSize:function(){
            return this.max.subtract(this.min);
        },
        contains:function(p0){
            var min,max;
            p0=geomap.util.toPoint(p0);
            min=p0.min;
            max=p0.max;
            return (min.x >= this.min.x) && (max.x <= this.max.x) && (min.y >=this.min.y) && (max.y <= this.max.y);
        },
        //是否有边界相交　
        intersects:function(bounds){
            var min=this.min,max=this.max,min2=bounds.min,max2=bounds.max,
            xIntersects=(max2.x>=min.x) && (min2.x <=max.y),
            yIntersects=(max2.y>=min.y) && (min2.y <= max.y);
            return xIntersects && yIntersects;
        },
        //是否重叠
        overlaps:function(bounds){
            var min=this.min,max=this.max,min2=bounds.min,max2=bounds.max,
            xOverlaps=(max2.x> min.x) && (min2.x < max.y),
            yOverlaps=(max2.y> min.y) && (min2.y < max.y);
            return xOverlaps && yOverlaps;
        },
        toString:function(){
            return "Bounds("+this.min.x+","+this.min.y+","+this.max.x+","+this.max.y+")";
        }


    };

    function toBounds(minx,miny,maxx,maxy){
        var isPoint=geomap.util.isPoint,hasXY=geomap.util.hasXY,toPoint=geomap.util.toPoint;
        if(!minx || minx instanceof Bounds){
            return minx;
        }
        if(miny && isPoint(minx) && isPoint(miny)){
            return new Bounds(minx,miny);
        }
        if(hasXY(minx) && hasXY(miny)){
            return new Bounds(toPoint(minx),toPoint(miny));
        }
        return new Bounds(toPoint(minx,miny),toPoint(maxx,maxy));
    };

    geomap.Bounds=Bounds;
    geomap.util.toBounds=toBounds;

 
  })();
  