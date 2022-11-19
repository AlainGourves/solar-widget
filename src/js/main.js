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
<div class="solar-widget__wrap">
<div class="solar-widget__loading">Loading...</div>
<canvas  class="solar-widget__canvas"width="${widgetWidth}" height="${widgetHeight}"></canvas>
</div>
<button id="bob">Download PNG</button>
`;

const canvas = document.querySelector("canvas");
const loading = document.querySelector('.solar-widget__loading');
const temp = document.querySelector('.data li:first-of-type span');
const hum = document.querySelector('.data li:last-of-type span');

const btn = document.querySelector('button');
let widget;

const squircle = (el) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!h || !w) return;
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
    return { w, h, path };
};

async function main() {
    // Promises handling cf. https://stackoverflow.com/questions/72544385/handling-of-async-data-in-js-class
    widget = new SolarWidget(canvas, params);
    await widget.init()
    loading.style.display = 'none';
    temp.innerHTML = widget.temperature;
    hum.innerHTML = widget.humidity;
    widget.refreshDelay = 60000; // redraw every minute
    widget.refresh();
}

window.addEventListener('load', ev => {
    const path = squircle(canvas);
    canvas.style.clipPath = `path("${path.path}")`;

    main();

    btn.addEventListener('click', ev => {
        console.log('clic!')
        widget.downloadStarfield()
    })
});