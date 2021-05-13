

  (function() { 

    var toPoint=geomap.util.toPoint,extend = geomap.util.object.extend;

    function Group(){
       this.type="group";
       this._data=[];

    }
    Group.prototype={
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
        draw:function(ctx,map){
            for(var i=0,k=this._data.length;i<k;i++){
                geomap.shape.draw(ctx,map,this._data[i].getGeometry())
               // this._data[i].draw(ctx,options);
            }
        },
        split:function(xnum,ynum){
            var data=[]
            for(var i=0,k=this._data.length;i<k;i++){
                this._data[i].split(xnum,ynum);
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
   

    geomap.shape.Group=Group;
  })();