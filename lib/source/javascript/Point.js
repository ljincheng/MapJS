
MapGIS.extend({

    Point: new Class({
     	 Implements: [Events, Options],
         x: 0,
         y: 0,
    	 initialize: function (arg1, arg2) {
    	 	var t=$type(arg1);
            if (t=== "number") {
                this.x = arg1;
                this.y = arg2;
            } else if (t=== "array") {
                this.x = arg1[0];
                this.y = arg1[1];
            }
            else if (t === "object") {
                this.x = arg1.x;
                this.y = arg1.y;
            }else if(t=="string"){
            	this.x=arg1.toFloat(arg1);
            	this.y=arg2.toFloat(arg2);
            } else {
                this.x =parseFloat( arg1);
                this.y =parseFloat( arg2);
            }
        },
        getArray:function()
        {
        	return [this.x,this.y];
        }
    })
});