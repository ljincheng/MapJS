(function() { 
    var Point =geomap.Point;

    geomap.Marker=geomap.Class(geomap.CommonMethods, geomap.Observable,geomap.Geometry, {
        type:"Marker",
        canvas:null,
        ctx:null,
        point:null,
        width:400,
        height:200,
        ratio:3,
        radius:10,
        lineV:20,
        padding:10,
        textRows:[],
        style:{fillStyle:"rgba(0, 0, 0, 0.9)"},
        fontStyle:{font : "bold 14px serif",fillStyle:"white"},
       initialize: function(map, options) {
        this._map=map;
        options || (options = { });
        if(options.style){
            options.style=geomap.util.object.extend(this.style,options.style);
        } 
        this._setOptions(options); 
        this._type=0;
        var canvas=geomap.util.element.create("canvas");
        var ctx=canvas.getContext("2d");
        geomap.util.element.createHiDPICanvas(canvas,this.width,this.height,this.ratio);
        this.canvas=canvas;
        this.ctx=ctx;
        this.point=new Point(100,100);
         
      },
      setData:function (data){
        // var gtype=data.type;
        var geometry=data.geometry;
        var properties=data.properties;
        // var gcoords=geometry && geometry.coordinates,
        // this._type=0;
        // this._coordinates=[];
        // if(gcoords.length>0){
        //     var gcoord=gcoords[0];
        //     if(gcoord.length>0){
        //         for(var i=0,k=gcoord.length;i<k;i++){
        //             this._coordinates.push(new Point(gcoord[i][0],gcoord[i][1]));
        //         }
        //     }
        // }
        this.textRows=[];
        if(properties != undefined ){
            var ctx=this.ctx;
            var rtsize=this.getRectTextSize();
            for(var t in properties){
                this.drawText(ctx,t+":"+properties[t],rtsize[0]);
            }
        }
        this.draw();
        this._map.fire("drawmap");
        },
        draw:function(){
            var ctx=this.ctx,width=this.width,height=this.height;
            ctx.clearRect(0,0,width,height);
            this.roundedRect(ctx,0,0,width,height,this.radius);
            // 字体样式设置
            var fontStyles=this.fontStyle;
            for (var prop in fontStyles) { 
                ctx[prop]=fontStyles[prop];
            }
            var rowNum=this.textRows.length,
                y=this.padding+this.lineV,
                x=this.padding;
            for(var b=0;b<rowNum;b++){
                ctx.fillText(this.textRows[b],x,y);//每行字体y坐标间隔20
                y+=this.lineV;
            }
        },
        getRectTextSize:function(){
            var w=this.width- (this.padding * 2),h=this.height- (this.padding * 2);
            return [w,h];
        },
        drawText:function(ctx,t,w){
            //参数说明
            //ctx：canvas的 2d 对象，t：绘制的文字，x,y:文字坐标，w：文字最大宽度
            var chr = t.split("");
            var temp = "";
            for (var a = 0; a<chr.length;a++){
                if( ctx.measureText(temp).width < w && ctx.measureText(temp+(chr[a])).width <= w){
                    temp += chr[a];
                }else{
                    this.textRows.push(temp);
                    temp = chr[a];
                }
            }
            this.textRows.push(temp);
        },
        render:function(ctx){
            var w=this.width,
              h=this.height;
            ctx.drawImage(this.canvas,this.point.x,this.point.y,w,h);
        },
        roundedRect:function(ctx, x, y, width, height, radius){
        this.setStyle(ctx);
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.lineTo(x, y + height - radius);
        ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
        ctx.lineTo(x + width - radius, y + height);
        ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
        ctx.lineTo(x + width, y + radius);
        ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
        ctx.lineTo(x + radius, y);
        ctx.quadraticCurveTo(x, y, x, y + radius);
        ctx.fill();

        }
    });
  })();
  