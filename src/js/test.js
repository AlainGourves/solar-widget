import '../scss/style.scss'
import '../scss/test.scss'
import SolarWidget from "./solar-widget.js";


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
        <div>
            <label for="time-slider">
                <input type="range" id="time-slider" min="0" max="86399">
                <output></output>
                <span></span>
            </label>
        </div>
        <div>
            <button>Now</button>
        </div>
    </div>
`;

const parent = document.querySelector('.solar-parent');
const temp = document.querySelector('.data li:first-of-type span');
const hum = document.querySelector('.data li:last-of-type span');


const cursor = document.querySelector("#time-slider");
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
    document.documentElement.style.setProperty('--time-slider__output', `${seconds / 864}`)
}

async function main() {
    widget = new SolarWidget(parent, params);
    widget.clipping = true;
    await widget.init()
    temp.innerHTML = widget.temperature;
    hum.innerHTML = widget.humidity;
    const d = new Date();
    updateTime(d);
    d.setHours(0, 0, 0, 0);
    let cursorValue = widget.dt - (d.getTime() / 1000);
    cursor.value = cursorValue;
    document.documentElement.style.setProperty('--time-slider__output', `${cursorValue / 864}`);
    document.querySelector('.controls').style.opacity = 1;
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