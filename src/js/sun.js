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

        // The Time
        // save time as timestamp in seconds (not milliseconds !!!)
        // or as formatted strings
        this.tStart = 0; // 0:00:00
        this.tEnd = 0; // 24:00:00
        this.sunrise = 0;
        this.sunset = 0;
        this.dt = 0;
        this.sunriseFormatted = '';
        this.sunsetFormatted = '';

        // Canvas to draw the background of the graph (sinewave, horizon, semi-circles, etc.)
        this.canvasPath = document.createElement('canvas');
        this.ctxPath = this.canvasPath.getContext('2d');
        this.canvasPath.width = this.canvasWidth;
        this.canvasPath.height = this.canvasHeight;

        // Canvas to draw only the sun at his position
        this.canvasSun = document.createElement('canvas');
        this.ctxSun = this.canvasSun.getContext('2d');
        this.canvasSun.width = this.canvasWidth;
        this.canvasSun.height = this.canvasHeight;


        // Customization
        const dpr = 1; //window.devicePixelRatio; // 1 for "normal", 2 for "retina"
        this.sunPathStokeWidth = 4;
        this.sunRadius = 16;// * dpr;
        this.sunBlur = 6 * dpr;
        this.strokeStyleLight = '#ffffffbb';
        this.strokeStyleDark = '#ffffff55';
        this.styleSunVisible = '#f9c50b';
        this.styleSunHidden = this.strokeStyleLight;
        this.textColor = 'deeppink';
        this.textFont = `bold clamp(${11*dpr}px, ${this.canvasHeight / (16 * 30 * dpr)}rem, ${2*dpr}rem) system-ui`;
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
        const noonX = this.calcSunX(this.sunrise + (this.sunset - this.sunrise) / 2);
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

    drawSineWave = function (start, end, sty, pos) {
        // start: start x position
        // end: end x position
        // sty: stroke style
        // pos: position of the clipping mask 'up'|'down'
        this.ctxPath.translate(0, this.y);
        // Clipping mask (to have "flat" line caps)
        this.ctxPath.save()
        this.ctxPath.beginPath();
        let factor = (pos === 'up') ? -1 : 1;
        this.ctxPath.rect(0, 0, this.canvasWidth, this.canvasHeight * factor);
        this.ctxPath.clip();
        this.ctxPath.beginPath();
        this.ctxPath.strokeStyle = sty;
        this.ctxPath.lineWidth = this.sunPathStokeWidth;
        this.ctxPath.lineCap = 'square';
        for (let i = start - 1; i <= end; i++) {
            const y = this.calcSunY(i);
            this.ctxPath.lineTo(i, y);
        }
        this.ctxPath.stroke();
        this.ctxPath.restore();
        // Reset current transformation matrix to the identity matrix
        this.ctxPath.setTransform(1, 0, 0, 1, 0, 0);
    };

    drawPath = function () {
        this.ctxPath.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.drawSineWave(0, this.sunriseX, this.strokeStyleDark, 'down');
        this.drawSineWave(this.sunriseX, this.sunsetX, this.strokeStyleLight, 'up');
        this.drawSineWave(this.sunsetX, this.canvasWidth, this.strokeStyleDark, 'down');

        // sun @ sunrise
        this.drawSemiCircle(this.sunriseX, 0);
        // sun @ sunrise
        this.drawSemiCircle(this.sunsetX, 0);

        // Time
        this.drawTime(this.sunriseFormatted, this.sunriseX, 0);
        this.drawTime(this.sunsetFormatted, this.sunsetX, 0);

        // "Horizon"

        // Gradient
        const gradient = this.ctxPath.createLinearGradient(this.sunriseX - (4 * this.sunRadius), 0, this.sunsetX + (4 * this.sunRadius), 0);
        gradient.addColorStop(0, '#ffffff00');
        gradient.addColorStop(0.05, this.strokeStyleLight);
        gradient.addColorStop(0.95, this.strokeStyleLight);
        gradient.addColorStop(1, '#ffffff00');
        this.ctxPath.strokeStyle = gradient;
        this.ctxPath.beginPath();
        this.ctxPath.moveTo(this.sunriseX - (4 * this.sunRadius), 0);
        this.ctxPath.lineWidth = 2;
        this.ctxPath.lineTo(this.sunsetX + (4 * this.sunRadius), 0);
        this.ctxPath.stroke();
        // Reset current transformation matrix to the identity matrix
        this.ctxSun.setTransform(1, 0, 0, 1, 0, 0);
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
            this.ctxSun.rect(0, 0, this.canvasWidth, -this.canvasHeight);
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
        this.ctxPath.save();
        this.ctxPath.font = this.textFont;
        const metrics = this.ctxPath.measureText(t);
        const m = this.sunRadius / 2; // margin
        const dx = (m + this.sunRadius);
        let factor=0;
        // normally, sunrise time is placed on the left of the curve, and sunset time on the right
        // unless the text overflows the canvas
        // -> role of the `factor`variable
        if (x < this.canvasWidth / 2) {
            // sunrise time
            factor = ((x - dx - metrics.width) > 0) ? -1 : 1;
        }else{
            //sunset time
            factor = ((x + dx + metrics.width) < this.canvasWidth) ? 1 : -1;
        }
        x = x + dx * factor;
        if (factor < 0) x -= metrics.width;
        y = y - 2 * m;
        // rounded rect
        this.ctxPath.fillStyle = this.strokeStyleDark;
        this.ctxPath.beginPath();
        if (this.ctxPath.roundRect) {
            this.ctxPath.roundRect(x - m, y + m, metrics.width + 2 * m, -1 * (2 * m + metrics.actualBoundingBoxAscent), m);
        }else{
            // Firefox doesn't support roundRect()
            this.ctxPath.rect(x - m, y + m, metrics.width + 2 * m, -1 * (2 * m + metrics.actualBoundingBoxAscent), m);
        }
        this.ctxPath.fill();
        this.ctxPath.fillStyle = this.textColor;
        this.ctxPath.shadowOffsetX = 1;
        this.ctxPath.shadowOffsetY = 1;
        this.ctxPath.shadowColor = 'rgba(0,0,0,.25)';
        this.ctxPath.shadowBlur = 2;
        this.ctxPath.fillText(t, x, y);
        this.ctxPath.restore();
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