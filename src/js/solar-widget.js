import Gradient from "./gradient.js";
import Starfield from "./starfield.js";
import Sun from "./sun.js";

class SolarWidget {
    constructor(parent, { lat, lon, apiKey }) {
        this.template = document.createElement('template');
        this.template.innerHTML = `
<div class="solar-widget__wrap">
    <div class="solar-widget__loading">Loading...</div>
    <canvas  class="solar-widget__canvas">Solar Potion Widget</canvas>
</div>
`;
        parent.classList.add('solar-widget__wrap');
        parent.appendChild(this.template.content.cloneNode(true));
        const parentBounding = parent.getBoundingClientRect()

        this.loading = parent.querySelector('.solar-widget__loading');
        this.canvas = parent.querySelector('canvas.solar-widget__canvas');

        this.lat = lat;
        this.lon = lon;
        this.apiKey = apiKey;
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = parentBounding.width;
        this.canvas.height = parentBounding.height;

        this.url = '';
        this.fetchInterval = 60 * 5 * 1000; // time in seconds between requests to openWeatherMap API

        this.skyColors = new Gradient();
        this.starfield = new Starfield(this.canvas.width, this.canvas.height);
        this.sun;

        this._refreshDelay = null;
        this.timeoutID;

        this._temperature;
        this._humidity;

        this._clipping = false;
    }

    async init() {
        try {
            await this.getWeather()
                .then(data => {
                    this.sun = new Sun(this.canvas.width, this.canvas.height);
                    this.sun.sunriseTime = data.sunrise;
                    this.sun.sunsetTime = data.sunset;
                    this.sun.init();
                    this.sun.theTime = data.dt;

                    this._temperature = `${Number.parseFloat(data.temp).toFixed(1)}°C`;
                    this._humidity = `${data.humidity}%`;
                    this.draw();
                    this.loading.style.display = 'none';
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

    set clipping(bool) {
        this._clipping = bool;
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const pos = this.sun.theSin;
        const threshold = this.sun.theThreshold;
        let clr;
        if (pos - threshold >= 0) {
            clr = (pos - threshold) / (1 - threshold);
        } else {
            clr = (pos - threshold) / (1 + threshold);
        }

        // Clipping path
        if (this._clipping) {
            this.ctx.save();
            this.ctx.fillStyle = 'red';
            // this.ctx.beginPath();
            const path = new Path2D(this.squircle());
            // this.ctx.fill(path);
            this.ctx.clip(path);
        }
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(400, 300, 300, 300);
        const bg = this.skyColors.colorAt((1 + clr) * 50);
        this.ctx.fillStyle = bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if ((pos - threshold) < 0) {
            // true only at night time => draw a starfield
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
        this.ctx.restore();
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
                // console.log(d)
            }
            this.timeoutID = setTimeout(this.refresh.bind(this), this._refreshDelay);
        }
    }

    squircle = function () {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const dir = w === Math.max(w, h) ? "w" : "h";
        const rad = Math.min(w, h) / 2; // "corner radius"

        let path = `M0,${rad}C0,0 0,0 ${rad},0`;
        if (dir === "w" && w !== h) path += `H${w - rad}`;
        path += `C${w},0 ${w},0 ${w},${rad}`;
        if (dir === "h" && w !== h) path += `V${h - rad}`;
        path += `C${w},${h} ${w},${h} ${w - rad},${h}`;
        if (dir === "w" && w !== h) path += `H${rad}`;
        path += `C0,${h} 0,${h} 0,${h - rad}`;
        if (dir === "h" && w !== h) path += `V${rad}`;
        path += "Z";
        return path;
    };

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