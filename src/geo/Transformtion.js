(function() {

    var Point =geomap.Point;

    function Transformtion(a,b,c,d){
        this._a=a;
        this._b=b;
        this._c=c;
        this._d=d;
    };

    Transformtion.prototype={
        transform:function(point,scale){
            return this._transform(point,scale);
        },
        _transform:function(point,scale){
            scale = scale || 1;
            point.x =scale * (this._a * point.x + this._b);
            point.y= scale * (this._c * point.y + this._d);
            return point;
        },
        untransform:function(point,scale){
            scale = scale || 1;
            return new Point(
                (point.x /scale -this._b)/ this._a,
                (point.y /scale -this._d)/ this._c);
        }
        
    };

    

 

    geomap.Transformtion=Transformtion;
     
 
  })();
  