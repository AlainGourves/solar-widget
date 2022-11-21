import '../scss/style.scss'
import SolarWidget from "./solar-widget.js";

const widgetWidth = 640 * 1.125;
const widgetHeight = 360 * 1.125;
document.documentElement.style.setProperty('--sw-canvas-w', `${widgetWidth}px`);
document.documentElement.style.setProperty('--sw-canvas-h', `${widgetHeight}px`);

const params = {
    lat: 48.1124,
    lon: -1.6798,
    apiKey: import.meta.env.VITE_API_KEY
}

document.querySelector('#app').innerHTML = `
<h1>Right Here, Right Now</h1>
<ul class="data">
<li>Température: <span></span></li>
<li>Humidité relative: <span></span></li>
</ul>

<div class="solar-parent"></div>

<button id="bob">Download PNG</button>
<button id="sun">Download Sun</button>
<button id="sun-path">Download Sun Path</button>
`;

const parent = document.querySelector('.solar-parent');
const loading = document.querySelector('.solar-widget__loading');
const temp = document.querySelector('.data li:first-of-type span');
const hum = document.querySelector('.data li:last-of-type span');

const btn = document.querySelector('button#bob');
const btnSun = document.querySelector('button#sun');
const btnSunPath = document.querySelector('button#sun-path');
let widget;

async function main() {
    // Promises handling cf. https://stackoverflow.com/questions/72544385/handling-of-async-data-in-js-class
    widget = new SolarWidget(parent, params);
    widget.clipping = true;
    await widget.init()
    temp.innerHTML = widget.temperature;
    hum.innerHTML = widget.humidity;
    widget.refreshDelay = 60000; // redraw every minute
    widget.refresh();
}

window.addEventListener('load', ev => {
    main();

    btn.addEventListener('click', ev => {
        widget.downloadStarfield()
    })
    btnSun.addEventListener('click', ev => {
        widget.downloadSun()
    })
    btnSunPath.addEventListener('click', ev => {
        widget.downloadSunPath()
    })
});