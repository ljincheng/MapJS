
(function() {
    
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
    
    geomap.view.Frame= geomap.Class(geomap.CommonMethods, geomap.Observable,  {
      type: 'BaseFrame',
      container:undefined,
      headBar:undefined,
      bodyBar:undefined,
      rootFrame:undefined,
      closeBtn:undefined,
      x:0,
      y:0,
      w:200,
      h:120,
      pos:'center',
      posPad:10,
      headHeight:26,
      bodyheight:50,
      closeBtnSize:20,
      padding:4,
      title:"",
      body:undefined,
      radius:6,
      closeType:1,//１为直关闭，２为隐藏
      showBody:true,
      canHeadDblClick:true,
      boxShadow:"2px 2px 4px #888888",
      background:"rgba(255,255,255,0.97)",
      closeIcon:'<svg t="1619335973042" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1119" width="20" height="20"><path d="M391.68 667.306667a34.133333 34.133333 0 0 1-24.132267-58.2656L464.571733 512l-97.024-97.041067a34.133333 34.133333 0 1 1 48.264534-48.264533l97.041066 97.041067 96.187734-96.170667a34.133333 34.133333 0 1 1 48.264533 48.264533l-96.1024 96.1024 96.017067 95.3344a34.133333 34.133333 0 1 1-48.093867 48.4352l-96.187733-95.505066-97.109334 97.109333c-6.673067 6.656-15.4112 10.001067-24.149333 10.001067z" p-id="1120"></path></svg>',
      initialize: function(container,options) {
        options || (options = { }); 
        this._setOptions(options);
        this.container=container;
        // borderRadius:opt.borderRadius,boxShadow:"2px 2px 4px #888888"
        this.rootFrame =geomap.element.create("div",{className:"rootFrame"},{zIndex:"1000",position:"absolute",top:"0px",left:"0px",border:"0px solid #989898",background:this.background,borderRadius:this.radius+"px",boxShadow:this.boxShadow});
        this.headBar =geomap.element.create("div",{className:"headBar"},{position:"absolute",top:"0px",left:"0px",borderBottom:"1px solid #b9b9b9"});
        this.bodyBar =geomap.element.create("div",{className:"body"},{position:"absolute",top:this.headHeight+"px",left:"0px"});
        var left=this.w-this.closeBtnSize-this.padding,top=this.padding;
        this.closeBtn=geomap.element.create("div",{className:"closeBtn"},{position:"absolute",top:top+"px",left:left+"px",width:this.closeBtnSize+"px",height:this.closeBtnSize+"px"});
        this.closeBtn.innerHTML=this.closeIcon;
        this.rootFrame.appendChild(this.headBar);
        this.rootFrame.appendChild(this.bodyBar);
        this.rootFrame.appendChild(this.closeBtn);
        this.container.appendChild(this.rootFrame);
        this.resetPos();
        this.resetStyle();
        this.resetBody();
        this._resize=this.resetStyle.bind(this);
        var closeFn=this.close.bind(this);
        this._close=closeFn
       // this.on("resize",this._resize);
        // this.on("close",this._close);
        var togle
        
        eventjs.add(this.closeBtn,"click touch",this._close);
        eventjs.add(this.headBar,"drag gesture",this.dragHeadBarEv.bind(this));
        if(this.canHeadDblClick){
          eventjs.add(this.headBar,"dblclick",this.displayBodyToggle.bind(this));
        }
        eventjs.add(this.rootFrame,"click touch",this.rootFrameClickEv.bind(this));
        // this.closeBtn.click=closeFn;
      }, 
      rootFrameClickEv:function(event,self){
        if(event){
          eventjs.cancel(event);
        }
        if(geomap._FrameLayerZIndex){
          geomap._FrameLayerZIndex+=1;
          this.rootFrame.style.zIndex= geomap._FrameLayerZIndex;
        }else{
          geomap._FrameLayerZIndex=geomap.util.formatNum(this.rootFrame.style.zIndex);
          this.rootFrame.style.zIndex=geomap._FrameLayerZIndex;
        }
      },
      dragHeadBarEv:function(event,self){
        eventjs.cancel(event);
        if(self.state == 'down'){
          var x=self.x,y=self.y;
          this._start_point=new Point(x,y);
          this._status_drag=true;
          this.rootFrameClickEv(event,self);
        }else if(self.state == 'up'){
          this._status_drag=false;
          var p=new Point(self.x,self.y);
          p._subtract(this._start_point);
          var left=this.x+p.x,top=this.y+p.y;
          if(left< (this.closeBtnSize-this.w)){
            left= this.closeBtnSize-this.w;
          }else if(left > (window.innerWidth -5)){
            left=window.innerWidth -5;
          }
          
          if(top<0){
            top=0;
          }else if(top > (window.innerHeight - this.headHeight)){
            top=window.innerHeight-this.headHeight;
          }

          this.x=left;
          this.y=top;
          this.resetStyle();
        }else{
          if(this._status_drag){
            var p=new Point(self.x,self.y);
            // geomap.debug("#=====p0:"+p.toString()+",sp:"+this._start_point.toString());
            p._subtract(this._start_point);
            // geomap.debug("#=====p1:"+p.toString());
            var left=this.x+p.x,top=this.y+p.y;
            if(left<(this.closeBtnSize-this.w)){
              left=(this.closeBtnSize-this.w);
            }else if(left > (window.innerWidth -5)){
              left=window.innerWidth-5;
            }
            
            if(top<0){
              top=0;
            }else if(top > (window.innerHeight -this.headHeight)){
              top=window.innerHeight-this.headHeight;
            }
       
            this.rootFrame.style.left=left+"px";
            this.rootFrame.style.top=top+"px";
          }

        }
      },
      resetPos:function(){
        var w=this.container.clientWidth || window.clientWidth,h=this.container.clientHeight || window.innerHeight;
        var pad=this.posPad;
         if(this.pos=== 'center'){
              this.x=Math.floor((w-this.w)/2);
              this.y=Math.floor((h-this.h)/2);
              return this;
         }
         if(this.pos=== 'rc'){
          this.x=Math.floor((w-this.w))-pad;
          this.y=Math.floor((h-this.h)/2);
          return this;
          }
          if(this.pos=== 'lc'){
            this.x=pad;
            this.y=Math.floor((h-this.h)/2);
            return this;
            }
         if(this.pos === 'lb'){
            this.x= pad;
            this.y=h-this.h - pad;
            return this;
         }
         if(this.pos === 'rb'){
           this.x=w-this.w - pad;
           this.y=h-this.h - pad;
           return this;
         }
          
         if(this.pos === 'rt'){
           this.x=w-this.w - pad;
           this.y=pad;
           return this;
         }
         if(this.pos=== 'lt'){
           this.y= pad;
           this.x= pad;
           return this;
         }

      },
      resetStyle:function(){
        this.bodyheight=this.h-this.headHeight;
        var winW=window.innerWidth,winH=window.innerHeight;
        this.w=Math.min(this.w,winW);
        this.h=Math.min(this.h,winH);
        var left=this.w-this.closeBtnSize-this.padding,top=this.padding; 
        var  headH=this.headHeight-this.padding;
        geomap.element.setStyle(this.closeBtn,{width:this.closeBtnSize+"px",height:this.closeBtnSize+"px",left:left+"px",top:top+"px"});
        geomap.element.setStyle(this.headBar,{width:(this.w-this.padding)+"px",height:headH+"px",paddingLeft:this.padding+"px",paddingTop:this.padding+"px"});
        if(this.showBody){
          geomap.element.setStyle(this.bodyBar,{width:this.w+"px",height:this.bodyheight+"px",top:this.headHeight+"px",display:""});
          geomap.element.setStyle(this.rootFrame,{width:this.w+"px",height:this.h+"px",top:this.y+"px",left:this.x+"px"});
        }else{
          geomap.element.setStyle(this.bodyBar,{width:this.w+"px",height:"0px",top:this.headHeight+"px",display:"none"});
          geomap.element.setStyle(this.rootFrame,{width:this.w+"px",height:this.headHeight+"px",top:this.y+"px",left:this.x+"px"});
        }
        return this;
      },
      resetBody:function(){
        // this.headBar.innerHTML=this.title;
        // this.bodyBar.innerHTML=this.body;
        this.setTitle(this.title);
        this.setBody(this.body);
        return this;
      },
      setTitle:function(title){
        this.title=title;
        this.headBar.innerHTML=this.title;
        return this;
      },
      setBody:function(body){
        this.body=body;
        if(this.body === undefined){
          this.bodyBar.innerHTML="";
        }else if(typeof this.body === 'string'){
          this.bodyBar.innerHTML=this.body;
        }else{
          this.bodyBar.innerHTML="";
          this.bodyBar.appendChild(this.body);
          // this.setFormJson(this.body);
        }
      
        if(this._loadBody){
          this.fire("datachange");
        } 
        this._loadBody=true;
        return this;
      },
      setData:function(title,body,options){
        this.setTitle(title);this.setBody(body);
        if(options!= undefined){
          this._setOptions(options);
          this.resetStyle();
        }
       
      },
      close:function(){
        if(this.closeType ===1){
          this.fire("closestart"); 
          this.body=null;
          this.container.removeChild(this.rootFrame);
          this.fire("close"); 
          delete this;
        }else{
          this.hide();
          this.fire("close"); 
        }
      },
     
      show:function(){
        if(this.rootFrame.style.display === 'none'){
          this.rootFrame.style.display="";
          this.fire("show"); 
        }
        this.rootFrameClickEv();
        return this;
      },
      hide:function(){
        if(this.rootFrame.style.display != 'none'){
          this.rootFrame.style.display="none";
          this.fire("hide"); 
        }
        return this;
      },
      displayToggle:function(){
        if(this.rootFrame.style.display === 'none'){
          this.show();
        }else{
          this.hide();
        }
      },
      displayBodyToggle:function(){
        this.showBody= !this.showBody;
        this.resetStyle();
      }
      
    });
   
  
  })();
  