import '../scss/style.scss'
import SolarWidget from "./solar-widget.js";

document.querySelector('#app').innerHTML = `
    <h1>Right Here, Right Now</h1>
    <ul class="data">
        <li>Température: <span></span></li>
        <li>Humidité relative: <span></span></li>
    </ul>
    <div id="loading">Loading...</div>
    <canvas width="640" height="360"></canvas>
`;

const canvas = document.querySelector("canvas");
const params = {
    lat: 48.1124,
    lon: -1.6798,
    apiKey: import.meta.env.VITE_API_KEY
}

const loading = document.querySelector('#loading');
const temp = document.querySelector('.data li:first-of-type span');
const hum = document.querySelector('.data li:last-of-type span');

async function main() {
    // Promises handling cf. https://stackoverflow.com/questions/72544385/handling-of-async-data-in-js-class
    const widget = new SolarWidget(canvas, params);
    await widget.init()
    loading.style.display = 'none';
    temp.innerHTML = widget.temperature;
    hum.innerHTML = widget.humidity;
    widget.refreshDelay = 60000; // redraw every minute
    widget.refresh()
}

window.addEventListener('load', ev => {
    main();
});