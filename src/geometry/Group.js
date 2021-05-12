

  (function() { 

    var toPoint=geomap.util.toPoint,extend = geomap.util.object.extend;

    function GeometryGroup(){
       this.type="group";
       this._data=[];
    }
    GeometryGroup.prototype={
        add:function(geometry){
            if(geometry){
                if(typeof geometry == 'array'){
                    for(var i=0,k=geometry.length;i<k;i++){
                        this._data.push(geometry[i]);
                    }
                }else if(typeof geometry == 'object'){
                    this._data.push(geometry);
                }
            }
        },
        remove:function(index){
            if(this._data.length<index){
                this._data.splice(index,1);
            }
        },
        draw:function(ctx,options){
            for(var i=0,k=this._data.length;i<k;i++){
                this._data[i].draw(ctx,options);
            }
        },
        getData:function(){
            var data=[]
            for(var i=0,k=this._data.length;i<k;i++){
                data.push(this._data[i].getData());
            }
            return data;
        }
    };
   

    geomap.GeometryGroup=GeometryGroup;
  })();