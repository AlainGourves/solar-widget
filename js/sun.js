class Sun {
    constructor(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.sineWidth = Math.floor(this.canvasWidth / 2);
        this.amplitude = this.canvasHeight / 3;

        this.x = (this.canvasWidth - this.sineWidth) / 2;
        this.y = this.canvasHeight / 2;

        this.step = Math.PI / this.sineWidth;
        this.sunRadius = 16;
        this.sunBlur = 6;
        this.sunX = 0;
        this.sunY = 0;

        this.sunrise = 0;
        this.sunriseFormatted = '';
        this.sunset = 0;
        this.sunsetFormatted = '';
        this.dt = 0;

        this.canvasPath;
        this.canvasSun;
        this.ctxPath;
        this.ctxSun;

        this.strokeStyleLight = '#ffffffaa';
        this.strokeStyleDark = '#ffffff44';
        this.fillStyleSunVisible = '#f9c50b';
        this.fillStyleSunHidden = '#ffffff44';

        this.init();
    }

    init() {
        this.canvasPath = document.createElement('canvas');
        this.ctxPath = this.canvasPath.getContext('2d');
        this.canvasPath.width = this.canvasWidth;
        this.canvasPath.height = this.canvasHeight;

        this.canvasSun = document.createElement('canvas');
        this.ctxSun = this.canvasSun.getContext('2d');
        this.canvasSun.width = this.canvasWidth;
        this.canvasSun.height = this.canvasHeight;
    }

    formatTime = function (t) {
        const d = new Date(t * 1000); // les timestamps d'openweathermap sont en secondes
        return `${d.getHours()}:${d
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
    }

    set sunriseTime(t) {
        this.sunrise = t;
        this.sunriseFormatted = this.formatTime(t);
    }

    set sunsetTime(t) {
        this.sunset = t;
        this.sunsetFormatted = this.formatTime(t);
    }

    set theTime(t) {
        this.dt = t;
        this.sunX = this.calcSunPosition();
        this.sunY = this.calcSineY((this.sunX * this.step) * -1);
    }

    get theSin() {
        return (Math.sin(this.sunX * this.step))
    }

    get thePath() {
        this.drawPath();
        return this.canvasPath;
    }

    get theSun() {
        this.drawSun();
        return this.canvasSun;
    }

    calcSineY = function (x) {
        return this.amplitude * Math.sin(x);
    }

    calcSunPosition = function () {
        // computes sun's x position : x/sineWidth = (dt - sunrise)/(sunset - sunrise)
        return ((this.dt - this.sunrise) * this.sineWidth) / (this.sunset - this.sunrise);
    };

    drawSineWave = function (x, y, w, phase, sty) {
        this.ctxPath.translate(x, y);
        this.ctxPath.beginPath();
        this.ctxPath.strokeStyle = sty;
        this.ctxPath.lineWidth = 3;
        for (let i = 0; i <= w; i++) {
            const theta = i * this.step;
            const y = this.calcSineY(phase + theta);
            this.ctxPath.lineTo(i, y * -1);
        }
        this.ctxPath.stroke();
        // Reset current transformation matrix to the identity matrix
        this.ctxPath.setTransform(1, 0, 0, 1, 0, 0);
    };

    drawSemiCircle = function (x, y) {
        // Reset current transformation matrix to the identity matrix
        this.ctxPath.setTransform(1, 0, 0, 1, 0, 0);
        this.ctxPath.translate(this.x, this.y);
        this.ctxPath.fillStyle = "#ffffff66";
        this.ctxPath.beginPath();
        this.ctxPath.arc(x, y, this.sunRadius, 0, Math.PI, true);
        this.ctxPath.fill();
    };

    drawTime = function (t, x, y) {
        // Reset current transformation matrix to the identity matrix
        this.ctxPath.setTransform(1, 0, 0, 1, 0, 0);
        this.ctxPath.translate(this.x, this.y);
        this.ctxPath.font = "12px system-ui";
        this.ctxPath.fillStyle = "deeppink";
        const delta = this.ctxPath.measureText(t).width / 2;
        this.ctxPath.fillText(t, x - delta, y + 16);
    };

    drawPath = function () {
        // clipping path to get horizontal line at the beginning & end of the sinevawe
        this.ctxPath.save()
        this.ctxPath.beginPath()
        this.ctxPath.rect(this.x - this.sunRadius, 0, this.sineWidth + 2 * this.sunRadius, this.y - 1);
        this.ctxPath.clip();

        this.drawSineWave(this.x, this.y, this.sineWidth, 0, this.strokeStyleLight);
        // sunrise
        this.drawSemiCircle(0, 0);
        // sunset
        this.drawSemiCircle(this.sineWidth, 0);
        this.ctxPath.restore();

        // Draw the negative part of the sinewave
        this.drawSineWave(0, this.y, this.sineWidth/2, Math.PI/-2,this.strokeStyleDark);
        this.drawSineWave(this.sineWidth *3/2, this.y, this.sineWidth/2, Math.PI,this.strokeStyleDark);

        // Time
        this.drawTime(this.sunriseFormatted, 0, 0);
        this.drawTime(this.sunsetFormatted, this.sineWidth, 0);

        // horizontal line
        this.ctxPath.setTransform(1, 0, 0, 1, 0, 0);
        this.ctxPath.translate(this.x - 2 * this.sunRadius, this.y);
        this.ctxPath.strokeStyle = "#ffffffaa";
        this.ctxPath.beginPath();
        this.ctxPath.moveTo(0, 0);
        this.ctxPath.lineWidth = 2;
        this.ctxPath.lineTo(this.sineWidth + 4 * this.sunRadius, 0);
        this.ctxPath.stroke();
    }

    drawSun() {
        // Reset current transformation matrix to the identity matrix
        this.ctxSun.setTransform(1, 0, 0, 1, 0, 0);
        this.ctxSun.clearRect(0, 0, this.canvasSun.width, this.canvasSun.height);
        this.ctxSun.translate(this.x, this.y);
        if (this.sunY < this.sunRadius) {
            // the sun is above the horizon
            // Create a clipping path
            this.ctxSun.save();
            this.ctxSun.beginPath();
            this.ctxSun.rect(this.sunRadius * -2, 0, this.sineWidth + this.sunRadius * 4, this.canvasHeight / -2);
            this.ctxSun.clip();
            this.ctxSun.fillStyle = this.fillStyleSunVisible;
            this.ctxSun.shadowColor = this.fillStyleSunVisible;
            this.ctxSun.shadowBlur = this.sunBlur;
            this.ctxSun.beginPath();
            this.ctxSun.arc(this.sunX, this.sunY, this.sunRadius, 0, Math.PI * 2);
            this.ctxSun.fill();
            this.ctxSun.restore();
        }
        if (this.sunY > this.sunRadius * -1) {
            // the sun is below the horizon
            // Create a clipping path
            this.ctxSun.save();
            this.ctxSun.beginPath();
            this.ctxSun.rect((this.canvasWidth - this.sineWidth)/-2, 0, this.canvasWidth, this.amplitude + this.sunRadius);
            this.ctxSun.clip();
            this.ctxSun.strokeStyle = this.fillStyleSunHidden;
            this.ctxSun.lineWidth = 2;
            this.ctxSun.shadowBlur = 0;
            this.ctxSun.beginPath();
            this.ctxSun.arc(this.sunX, this.sunY, this.sunRadius, 0, Math.PI * 2);
            this.ctxSun.stroke();
            this.ctxSun.restore();
        }
    }
}

export default Sun;