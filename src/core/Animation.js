(function() {

    // var startAnim=function(arg){
    //     var duration = arg.duration || 1000;
    //     var action=arg.action;

    // };

    geomap.PosAnimation=geomap.Class(geomap.CommonMethods, geomap.Observable,{
 
	run: function (fn, pos, duration, easeLinearity) {
		this.stop();
		this._fn = fn;
		this._inProgress = true;
		this._duration = duration || 0.25;
		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

		this._startPos = pos[0];
		this._offset = pos[1].subtract(this._startPos);
		this._startTime = +new Date();
		this.fire('start');
		this._animate();
	},

	// @method stop()
	// Stops the animation (if currently running).
	stop: function () {
		if (!this._inProgress) { return; }

		this._step(true);
		this._complete();
	},

	_animate: function () {
		this._animId = geomap.util.requestAnimFrame(this._animate, this);
		this._step();
	},

	_step: function (round) {
		var elapsed = (+new Date()) - this._startTime,
		    duration = this._duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration), round);
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (progress, round) {
		var pos = this._startPos.add(this._offset.multiplyBy(progress));
		if (round) {
			pos._round();
		}
        this._fn(pos);   
		this.fire('step');
	},

	_complete: function () {
		geomap.util.cancelAnimFrame(this._animId);

		this._inProgress = false; 
		this.fire('end');
	},

	_easeOut: function (t) {
		return 1 - Math.pow(1 - t, this._easeOutPower);
	}
    });

})();