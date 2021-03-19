(function() {
  geomap.util.event = {

    _ev_xy_now:[0,0],
    _ev_xy_last:[0,0],
    _ev_smooth:[[0,0]],
    _ev_speed:[0,0],
    _ev_inertance:-1,
    speedStart:function(x,y){
        this._ev_inertance=1;
        this._ev_speed=[0,0];
        this._ev_xy_last=[x,y];
        var p0=[0,0];
        this._ev_smooth=[p0,p0,p0,p0];
    },
    
    speedEnd: function() {
        this._ev_inertance=-1; 
    },
    moving:function(x,y){
        this._ev_xy_now=[x,y];
    },
    speeding:function(){
        if(this._ev_inertance==1){
            var mspeed=geomap.util.matrixSubtract(this._ev_xy_now,this._ev_xy_last);
            this._ev_smooth.push(mspeed);
            this._ev_smooth.shift();
            var totalSpeed=[0,0];
            
            var s=this._ev_smooth;
            var k=s.length;
            for(var i=0;i<k;i++){
                totalSpeed=geomap.util.matrixAdd(totalSpeed,s[i]);
            }
            totalSpeed[0]=totalSpeed[0]/k;
            totalSpeed[1]=totalSpeed[1]/k;
            this._ev_speed=[Math.round(totalSpeed[0]),Math.round(totalSpeed[1])];
            this._ev_xy_last=this._ev_xy_now;
        }else{
            var s=this._ev_speed;
            if(Math.abs(s[0])<0){
                s[0]=0;
            }
            if(Math.abs(s[1])<0){
                s[1]=0;
            }
            this._ev_speed[0]=s[0]*0.97;
            this._ev_speed[1]=s[1]*0.97;
        }

        return this._ev_speed;
    }
    
  }
})();