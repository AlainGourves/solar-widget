class Sun {
    constructor(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.amplitude = this.canvasHeight / 3;
        this.margin = this.amplitude / 2; // free space above & beyond the curve

        this.totalSeconds = 3600 * 24; // number of seconds in a day
        this.ppr = (Math.PI * 2) / this.canvasWidth; // number of radians per pixel
        this.pps = this.canvasWidth / this.totalSeconds; // number of pixel per second
        this.spr = 2 * Math.PI / this.totalSeconds; // number of seconds per radian

        this.sunX = 0;
        this.sunY = 0;
        this.horizontalOffset = 0;
        this.verticalOffset = 0;
        this.threshold = 0;
        this.sunriseX = 0;
        this.sunsetX = 0;

        // times
        this.tStart = 0; // 0:00:00
        this.tEnd = 0; // 24:00:00
        this.sunrise = 0;
        this.sunset = 0;
        this.dt = 0;
        this.sunriseFormatted = '';
        this.sunsetFormatted = '';

        this.canvasPath = document.createElement('canvas');
        this.ctxPath = this.canvasPath.getContext('2d');
        this.canvasPath.width = this.canvasWidth;
        this.canvasPath.height = this.canvasHeight;

        this.canvasSun = document.createElement('canvas');
        this.ctxSun = this.canvasSun.getContext('2d');
        this.canvasSun.width = this.canvasWidth;
        this.canvasSun.height = this.canvasHeight;

        this.sunRadius = 16;
        this.sunBlur = 6;
        this.strokeStyleLight = '#ffffffaa';
        this.strokeStyleDark = '#ffffff44';
        this.styleSunVisible = '#f9c50b';
        this.styleSunHidden = '#ffffff44';
        this.textColor = 'deeppink';
        this.textFont = 'bold 12px system-ui';
    }

    // Getters / Setters

    set sunriseTime(t) {
        this.sunrise = t;
        this.sunriseFormatted = this.formatTime(t);
    }

    set sunsetTime(t) {
        if (t !== 0 && this.sunrise !== 0) {
            this.sunset = t;
            this.sunsetFormatted = this.formatTime(t);
            this.init();
        }
    }

    set theTime(t) {
        this.dt = t;
        this.sunX = this.calcSunX(this.dt);
        this.sunY = this.calcSunY(this.sunX);
    }

    get theSin() {
        return -1 * Math.cos(this.sunX * this.ppr - this.horizontalOffset);
    }

    get theThreshold() {
        //return -1 * Math.cos(this.sunriseX * this.ppr - this.horizontalOffset);
        return this.threshold;
    }

    get thePath() {
        return this.canvasPath;
    }

    get theSun() {
        this.drawSun();
        return this.canvasSun;
    }

    init() {
        // Compute the timestamp of today at 0:00:00 & 24:00:00
        const d = new Date(this.sunrise * 1000);
        d.setHours(0, 0, 0, 0);
        this.tStart = d.getTime() / 1000;
        this.tEnd = this.tStart + this.totalSeconds;

        // Account for the length difference between intervals [0:00:00, sunrise] & [sunset, 24:00:00]
        let delta = ((this.sunrise - this.tStart) - (this.tEnd - this.sunset)) / 2;
        this.horizontalOffset = this.secondsToRadian(delta);

        // Compute vertical offset : offset to add to the sunY formula to make f(sunrise) = 0
        this.verticalOffset = this.calcSunY(this.calcSunX(this.sunrise)) * -1;

        this.sunriseX = this.calcSunX(this.sunrise);
        this.sunsetX = this.calcSunX(this.sunset);

        // To center vertically the curve
        const noonX = this.calcSunX(this.sunrise + (this.sunset - this.sunrise)/2);
        const noonY = Math.abs(this.calcSunY(noonX));
        this.y = this.margin + noonY;

        this.threshold = -1 * Math.cos(this.sunriseX * this.ppr - this.horizontalOffset);
        this.drawPath();
    }

    secondsToRadian = function (s) {
        return s * this.spr;
    }

    pixelToRadian = function (x) {
        return x * this.ppr;
    }

    timeToPixel = function (d) {
        return d * this.pps;
    }

    calcSunX = function (t) {
        // t: timestamp to consider
        t = t - this.tStart; // number of seconds since 0:00:00
        return this.timeToPixel(t);
    }

    calcSunY = function (x) {
        // x: x position at time t
        // equation: amplitude.sin(x-PI/2) + verticalOffset
        // which is equivalent to -amplitude.cos(x) + verticalOffset
        // here amplitude is positive because the y axis goes down
        x = this.pixelToRadian(x);
        return (this.amplitude * Math.cos(x - this.horizontalOffset)) + this.verticalOffset;
    }

    drawSineWave = function (start, end, sty) {
        // start: start x position
        // end: end x position
        this.ctxPath.translate(0, this.y);
        this.ctxPath.beginPath();
        this.ctxPath.strokeStyle = sty;
        this.ctxPath.lineWidth = 3;
        for (let i = start; i <= end; i++) {
            const y = this.calcSunY(i);
            this.ctxPath.lineTo(i, y);
        }
        this.ctxPath.stroke();
        // Reset current transformation matrix to the identity matrix
        this.ctxPath.setTransform(1, 0, 0, 1, 0, 0);
    };

    drawPath = function () {
        this.drawSineWave(0, this.sunriseX, this.strokeStyleDark);
        this.drawSineWave(this.sunriseX, this.sunsetX, this.strokeStyleLight);
        this.drawSineWave(this.sunsetX, this.canvasWidth, this.strokeStyleDark);

        // sunrise
        this.drawSemiCircle(this.sunriseX, 0);
        // sunrise
        this.drawSemiCircle(this.sunsetX, 0);

        // Time
        this.drawTime(this.sunriseFormatted, this.sunriseX, 0);
        this.drawTime(this.sunsetFormatted, this.sunsetX, 0);

        // horizontal line
        this.ctxPath.strokeStyle = this.strokeStyleLight;
        this.ctxPath.beginPath();
        this.ctxPath.moveTo(this.sunriseX - (2 * this.sunRadius), 0);
        this.ctxPath.lineWidth = 2;
        this.ctxPath.lineTo(this.sunsetX + (2 * this.sunRadius), 0);
        this.ctxPath.stroke();
    }

    drawSun() {
        // Reset current transformation matrix to the identity matrix
        this.ctxSun.setTransform(1, 0, 0, 1, 0, 0);
        this.ctxSun.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.ctxSun.translate(0, this.y);

        // the sun is above the horizon
        if (this.sunY < this.sunRadius) {
            // Create a clipping path
            this.ctxSun.save();
            this.ctxSun.beginPath();
            this.ctxSun.rect(0, 0, this.canvasWidth, this.canvasHeight / -2);
            this.ctxSun.clip();
            this.ctxSun.fillStyle = this.styleSunVisible;
            this.ctxSun.shadowColor = this.styleSunVisible;
            this.ctxSun.shadowBlur = this.sunBlur;
            this.ctxSun.beginPath();
            this.ctxSun.arc(this.sunX, this.sunY, this.sunRadius, 0, Math.PI * 2);
            this.ctxSun.fill();
            this.ctxSun.restore();
        }
        if (this.sunY > -1 * this.sunRadius) {
            // Create a clipping path
            this.ctxSun.save();
            this.ctxSun.beginPath();
            this.ctxSun.rect(0, 0, this.canvasWidth, this.canvasHeight);
            this.ctxSun.clip();
            this.ctxSun.strokeStyle = this.styleSunHidden;
            this.ctxSun.lineWidth = 2;
            this.ctxSun.shadowBlur = 0;
            this.ctxSun.beginPath();
            this.ctxSun.arc(this.sunX, this.sunY, this.sunRadius, 0, Math.PI * 2);
            this.ctxSun.stroke();
            this.ctxSun.restore();
        }
    }

    drawSemiCircle = function (x, y) {
        // Reset current transformation matrix to the identity matrix
        this.ctxPath.setTransform(1, 0, 0, 1, 0, 0);
        this.ctxPath.translate(0, this.y);
        this.ctxPath.fillStyle = this.styleSunHidden;
        this.ctxPath.beginPath();
        this.ctxPath.arc(x, y, this.sunRadius, 0, Math.PI, true);
        this.ctxPath.fill();
    };

    drawTime = function (t, x, y) {
        // Reset current transformation matrix to the identity matrix
        this.ctxPath.setTransform(1, 0, 0, 1, 0, 0);
        this.ctxPath.translate(0, this.y);
        this.ctxPath.font = this.textFont;
        this.ctxPath.fillStyle = this.textColor;
        const delta = this.ctxPath.measureText(t).width / 2;
        this.ctxPath.fillText(t, x - delta, y + 16);
    };

    formatTime = function (t) {
        const d = new Date(t * 1000); // les timestamps d'openweathermap sont en secondes
        return `${d.getHours()}:${d
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
    }
}

export default Sun;