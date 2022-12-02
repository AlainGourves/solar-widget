import Gradient from "./gradient.js";
import Starfield from "./starfield.js";
import Sun from "./sun.js";

class SolarWidget {
    constructor(parent, { lat, lon, apiKey }) {
        this.template = document.createElement('template');
        this.template.innerHTML = `
<div class="solar-widget__loading">Loading...</div>
<canvas  class="solar-widget__canvas">Solar Potion Widget</canvas>
`;

        this.parent = parent;
        this.parent.classList.add('solar-widget__wrap');
        this.parent.appendChild(this.template.content.cloneNode(true));
        const parentBounding = this.parent.getBoundingClientRect();

        this.loading = this.parent.querySelector('.solar-widget__loading');
        this.canvas = this.parent.querySelector('canvas.solar-widget__canvas');

        this.lat = lat;
        this.lon = lon;
        this.apiKey = apiKey;
        this.ctx = this.canvas.getContext('2d');
        // optimization for "retina" screens
        // cf. https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
        const dpr = window.devicePixelRatio;
        this.ctx.scale(dpr, dpr);
        this.canvas.width = Math.round(parentBounding.width * dpr);
        this.canvas.height = Math.round(parentBounding.height * dpr);


        this.url = '';
        this.fetchInterval = 60 * 5 * 1000; // time in seconds between requests to openWeatherMap API

        this.skyColors = new Gradient();
        this.sun;
        this.starfield;

        this._refreshDelay = null;
        this.timeoutID;

        this._temperature;
        this._humidity;

        this._clipping = false;

        // Resize observer
        // reinitialize the widget when the width changes
        this.observerCallback = (entries) => {
            for (const entry of entries) {
                if (entry.borderBoxSize) {
                    // obj with inlineSize & blockSize in px
                    const box = entry.borderBoxSize[0]
                    const newW = parseFloat(box.inlineSize);
                    const newH = parseFloat(box.blockSize);
                    if (newW !== this.canvas.width) {
                        this.canvas.width = newW;
                        this.canvas.height = newH;
                        this.init()
                    }
                }
            }
        }
        // debounce with a 350ms delay
        this.observer = new ResizeObserver(this.debounce(this.observerCallback, 250));
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
                    this.starfield = new Starfield(this.canvas.width, this.canvas.height); // must be here to generate a new starfield when the canvas' size changes

                    this._temperature = (data.temp) ? `${Number.parseFloat(data.temp).toFixed(1)}°C` : '';
                    this._humidity = (data.humidity) ? `${data.humidity}%` : '';
                    this.draw();
                    if (this.loading.classList.contains('error')) this.loading.classList.remove('error');
                    this.loading.style.display = 'none';
                    if (this._refreshDelay && !this.timeoutID) this.refresh();

                    // Mutation observer
                    this.observer.observe(this.parent, this.observerOptions);
                });
        } catch (e) {
            this.loading.style.display = 'grid';
            this.loading.innerHTML = `<div>
            <h2>Things happen...</h2>
            <p>${e.message}</p>
            <p>Try to <a href="#" onclick="widget.init(); return false;">reload the widget</a></p>
            </div>`;
            this.loading.classList.add('error');
            console.error(e);
        }
    }

    get temperature() {
        if (this._temperature) {
            return this._temperature;
        }
        return '';
    }

    get humidity() {
        if (this._humidity) {
            return this._humidity;
        }
        return '';
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

    // Returns
    checkLocalStorage = function () {
        const result = {
            'isData': false,
            'isFresh': false,
            'isUsable': false
        };
        const savedWeather = localStorage.getItem('currentWeather');
        if (savedWeather) {
            if (JSON.parse(savedWeather)) {
                result.isData = true;
            }
            const savedTime = parseInt(localStorage.getItem('currentTime'));
            // Are the data "fresh" enough ?
            // -> fetched less than this.fetchInterval ago
            if ((Date.now() - savedTime) < this.fetchInterval) {
                result.isFresh = true;
            }
            // Are the data at least usable ?
            // -> fetched the same day (sunrise & sunset time are valid)
            if ((Date.now() - savedTime) < 1000 * 60 * 60 * 24) {
                result.isUsable = true;
            } else {
                // Data is outdated : clear localStorage
                localStorage.clear();
            }
        }
        return result;
    }

    getWeather = async function () {
        const checks = this.checkLocalStorage();
        if (checks.isData && checks.isFresh) {
            // Saved data is less than 5 minutes old
            return JSON.parse(localStorage.getItem('currentWeather'));
        }

        if (this.lon && this.lat && this.apiKey) {
            this.url = `https://api.openweathermap.org/data/2.5/onecall?lat=${this.lat}&lon=${this.lon}&units=metric&exclude=alerts,daily,hourly,minutely&appid=${this.apiKey}`;
        } else {
            throw new Error('Wrong parameters to request OpenWeatherMap API !');
        }

        if (!checks.isData && !this.url) {
            throw new Error('Nothing to display !');
        }

        let response;
        let data;
        try {
            response = await fetch(this.url);
        } catch (err) {
            if (checks.isData && checks.isUsable) {
                // Data is outdated but still usable (sunrise & sunset time are ok, but not dt, temp & humidity)
                data = JSON.parse(localStorage.getItem('currentWeather'));
                data.dt = Math.round(Date.now() / 1000);
                data.temp = undefined;
                data.humidity = undefined;
                return data;
            } else {
                throw new Error(`Network error! ${err.message}`);
            }
        }
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        data = await response.json(); // data is a JS object
        //  console.log(data.current)

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
            const path = new Path2D(this.squircle());
            this.ctx.clip(path);
        }
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
                clearTimeout(this.timeoutID);
                const d = new Date();
                // Check if data stored in localStorage is still fresh
                const savedTime = parseInt(localStorage.getItem('currentTime'));
                if (savedTime && (d.getTime() - savedTime >= this.fetchInterval)) {
                    // fetch fresh data from openWeatherMap
                    this.init();
                    this.timeoutID = setTimeout(this.refresh.bind(this), this._refreshDelay);
                    return;
                }
                this.time = d; // redraw according to the new time
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

    debounce = (func, delay) => {
        let timer;
        return function () {     //anonymous function
            const context = this;
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(context, args)
            }, delay);
        }
    };
}

export default SolarWidget;