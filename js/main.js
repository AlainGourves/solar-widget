import SolarWidget from "./solar-widget.js";


const canvas = document.querySelector("canvas");
const params = {
    lat: -48.1124,
    lon: -1.6798
}

window.addEventListener('load', ev => {
    const widget = new SolarWidget(canvas, params);
});