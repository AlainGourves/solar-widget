import '../scss/style.scss'
import '../scss/test.scss'
import SolarWidget from "./solar-widget.js";

const widgetWidth = 640 * 1;
const widgetHeight = 360 * 1;
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

const parent = document.querySelector('.solar-parent');
const temp = document.querySelector('.data li:first-of-type span');
const hum = document.querySelector('.data li:last-of-type span');


const cursor = document.querySelector("#cursor");
const label = document.querySelector("output");
const btnNow = document.querySelector(".controls button");

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
    widget = new SolarWidget(parent, params);
    // widget.clipping = false;
    await widget.init()
    temp.innerHTML = widget.temperature;
    hum.innerHTML = widget.humidity;
    const d = new Date();
    updateTime(d);
    d.setHours(0, 0, 0, 0);
    let cursorValue = widget.dt - (d.getTime() / 1000);
    cursor.value = cursorValue;
}

window.addEventListener('load', ev => {
    main();

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