import '../scss/style.scss'
import '../scss/test.scss'
import SolarWidget from "./solar-widget.js";

const widgetWidth = 640*1;
const widgetHeight = 360*1;
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
<button id="bob">Download Starfield</button>
<div class="controls">
        <label for="cursor">
            <input type="range" id="cursor" min="0" max="86399">
            <output></output>
        </label>
        <div>
            <button>Now</button>
        </div>
    </div>
`;

const canvas = document.querySelector("canvas");
const loading = document.querySelector('.solar-widget__loading');
const temp = document.querySelector('.data li:first-of-type span');
const hum = document.querySelector('.data li:last-of-type span');


const cursor = document.querySelector("#cursor");
const label = document.querySelector("output");
const btnNow = document.querySelector(".controls button");

const btnExport = document.querySelector('button#bob');
let widget;

const updateTime = function (d) {
    // d: Date obj
    label.textContent = `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const update = function (d) {
    updateTime(d);
    widget.time = d;
    const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    cursor.value = seconds;
}

async function main() {
    // Promises handling cf. https://stackoverflow.com/questions/72544385/handling-of-async-data-in-js-class
    widget = new SolarWidget(canvas, params);
    await widget.init()
    loading.style.display = 'none';
    temp.innerHTML = widget.temperature;
    hum.innerHTML = widget.humidity;
    // widget.refreshDelay = 60000; // redraw every minute
    // widget.refresh()
    const d = new Date();
    d.setHours(0,0,0,0);
    let cursorValue = widget.dt - (d.getTime()/1000);
    cursor.value = cursorValue;
}

window.addEventListener('load', ev => {
    main();

    btnExport.addEventListener('click', ev => {
        console.log('clic!')
        widget.downloadStarfield()
    })

    btnNow.addEventListener("click", ev => {
        update(new Date());
    });

    cursor.addEventListener("input", ev => {
        const val = parseInt(ev.target.value);
        const d = new Date();
        d.setHours(0, 0, val, 0);
        update(d);
    });
});