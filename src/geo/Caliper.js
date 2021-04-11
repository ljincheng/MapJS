(function() {

    var Point =geomap.Point;
    var Bounds =geomap.Bounds;
    var toPoint=geomap.util.toPoint;
    geomap.Caliper={
        capliperPos:[5,5],// 屏幕坐标位置
        capliperHeight:150,
        capliperWidth:3,
        caliperDraw:function(ctx){
            var maxZ=this.maxZoom;
            var minZ=this.minZoom;
            var z=this.zoom,num=maxZ-minZ+1;
            var x=this.capliperPos[0],y=this.capliperPos[1],height=this.capliperHeight, offset=Math.ceil(height/num),len=this.capliperWidth;
            height=offset*(num-1);

            var  nextNum=z-minZ,endy=y+nextNum*offset;
            ctx.fillStyle = "#009688";
            ctx.strokeStyle="#009688";
            this.drawTriangle(ctx,x,endy,len,x,y,offset,len,nextNum);

            // ctx.strokeStyle="black"; 
            // ctx.beginPath();
            // ctx.moveTo(x, endy);
            // ctx.lineTo(x,endy+(num-nextY-1)*offset);
            // for(var i=nextY+1;i<num;i++){
            //     var sy=i*offset;
            //     var sx=(i%2) * len+len;
            //     ctx.moveTo(x, y+sy);
            //     ctx.lineTo(x+sx,y+sy);
            // }
            // ctx.stroke();

            if((nextNum+1) == num){
                ctx.strokeStyle="#009688"; 
            }else{
                var color1=(endy-y+1)/height;
                color1=color1>1?1:color1;
                var lingrad = ctx.createLinearGradient(x,y,x,y+height);
                lingrad.addColorStop(0, '#009688');
                lingrad.addColorStop(color1, '#009688');
                lingrad.addColorStop(color1, '#000000');
                lingrad.addColorStop(1, '#000000');
                ctx.strokeStyle=lingrad; 
            }
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x,y+height);
            for(var i=0;i<num;i++){
                var sy=i*offset;
                var sx=(i%2) * len+len;
                ctx.moveTo(x, y+sy);
                ctx.lineTo(x+sx,y+sy);
            }
            ctx.stroke();
           
        },
         drawTriangle:function(ctx,endX,endY,r,sx,sy,offset,len,num) {
              ctx.fillStyle = "#009688";
              ctx.strokeStyle="#009688";
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx, endY);
              for(var i=0;i<num;i++){
                  var sy2=i*offset;
                  var sx2=(i%2) * len+len;
                  ctx.moveTo(sx, sy+sy2);
                  ctx.lineTo(sx+sx2,sy+sy2);
              }
              var sx3=num%2 * len+len;
              ctx.moveTo(endX, endY);
              ctx.lineTo(endX+sx3,endY);
              ctx.stroke();
              ctx.moveTo(endX, endX);
              ctx.arc(endX, endY, r, 0, Math.PI * 2, true); 
              ctx.fill();
              
            
        }

    }; 
     
  })();
  