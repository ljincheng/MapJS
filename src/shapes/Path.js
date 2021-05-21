

  (function() { 

    var toPoint=geomap.util.toPoint,extend = geomap.util.object.extend;

    function Path(group,geometry){
       this.type="Path";
       this._group=group;
       group.add(this);
       this._geometry=extend({type:null,coordinates:[]},geometry);
    } 

    Path.prototype={
        setData:function(type,coords){
            this._geometry.type=type;
            this._geometry.coordinates=coords;
        },
        setProp:function(prop){
            this._properties=prop;
        },
        addProp:function(key,value){
            var prop= this._properties ||{};
            prop[key]=value;
            this._properties=prop;
        },
        splitH:function(cs,xnum,padding){
            var groupGeometry=[];
            var px=0;
            if(padding !=undefined){
                px=padding.x;
            }
            if(cs.length==5){
                var ptx0=cs[0],ptx1=cs[3],pbx0=cs[1],pbx1=cs[2];
                var pt=ptx1.subtract(ptx0),pb=pbx1.subtract(pbx0),pnum=xnum-1;
                var rt=(pt.x - pnum * px) / xnum, rb=(pb.x -pnum * padding)/ xnum;
                var start_p0=ptx0,start_p1=pbx0;
                for(var i=0;i<xnum;i++){//水平拆分
                    var newCoords=[];
                    newCoords.push(start_p0);
                    newCoords.push(start_p1);
                    var p0=start_p1.clone();
                    p0.x += rb;
                    newCoords.push(p0);
                    var p1=start_p0.clone();
                    p1.x+=rt;
                    newCoords.push(p1);
                    newCoords.push(start_p0);
                    // groupGeometry.push({type:'Polygon',coordinates:[newCoords]});
                    groupGeometry.push(newCoords);
                  
                    start_p0=p1.clone();
                    start_p1=p0.clone();
                    start_p0.x +=px;
                    start_p1.x +=px;
                }
            }
            return groupGeometry;
        },
        splitV:function(cs,ynum,padding){
            var groupGeometry=[],py=0;
            if(padding !=undefined){
                py=padding.y;
            }
            // padding=padding/2;
            if(cs.length==5){
                var pty0=cs[0],pty1=cs[1],pby0=cs[3],pby1=cs[2];
                var pl=pty1.subtract(pty0),pr=pby1.subtract(pby0),pnum=ynum-1;
                var rl=(pl.y - pnum * py)/ ynum, rr=(pr.y - pnum * py)/ ynum;
                var start_p0=pty0,start_p1=pby0;
                for(var i=0;i<ynum;i++){//垂直拆分
                    var newCoords=[];
                    newCoords.push(start_p0);
                    var p0=start_p0.clone();
                    p0.y += rl;
                    newCoords.push(p0);
                    var p1=start_p1.clone();
                    p1.y +=rr;
                    newCoords.push(p1); 
                    newCoords.push(start_p1);
                    newCoords.push(start_p0);
                  
                    // groupGeometry.push({type:'Polygon',coordinates:[newCoords]});
                    groupGeometry.push(newCoords);
                   
                    start_p0=p0.clone();
                    start_p1=p1.clone();
                    start_p0.y +=py;
                    start_p1.y +=py;
                }
            }
            return groupGeometry;
        },
        split:function(xnum,ynum,padding){
            var geom=this._geometry,minx=null,miny=null,maxx=null,maxy=null,cs;
            switch(geom.type){
                case 'Polygon':{
                      cs=geom.coordinates;
                    if(cs.length==1 && cs[0].length==5){
                        cs=cs[0];
                        var groupGeomArr=[];
                        var groupGeometry=this.splitH(cs,xnum,padding);
                            if(groupGeometry.length>0 ){
                                if( ynum !=undefined && ynum>1){
                                    for(var i=0,k=groupGeometry.length;i<k;i++){
                                        var vgeomArr=this.splitV(groupGeometry[i],ynum,padding);
                                        for(var j=0,jk=vgeomArr.length;j<jk;j++){
                                            groupGeomArr.push(vgeomArr[j]);
                                        }
                                    }
                                }else{
                                    groupGeomArr=groupGeometry;
                                }
                            }
                        // var groupGeometry=[];
                        // var ptx0=cs[0],ptx1=cs[3],pbx0=cs[1],pbx1=cs[2];
                        // var pt=ptx1.subtract(ptx0),pb=pbx1.subtract(pbx0);
                        // var rt=pt.x / xnum, rb=pb.x/ xnum;
                        // var start_p0=ptx0,start_p1=pbx0;
                        // for(var i=0;i<xnum;i++){//水平拆分
                        //     var newCoords=[];
                        //     newCoords.push(start_p0);
                        //     newCoords.push(start_p1);
                        //     var p0=start_p1.clone();
                        //     p0.x += rb;
                        //     newCoords.push(p0);
                        //     var p1=start_p0.clone();
                        //     p1.x+=rt;
                        //     newCoords.push(p1);
                        //     newCoords.push(start_p0);
                        //     for(var j=0;j<ynum;j++){//垂直拆分


                        //     }
                        //      groupGeometry.push({type:'Polygon',coordinates:[newCoords]});
                        //      if(i>0){
                        //          new Path(this._group,{type:'Polygon',coordinates:[newCoords]});
                        //      }
                        //     start_p0=p1;
                        //     start_p1=p0;
                        // }
                        if(groupGeomArr.length>0){
                            this._geometry.coordinates=[groupGeomArr[0]];
                            for(var i=1,k=groupGeomArr.length;i<k;i++){
                                new Path(this._group,{type:'Polygon',coordinates:[ groupGeomArr[i]]});
                            }
                        }
                         
                         
                    }
                    
                    break;
                }
                default:{
                    cs=geom.coordinates;
                }
            }
        },
        bounds:function(){
            var geom=this._geometry,minx=null,miny=null,maxx=null,maxy=null,cs;
            switch(geom.type){
                case 'Polygon':{
                      cs=geom.coordinates;
                    if(cs.length>0){
                        cs=cs[0];
                    }
                    break;
                }
                default:{
                    cs=geom.coordinates;
                }
            }
            if(cs.length>0){
                maxx = minx = cs[0].x; maxy = miny = cs[0].y;
                for(var i=1,k=cs.length;i<k;i++){
                    minx=Math.min(minx,cs[i].x);
                    miny=Math.min(miny,cs[i].y);
                    maxx=Math.max(maxx,cs[i].x);
                    maxy=Math.max(maxy,cs[i].y);
                }
                return  geomap.util.toBounds(minx,miny,maxx,maxy); 
            }else{
                return null;
            }
           
        },
        getGeometry:function(){
           return this._geometry;
        },
        getData:function(){
            var coords=this._geometry.coordinates,cs=[];
            var geometry={type:this._geometry.type,coordinates:[]};
            if(geometry.type == 'Polygon'){
                if(coords.length>0){
                    coords=coords[0];
                }
                geometry.coordinates=[cs];
            }else{
                geometry.coordinates=cs;
            }
            if(coords.length>0){
                for(var i=0,k=coords.length;i<k;i++){
                    cs.push([coords[i].x,coords[i].y]);
                }
                return geometry;
            }else{
                return null;
            }
          
        },
        getFeature:function(){
            return {geometry:this._geometry,properties:this._properties};
        }
    };
   

    geomap.shape.Path=Path;
    
  })();