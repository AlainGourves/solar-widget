import Gradient from "./gradient.js";
import Starfield from "./starfield.js";
import Sun from "./sun.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const cursor = document.querySelector("#cursor");
const label = document.querySelector("output");
const btn = document.querySelector(".controls button");

let skyColors,
    starfield,
    sun,
    sunPathImage,
    sunImage;

let data;
let dt;

const temp = document.querySelector('.data li:first-of-type span');
const hum = document.querySelector('.data li:last-of-type span');

const lat = 48.1124;
const lon = -1.6798;
const apiKey = '19457e93f41f03d6b764271a2e6507f1';
const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=alerts,daily,hourly,minutely&appid=${apiKey}`;

const getWeather = async function () {
    const savedWeather = localStorage.getItem('currentWeather');
    if (savedWeather) {
        const t = Date.now();
        const savedTime = parseInt(localStorage.getItem('currentTime'));
        if ((t - savedTime) / 1000 < 60 * 5) {
            // Saved data is less than 5 minutes old
            return JSON.parse(savedWeather);
        }
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data.current)

    localStorage.setItem('currentWeather', JSON.stringify(data.current));
    localStorage.setItem('currentTime', Date.now());
    return data.current;
}

const draw = function () {
    // Reset current transformation matrix to the identity matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const pos = sun.theSin;
    const threshold = sun.theThreshold;
    let clr;
    if (pos - threshold >= 0) {
        clr = (pos - threshold) / (1 - threshold);
    } else {
        clr = (pos - threshold) / (2 * (1 - threshold));
    }
    const bg = skyColors.colorAt((1 + clr) * 50);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    if ((pos - threshold) < 0) {
        // night => starfield
        // transparency  goes from 0% to 100% as (pos - threshold) goes from 0 to -0.15
        if ((pos - threshold) >= -0.15) {
            ctx.globalAlpha = Math.abs((pos - threshold)) / 0.15;
        } else {
            ctx.globalAlpha = 1;
        }
        ctx.drawImage(starfield.image, 0, 0);
        ctx.globalAlpha = 1;
    }
    ctx.drawImage(sunPathImage, 0, 0);

    sunImage = sun.theSun;
    ctx.drawImage(sunImage, 0, 0);
}

const updateTime = function (d) {
    // d: Date obj
    label.textContent = `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const update = function (d) {
    updateTime(d);
    const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    starfield.angle = seconds;
    cursor.value = seconds;
    sun.theTime = d.getTime() / 1000; // timestamp in seconds
    draw();
}

window.addEventListener('load', ev => {
    getWeather()
        .then(data => {
            const temperature = data.temp;
            const humidity = data.humidity;
            temp.innerHTML = `${Number.parseFloat(temperature).toFixed(1)}°C`;
            hum.innerHTML = `${humidity}%`;

            skyColors = new Gradient();
            starfield = new Starfield(canvasWidth, canvasHeight);
            sun = new Sun(canvasWidth, canvasHeight);
            sun.sunriseTime = data.sunrise;
            sun.sunsetTime = data.sunset;
            sun.theTime = data.dt;
            sunPathImage = sun.thePath;
            update(new Date(data.dt * 1000));
        });

    cursor.addEventListener("input", ev => {
        const val = parseInt(ev.target.value);
        const d = new Date();
        d.setHours(0, 0, val, 0);
        update(d);
    });

    btn.addEventListener("click", (ev) => {
        update(new Date());
    });
});