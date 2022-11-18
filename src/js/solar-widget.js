import Gradient from "./gradient.js";
import Starfield from "./starfield.js";
import Sun from "./sun.js";

class SolarWidget {
    constructor(canvas, params) {
        this.canvas = canvas;
        this.params = params;
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;

        this.url = '';

        this.skyColors = new Gradient();
        this.starfield = new Starfield(this.canvasWidth, this.canvasHeight);
        this.sun = new Sun(this.canvasWidth, this.canvasHeight);
        this.sunPathImage;

        this._refreshDelay = null;
        this.timeoutID;

        this._temperature;
        this._humidity;
    }

    async init() {
        try {
            await this.getWeather()
                .then(data => {
                    this.sun.sunriseTime = data.sunrise;
                    this.sun.sunsetTime = data.sunset;
                    this.sun.theTime = data.dt;
                    this.sunPathImage = this.sun.thePath;

                    this._temperature = `${Number.parseFloat(data.temp).toFixed(1)}°C`;
                    this._humidity = `${data.humidity}%`;
                    this.draw();
                });
        } catch (e) {
            console.error(e);
        }
    }

    get temperature() {
        if (this._temperature) {
            return this._temperature;
        }
        return false;
    }

    get humidity() {
        if (this._humidity) {
            return this._humidity;
        }
        return false;
    }

    set refreshDelay(t) {
        if (Number.isInteger(t)) {
            clearTimeout(this.timeoutID);
            this._refreshDelay = t;
        }
    }

    set time(d) {
        // d: date obj
        this.sun.theTime = d.getTime() / 1000; // timestamp in seconds
        const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        this.starfield.angle = seconds;
        this.draw();
    }

    get dt() {
        return this.sun.dt;
    }

    getWeather = async function () {
        const savedWeather = localStorage.getItem('currentWeather');
        if (savedWeather) {
            const t = Date.now();
            const savedTime = parseInt(localStorage.getItem('currentTime'));
            if ((t - savedTime) / 1000 < 60 * 5) {
                // Saved data is less than 5 minutes old
                return JSON.parse(savedWeather);
            }
        }

        if (this.params.lon && this.params.lat && this.params.apiKey) {
            this.url = `https://api.openweathermap.org/data/2.5/onecall?lat=${this.params.lat}&lon=${this.params.lon}&units=metric&exclude=alerts,daily,hourly,minutely&appid=${this.params.apiKey}`;
        } else {
            throw new Error('Wrong parameters to request OpenWeatherMap API !');
        }

        if (!savedWeather && !this.url) {
            throw new Error('Nothing to display !');
        }


        const response = await fetch(this.url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        // console.log(data.current)

        localStorage.setItem('currentWeather', JSON.stringify(data.current));
        localStorage.setItem('currentTime', Date.now());
        return data.current;
    }

    draw = function () {
        // Reset current transformation matrix to the identity matrix
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        const pos = this.sun.theSin;
        const threshold = this.sun.theThreshold;
        let clr;
        if (pos - threshold >= 0) {
            clr = (pos - threshold) / (1 - threshold);
        } else {
            clr = (pos - threshold) / (1 + threshold);
        }
        const bg = this.skyColors.colorAt((1 + clr) * 50);
        this.ctx.fillStyle = bg;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        if ((pos - threshold) < 0) {
            // night => starfield
            // transparency  goes from 0% to 100% as (pos - threshold) goes from 0 to -0.15
            if ((pos - threshold) >= -0.15) {
                this.ctx.globalAlpha = Math.abs((pos - threshold)) / 0.15;
            } else {
                this.ctx.globalAlpha = 1;
            }
            this.ctx.drawImage(this.starfield.image, 0, 0);
            this.ctx.globalAlpha = 1;
        }
        this.ctx.drawImage(this.sunPathImage, 0, 0);

        this.sunImage = this.sun.theSun;
        this.ctx.drawImage(this.sunImage, 0, 0);
    }

    refresh = function () {
        if (this._refreshDelay) {
            if (this.timeoutID) {
                this.draw();
            }
            this.timeoutID = setTimeout(this.refresh.bind(this), this._refreshDelay);
        }
    }

    downloadStarfield = function () {
        let res = this.starfield.downloadImage()
        let anc = document.createElement('a')
        anc.download = 'download'
        anc.href = res;
        document.body.appendChild(anc)
        anc.click()
        anc.remove()
    }
}

export default SolarWidget;