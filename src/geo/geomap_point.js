(function() {

    function Point(x,y){
        this.x=x;
        this.y=y;
    };

    var trunc = Math.trunc || function(v){
        return v>0? Math.floor(v):Math.ceil(v);
    };

    Point.prototype={
        clone: function(){
            return new Point(this.x,this.y);
        },
        zero:function(){
            this.x=0;
            this.y=0;
            return this;
        },
        add: function(point){
            return this.clone()._add(point);
        },
        _add: function(point){
            this.x +=point.x;
            this.y +=point.y;
            return this;
        },
        subtract: function(point){
            return this.clone()._subtract(point);
        },
        _subtract: function(point){
            this.x -= point.x;
            this.y -= point.y;
            return this;
        },
        divideBy:function(num){
            return this.clone()._divideBy(num);
        },
        _divideBy:function(num){
            this.x /=num;
            this.y /=num;
            return this;
        },
        multiplyBy:function(num){
            return this.clone()._multiplyBy(num);
        },
        _multiplyBy:function(num){
            this.x *=num;
            this.y *=num;
            return this;
        },
        scaleBy:function(point){
            return this.clone()._scaleBy(point);
        },
        _scaleBy:function(point){
            this.x *=point.x;
            this.y *=point.y;
            return this;
        },
        unscaleBy:function(point){
            return this.clone()._unscaleBy(point);
        },
        _unscaleBy:function(point){
            this.x=this.x / point.x;
            this.y=this.y / point.y;
            return this;
        },
        round:function(){
            return this.clone()._round();
        },
        _round:function(){
            this.x=Math.round(this.x);
            this.y=Math.round(this.y);
            return this;
        },
        floor:function(){
            return this.clone()._floor();
        },
        _floor:function(){
            this.x=Math.floor(this.x);
            this.y=Math.floor(this.y);
            return this;
        },
        ceil:function(){
            return this.clone()._ceil();
        },
        _ceil:function(){
            this.x=Math.ceil(this.x);
            this.y=Math.ceil(this.y);
            return this;
        },
        trunc:function(){
            return this.clone()._trunc();
        },
        _trunc:function(){
            this.x=trunc(this.x);
            this.y=trunc(this.y);
            return this;
        },
        distanceTo: function(point){
            var x=point.x-this.x,y=point.y-this.y;
            return Math.sqrt(x * x + y * y);
        },
        toString:function(){
            return "Point("+this.x+","+this.y+")";
        }

    };

    function toPoint(x,y){
        if(x instanceof Point){
            return x;
        }
        if(geomap.util.isArray(x)){
            return new Point(x[0],x[1]);
        }
        if(typeof x === 'object' && 'x' in x && 'y' in x){
            return new Point(x.x,x.y);
        }
        return new Point(x,y);
    }

    function isPoint(p0){
        if(p0 instanceof Point){
            return true;
        }
        return false;
    }

    function isZeroPoint(p0){
        return (p0.x==0 && p0.y ==0);
    }

    function hasXY(p0){
        if(!p0){
            return false;
        }
        if(isPoint(p0)){
            return true
        }
        if(typeof p0 === 'object' && 'x' in p0 && 'y' in p0){
            return true;
        }
        return false;
    }
    
    geomap.Point=Point;
    geomap.util.toPoint=toPoint;
    geomap.util.isPoint=isPoint;
    geomap.util.hasXY=hasXY;
    geomap.util.isZeroPoint=isZeroPoint;
  })();
  