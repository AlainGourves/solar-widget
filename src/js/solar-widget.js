import Gradient from "./gradient.js";
import Starfield from "./starfield.js";
import Sun from "./sun.js";

class SolarWidget {
    constructor(canvas, { lat, lon, apiKey }) {
        this.canvas = canvas;
        this.lat = lat;
        this.lon = lon;
        this.apiKey = apiKey;
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;

        this.url = '';
        this.fetchInterval = 60 * 5 * 1000; // time in seconds between requests to openWeatherMap API

        this.skyColors = new Gradient();
        this.starfield = new Starfield(this.canvasWidth, this.canvasHeight);
        this.sun;

        this._refreshDelay = null;
        this.timeoutID;

        this._temperature;
        this._humidity;
    }

    async init() {
        try {
            await this.getWeather()
                .then(data => {
                    this.sun = new Sun(this.canvasWidth, this.canvasHeight);
                    this.sun.sunriseTime = data.sunrise;
                    this.sun.sunsetTime = data.sunset;
                    this.sun.init();
                    this.sun.theTime = data.dt;

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
            if (this.timeoutID) clearTimeout(this.timeoutID);
            this._refreshDelay = t;
        }
    }

    set time(d) {
        // d: date obj
        this.sun.theTime = Math.floor(d.getTime() / 1000); // timestamp in seconds
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
            if ((t - savedTime) < this.fetchInterval) {
                // Saved data is less than 5 minutes old
                return JSON.parse(savedWeather);
            }
        }

        if (this.lon && this.lat && this.apiKey) {
            this.url = `https://api.openweathermap.org/data/2.5/onecall?lat=${this.lat}&lon=${this.lon}&units=metric&exclude=alerts,daily,hourly,minutely&appid=${this.apiKey}`;
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
        this.ctx.drawImage(this.sun.thePath, 0, 0);

        this.sunImage = this.sun.theSun;
        this.ctx.drawImage(this.sunImage, 0, 0);
    }

    refresh = function () {
        if (this._refreshDelay) {
            // call draw() if & only if this.timeoutID is already defined
            // to avoid calling draw() twice at the beginning
            if (this.timeoutID) {
                const d = new Date();
                // Check if data stored in localStorage is still fresh
                const savedTime = parseInt(localStorage.getItem('currentTime'));
                if (savedTime && (d.getTime() - savedTime >= this.fetchInterval)) {
                    // fetch fresh data from openWeatherMap
                    this.init();
                    this.timeoutID = setTimeout(this.refresh.bind(this), this._refreshDelay);
                    return;
                }
                this.time = d; // redraw this the new time
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

    downloadSun = function () {
        let res = this.sun.downloadImage()
        let anc = document.createElement('a')
        anc.download = 'download'
        anc.href = res;
        document.body.appendChild(anc)
        anc.click()
        anc.remove()
    }

    downloadSunPath = function () {
        let res = this.sun.downloadPathImage()
        let anc = document.createElement('a')
        anc.download = 'download'
        anc.href = res;
        document.body.appendChild(anc)
        anc.click()
        anc.remove()
    }
}

export default SolarWidget;