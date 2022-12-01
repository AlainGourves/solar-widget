# Solar Widget

## Usage

### HTML

```html
<div class="solar-parent"></div>
```

### CSS/SCSS

// feuille de style à intégrer

### Javascript

```js
import SolarWidget from "./solar-widget.js";

const params = {
    lat: 48.1124,
    lon: -1.6798,
    apiKey: import.meta.env.VITE_API_KEY
}

let widget;

async function main() {
    widget = new SolarWidget(parent, params);
    widget.clipping = true; // widget is clipped in a "squircle"
    widget.refreshDelay = 60000; // redraw every minute
    await widget.init()
    temp.innerHTML = widget.temperature; // tempeature & relative humidity infos are accessible
    hum.innerHTML = widget.humidity;
}

window.addEventListener('load', ev => {
    main();
});
```