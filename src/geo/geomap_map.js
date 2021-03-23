
(function(global) {

    'use strict';
  
    var extend = geomap.util.object.extend;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Map) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }
   
    geomap.Map = geomap.util.createClass(geomap.CommonMethods,  {
      type: 'object',
      width:100,
      height:100,
      origin:{x:-180,y:90},
      tileSize:256,
      center:{x:0,y:0},
      canvas:null,
      canvasCtx:null,
      offscreenCanvas:null,
      offscreenCtx:null,
      _layers:[],
      _move_start:null,
      _pos:null,
      _move_type:-1,
      _global_interval:null,
      _canrender:true,
      initialize: function(element, options) {
        options || (options = { }); 
        this._setOptions(options);
        this._element = element;
        this._pos={x:0,y:0};
        this._move_start={x:0,y:0};
        this._initModel();
        this._initElement();
        this._initEvent();
        this._drawlayer();
        this._global_interval=setInterval(this._draw.bind(this),20);
      },
      _dispose:function(){
        if(this._global_interval!=null){
          clearInterval(this._global_interval);
          this._global_interval=null;
        } 
      },
      _initElement:function(){ 
        var el_canvas=geomap.util.element.create("canvas",{id:"_map_canvas",width:this.width,height:this.height},{zIndex:2,border:"1px solid red",backgroundColor:"#e4e4e4",position:"absolute",width:this.width+"px",height:this.height+"px"});
        var el_offscreen_canvas=geomap.util.element.create("canvas",{id:"_map_canvas2",width:this.width,height:this.height},{zIndex:2,border:"1px solid blue",backgroundColor:"#e4e4e4",position:"absolute",width:this.width+"px",height:this.height+"px",top:"0px"});

        var el_offscreen_div=geomap.util.element.create("div",{width:this.width,height:this.height},{zIndex:1,border:"1px solid blue",backgroundColor:"#e4e4e4",position:"absolute",width:this.width+"px",height:this.height+"px",top:this.height+"px"});
        this._element.appendChild(el_canvas);
        this._element.appendChild(el_offscreen_div);
        el_offscreen_div.appendChild(el_offscreen_canvas);

        this.canvas=el_canvas;
        const ctx=el_canvas.getContext("2d");
        this.canvasCtx=ctx;
        this.offscreenCanvas=el_offscreen_canvas;
        const offscreen_ctx=el_offscreen_canvas.getContext("2d");
        this.offscreenCtx=offscreen_ctx;
      },
      _initEvent:function(){
          eventjs.add(this.canvas,"drag",function(event,self){ 
            geomap.coord.setPoint(this._pos,self);
            geomap.util.event.moving(self.x,self.y); 
            if(self.state=="down"){
                this._move_type=1;
                geomap.coord.setPoint(this._move_start,self);
                geomap.util.event.speedStart(self.x,self.y);
            }else if(self.state =="move"){ 
                
            }else{
              this._move_type=-1; 
              geomap.util.event.speedEnd();       
            }
          
          }.bind(this));
      },
      _initModel:function(){
        extend(this.origin,{x:-180.00,y:90.00});
      },
      _draw:function(){ 
        if(this._canrender==true){
          this._canrender=false;
          //var speed=geomap.util.event.speeding();
          const ctx=this.canvasCtx;
          var wh=geomap.coord.size(this._move_start,this._pos);
          console.log("drawMap:x="+this._move_start.x+",y="+this._move_start.y+",w="+wh[0]+",h="+wh[1]+",pos="+this._pos.x+","+this._pos.y);
          
          this._clearCanvas();
         
      
      // this.fromURL(url);

      //
     // ctx.clearRect(0,0,this.width,this.height);
      ctx.drawImage(this.offscreenCanvas,0,0);
      ctx.strokeRect(this._move_start.x,this._move_start.y,wh[0],wh[1]);
     

        }
      },
      _drawlayer:function(){
            //TODO draw Tile
            var tsize=this.tileSize;
            var cells=Math.round( this.width/tsize)+2;
            var rows=Math.round(this.height/tsize)+2;
            var z=1;
            var res=this.resolution(z);
            var cx= this.center.x- Math.floor((this.width * res.x)/2);
            var cy=this.center.y + Math.floor((this.height * res.y)/2);
            var startPos=[cx,cy];
  
           var startTile=this.getTileInfo(res,startPos);
           console.log("cells="+cells+",rows="+rows+",left="+startTile.left+",top="+startTile.top);
        //  var url="http://fabricjs.com/article_assets/9.png";
        var cell=startTile.cell;
        var row=startTile.row;
        var left=startTile.left;
        var top=startTile.top;
         for(var c=0;c<cells;c++){
           for(var r=0;r<rows;r++){
            var  x=1*cell + c;
             var y=1*row + r;
             var l=Math.floor(left+tsize*c);
             var t=Math.floor(top+tsize*r);
             if( x>=0 && y>=0 ){
                var imgUrl="http://mt1.google.cn/vt/x="+x+"&y="+y+"&z="+z;
                this.fromURL(imgUrl,{left:l,top:t});  
             }
           }
         }
         
      },
      fromURL:function(url,opts){
        this.loadImage(url,function(img,isError){
          if(isError){
            console.log("load img fail:"+url);
            return ;
          }
          console.log("load img:"+url+",left="+this.opts.left+",top="+this.opts.top);
          this.obj.offscreenCtx.drawImage(img,this.opts.left,this.opts.top);
          this.obj._canrender=true;
        },{obj:this,opts:opts});
      },
      loadImage:function(url,callback,context){

        if(!url){
          callback && callback.call(context,url);
          return;
        }
        var img=geomap.util.element.create("img");
        var onLoadCallback=function(){
          callback && callback.call(context,img,false);
          img=img.onload=img.onerror=null;
        };
        img.onload=onLoadCallback;
        img.onerror=function(){
          console.log("Error loading "+img.src);
          img = img.onload = img.onerror = null;
          callback && callback.call(context,null,true);
        };
        img.src=url;
      },
      _clearCanvas:function(){
        this.canvasCtx.clearRect(0,0,this.width,this.height);
      },
      resolution:function(level)
      {
          var x = (360 / (Math.pow(2, level)) / this.tileSize);
          var y = (180 / (Math.pow(2, level)) / this.tileSize);
         return { x: x, y: y };
      },
      getTileInfo:function(res,pos){
        // var res=this.resolution(level);
        var x=pos[0],y=pos[1];
        var o=this.origin;
        var tsize=this.tileSize;
        var cell=Math.floor((x-o.x)/res.x/tsize);
        var row=Math.floor((o.y-y)/res.y/tsize);
        var left=-(x-o.x)/res.x +tsize*cell;
        var top= -(o.y-y)/res.y +tsize*row;
        return {cell:cell,row:row,left:left,top:top,res:res};
      },
      addLayer:function(layer){
        this._layers.push(layer);
        layer.initLayer(this._el_canvas);
      }
      
     
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  