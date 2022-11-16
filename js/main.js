import SolarWidget from "./solar-widget.js";


const canvas = document.querySelector("canvas");
const params = {
    lat: -48.1124,
    lon: -1.6798,
    apiKey: '19457e93f41f03d6b764271a2e6507f1'
}

window.addEventListener('load', ev => {
    const widget = new SolarWidget(canvas, params);
});