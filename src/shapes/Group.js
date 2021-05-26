

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
            ctx.strokeStyle ="rgba(227, 242, 253, 0.6)";
            ctx.fillStyle ="rgba(33, 150, 243, 0.6)";
            for(var i=0,k=this._data.length;i<k;i++){
                geomap.shape.draw(ctx,map,this._data[i].getGeometry())
               // this._data[i].draw(ctx,options);
            }
        },
        split:function(xnum,ynum,padding){
            var data=[]
            for(var i=0,k=this._data.length;i<k;i++){
                this._data[i].split(xnum,ynum,padding);
            }
            
        },
        bounds:function(){
            var boundArr=[],minx,miny;
            for(var i=0,k=this._data.length;i<k;i++){
                boundArr.push(this._data[i].bounds());
            }
            for(var i=0,k=boundArr.length;i<k;i++){
                var bd=boundArr[i];
                if(bd!=null){
                    
                }
            }
        },
        getSize:function(){
            return this._data.length;
        },
        getPaths:function(){return this._data;},
        getData:function(){
            var data=[]
            for(var i=0,k=this._data.length;i<k;i++){
                data.push(this._data[i].getData());
            }
            return data;
        },
        clear:function(){
            var n=this._data.length;
            if(n>0){
                while(n>0){
                    var last=this._data.pop();
                    delete last;
                    n=this._data.length;
                }
            }
        }
    };
   

    geomap.shape.Group=Group;
  })();