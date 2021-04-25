
(function() {
    
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
    geomap.closeFrame=function(ev){
        if(geomap.element.hasClass(ev.target,"closeIcon")){
            ev.target.parentNode.parentNode.parentNode.removeChild(ev.target.parentNode.parentNode);
        }
    };

    geomap.FrameLayer= geomap.Class(geomap.CommonMethods, geomap.Observable,  {
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
      background:"rgba(255,255,255,0.9)",
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
        eventjs.add(this.headBar,"drag",this.dragHeadBarEv.bind(this));
        if(this.canHeadDblClick){
          eventjs.add(this.headBar,"dblclick",this.displayBodyToggle.bind(this));
        }
        eventjs.add(this.rootFrame,"click touch",this.rootFrameClickEv.bind(this));
        // this.closeBtn.click=closeFn;
      }, 
      rootFrameClickEv:function(event,self){
        eventjs.cancel(event);
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
            geomap.debug("#=====p0:"+p.toString()+",sp:"+this._start_point.toString());
            p._subtract(this._start_point);
            geomap.debug("#=====p1:"+p.toString());
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
          this.setFormJson(this.body);
        }
      
        if(this._loadBody){
          this.fire("datachange");
        } 
        this._loadBody=true;
        return this;
      },
      setFormJson:function(form){
        var formId=form.id || ("form_"+ new Date());
        var root=geomap.element.create("form",{"id":formId},{"marginTop":"10px"});
        if(form.properties){
          // var form=formObj.form;
          var rowStyle={"height":"30px"};
          for(var j=0,jn=form.properties.length;j<jn;j++){
            var pro=form.properties[j];
            if(pro.type === "text"){
              var div=geomap.element.create("div",{},rowStyle);
              var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
              layer.innerText=pro.title;
              var input=geomap.element.create("input",{"type":"text","name":pro.id});
              input.value=pro.value;
              div.appendChild(layer);
              div.appendChild(input);
              root.appendChild(div);
            }else if(pro.type === 'hidden'){
              var input=geomap.element.create("input",{"type":"hidden","name":pro.id});
              input.value=pro.value;
              root.appendChild(input);
            }else if(pro.type === 'radio' || pro.type==='checkbox'){
              var div=geomap.element.create("div",{},rowStyle);
              var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
              layer.innerText=pro.title;
              div.appendChild(layer);
              for(var option in pro.option){
                  var label=geomap.element.create("label");
                  var radio=geomap.element.create("input",{"type":pro.type,"name":pro.id});
                  radio.value=option;
                  var labelTxt=geomap.element.create("a");
                  labelTxt.innerText=pro.option[option];
                  label.appendChild(radio);
                  label.appendChild(labelTxt);
                  div.appendChild(label);
                if(pro.value === option){
                  radio.checked=true;
                } 
              }
              root.appendChild(div); 
            }else if(pro.type==='select'){
              var div=geomap.element.create("div",{},rowStyle);
              var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
              layer.innerText=pro.title;
              var selectObj=geomap.element.create("select",{"name":pro.id});
              for(var option in pro.option){
                  var selOpt=geomap.element.create("option",{"type":'checkbox',"name":pro.id});
                  selOpt.value=option;
                  selOpt.innerText=pro.option[option]; 
                  selectObj.appendChild(selOpt); 
                if(pro.value === pro.option[option]){
                  radio.selected=true;
                } 
              }
              div.appendChild(layer);
              div.appendChild(selectObj);
              root.appendChild(div); 
            }else if(pro.type === 'button'){
              var div=geomap.element.create("div",{},rowStyle);
              var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
              layer.innerHTML="&nbsp;";
              div.appendChild(layer);
              var btn=geomap.element.create("input",{"type":"button","className":"btn","name":pro.id});
              btn.value=pro.value;
              div.appendChild(btn);
              root.appendChild(div);
              if(pro.click){
                eventjs.add(btn,"click",pro.click);
              }
            }else if(pro.type === 'buttons'){
              var div=geomap.element.create("div",{},rowStyle);
              var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
              layer.innerHTML="&nbsp;";
              div.appendChild(layer);
              for(var i=0,k=pro.group.length;i<k;i++){
                var groupBtn=pro.group[i];
                var btn=geomap.element.create("input",{"type":"button","className":"btn","name":groupBtn.id});
                btn.value=groupBtn.value;
                div.appendChild(btn);
                if(groupBtn.click){
                  eventjs.add(btn,"click",groupBtn.click);
                }
              }
              root.appendChild(div);
            }
          }
        }
        if(form.buttons){
          var div=geomap.element.create("div",{},rowStyle);
          var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
          layer.innerHTML="&nbsp;";
          div.appendChild(layer);
          for(var i=0,k=form.buttons.length;i<k;i++){
            var groupBtn=form.buttons[i];
            var btn=geomap.element.create("input",{"type":"button","className":"btn","name":groupBtn.id});
            btn.value=groupBtn.value;
            div.appendChild(btn);
            if(groupBtn.click){
              eventjs.add(btn,"click",groupBtn.click);
            }
          }
          root.appendChild(div); 
        }
        this.bodyBar.appendChild(root);
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
   
    // geomap.FrameLayer = geomap.Class(geomap.CommonMethods, geomap.Observable,  {
    //   type: 'FrameLayer',
    //   paths:[],
    //   drawType:0,
    //   fill:true,
    //   loopRender:false,
    //   _enabled:true,
    //   container:null,
    //   headHeight:20,
    //   map:null,
    //   initialize: function(container,options) {
    //     options || (options = { }); 
    //     this._setOptions(options);
    //     this.container=container;
         
    //   }, 
    //   addMap:function(map){ 
    //     this.map=map;
    //   },
    //   createElement:function(tag,styles,options,content){
    //     var el=document.createElement(tag);
    //     for(var item in styles){
    //         el.style[item]=styles[item];
    //     }
    //     if(options != undefined){
    //         for(var item in options){
    //             el[item]=options[item];
    //         }
    //     }
    //     if(content!=undefined){
    //         el.innerHTML=content;
    //     }
    //     return el;
    //   },
    //   open:function(options){
    //       var winSize=this.map.getSize();
    //       var opt=extend({type:1,title:'', closeBtn:true, area:[400,200], offset:'center',body:"",borderRadius:"8px",background:"rgba(255,255,255,0.9)",headBorderBottom:"1px solid #e4e4e4",closeCallback:function(event,self){},okBtn:false,okCallback:function(event,self){}},options);
    //       var p=4,w=opt.area[0],h=opt.area[1],headHeight=this.headHeight,headWidth=w-2*p,contentHeight=h-headHeight - 2*p;
    //       var left=0,top=0,cpos= winSize.divideBy(2);
    //       if(opt.offset=== 'center'){
    //         left= cpos.x - w/2
    //         top=cpos.y-h/2; 
    //       }else if(opt.offset=== 'rb'){
    //         left= winSize.x - w;
    //         top=winSize.y-h; 
    //       }else if(opt.offset=== 'rt'){
    //         left= winSize.x - w; 
    //     }else if(opt.offset=== 'lb'){
    //         left=0;
    //         top=winSize.y-h; 
         
    //       }

    //       var styles={position:"absolute",width: w+"px",height:h+"px",border:"0px solid #989898",top:top+"px",left:left+"px",background:opt.background,borderRadius:opt.borderRadius,boxShadow:"2px 2px 4px #888888"};
    //       var rootDiv=this.createElement("div",styles,{className:"frameLayer"});
          
    //       eventjs.add(rootDiv, 'contextmenu', function(event){
    //         eventjs.stop(event);
    //         // console.log("##### form contextmenu");
    //       });
          
    //       styles={position:"absolute",width: headWidth+"px",height:headHeight+"px",top:"0px",left:"0px",borderBottom:opt.headBorderBottom,padding:p+"px"};
    //       var headBar=this.createElement("div",styles);
    //       headBar.innerHTML="<b style=\"float:left\">"+opt.title+"</b>";
    //       rootDiv.appendChild(headBar);
    //       extend(rootDiv,geomap.Observable);
    //       var closeFn=function(event,self){
    //           // if(geomap.element.hasClass(event.target,"closeIcon")){
    //           //     event.target.parentNode.parentNode.parentNode.removeChild(event.target.parentNode.parentNode);
    //           // }
    //           this.outerHTML="";
    //           var frameObj={target:rootDiv};
    //           opt.closeCallback(event,frameObj);
    //       }.bind(rootDiv);

    //       var closeBtn=this.createElement("span",{"float":"right","cursor":"pointer"},{"className":"closeIcon"},"&nbsp; X &nbsp;");
         
    //       headBar.appendChild(closeBtn);

    //       styles={position:"absolute",width: w+"px",height:contentHeight+"px",top:(h-contentHeight)+"px",left:"0px"};
        
    //       var contentDiv=this.createElement("div",styles);
    //       contentDiv.innerHTML=opt.body;
    //     if(opt.okBtn){
    //       var el_btnOK=this.createElement("input",{marginLeft:"100px"},{className:"btn",type:"button",value:"确定"});
    //       var okFn=function(event,self){ 
    //         var frameObj={target:rootDiv,closeFn:closeFn};
    //         opt.okCallback(event,frameObj);
    //        };
    //       eventjs.add(el_btnOK,"click touch",okFn);
    //       contentDiv.appendChild(el_btnOK);
    //     }

    //     rootDiv.appendChild(contentDiv);
    //     this.container.appendChild(rootDiv);

        
    //     eventjs.add(closeBtn,"click touch",closeFn);
    //     rootDiv.on("close",closeFn);
    //      return rootDiv;
    //   }
 
      
    // });
  
  })();
  