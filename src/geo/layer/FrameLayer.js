
(function(global) {
    'use strict';
    var extend = geomap.util.object.extend;
    var Point =geomap.Point;
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.Palette) {
      geomap.warn('geomap.Map is already defined.');
      return;
    }

    geomap.closeFrame=function(ev){
        if(geomap.util.element.hasClass(ev.target,"closeIcon")){
            ev.target.parentNode.parentNode.parentNode.removeChild(ev.target.parentNode.parentNode);
        }
    }

   
    geomap.FrameLayer = geomap.Class(geomap.CommonMethods, geomap.Observable,  {
      type: 'FrameLayer',
      paths:[],
      drawType:0,
      fill:true,
      loopRender:false,
      _enabled:true,
      container:null,
      headHeight:20,
      map:null,
      initialize: function(container,options) {
        options || (options = { }); 
        this._setOptions(options);
        this.container=container;
         
      }, 
      addMap:function(map){ 
        this.map=map;
      },
      createElement:function(tag,styles,options,content){
        var el=document.createElement(tag);
        for(var item in styles){
            el.style[item]=styles[item];
        }
        if(options != undefined){
            for(var item in options){
                el[item]=options[item];
            }
        }
        if(content!=undefined){
            el.innerHTML=content;
        }
        return el;
      },
      open:function(options){
          var winSize=this.map.getSize();
          var opt=extend({type:1,title:'', closeBtn:true, area:[400,200], offset:'center',body:"",borderRadius:"8px",background:"rgba(255,255,255,0.9)",headBorderBottom:"1px solid #e4e4e4",onComplete:function(event){}},options);
          var p=4,w=opt.area[0],h=opt.area[1],headHeight=this.headHeight,headWidth=w-2*p,contentHeight=h-headHeight - 2*p;
          var left=0,top=0,cpos= winSize.divideBy(2);
          if(opt.offset=== 'center'){
            left= cpos.x - w/2
            top=cpos.y-h/2; 
          }else if(opt.offset=== 'rb'){
            left= winSize.x - w;
            top=winSize.y-h; 
          }else if(opt.offset=== 'rt'){
            left= winSize.x - w; 
        }else if(opt.offset=== 'lb'){
            left=0;
            top=winSize.y-h; 
         
          }

          var styles={position:"absolute",width: w+"px",height:h+"px",border:"0px solid #989898",top:top+"px",left:left+"px",background:opt.background,borderRadius:opt.borderRadius,boxShadow:"2px 2px 4px #888888"};
          var rootDiv=this.createElement("div",styles,{className:"frameLayer"});
          
          eventjs.add(rootDiv, 'contextmenu', function(event){
            eventjs.stop(event);
            console.log("##### form contextmenu");
          });
          
          styles={position:"absolute",width: headWidth+"px",height:headHeight+"px",top:"0px",left:"0px",borderBottom:opt.headBorderBottom,padding:p+"px"};
          var headBar=this.createElement("div",styles);
          headBar.innerHTML="<b style=\"float:left\">"+opt.title+"</b>";
          rootDiv.appendChild(headBar);

          var closeBtn=this.createElement("span",{float:"right",cursor:"pointer"},{className:"closeIcon"},"&nbsp; X &nbsp;")
         
          headBar.appendChild(closeBtn);

          styles={position:"absolute",width: w+"px",height:contentHeight+"px",top:(h-contentHeight)+"px",left:"0px"};
          var contentDiv=this.createElement("div",styles);
        contentDiv.innerHTML=opt.body;
        rootDiv.appendChild(contentDiv);
        this.container.appendChild(rootDiv);

        extend(rootDiv,geomap.Observable);
        var closeFn=function(event,self){
            // if(geomap.util.element.hasClass(event.target,"closeIcon")){
            //     event.target.parentNode.parentNode.parentNode.removeChild(event.target.parentNode.parentNode);
            // }
            this.outerHTML="";
            opt.onComplete(event);
        }.bind(rootDiv);
        eventjs.add(closeBtn,"click touch",closeFn);
        rootDiv.on("close",closeFn);
         return rootDiv;
      }
 
      
    });
  
  })(typeof exports !== 'undefined' ? exports : this);
  