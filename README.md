# Solar Widget

## Installation

### HTML

```html
<div class="solar-widget__wrap">
    <div class="solar-widget__loading">Loading...</div>
    <canvas  class="solar-widget__canvas"width="640" height="360"></canvas>
</div>
```

### CSS/SCSS

```scss
.solar-widget__wrap{
    width: 640px;
    height: 360px;
    display: grid;
    place-content: center;

    &>*{
        grid-area: 1/1;
    }
}

.solar-widget__loading{
    z-index: 1;
    display: grid;
    place-content: center;
    font-size: 2rem;
    color: rebeccapurple;
}
```

### Javascript

```js
import SolarWidget from "./solar-widget.js";

async function main() {
    const params = {
        lat: 48.1124,
        lon: -1.6798,
        apiKey: OPENWEATHERMAP_API_KEY
    }
    const widget = new SolarWidget(canvas, params);
    await widget.init()
    loading.style.display = 'none'; // or remove from DOM
    temp.innerHTML = widget.temperature;
    hum.innerHTML = widget.humidity;
    widget.refreshDelay = 60000; // redraw every minute
    widget.refresh()
}

window.addEventListener('load', ev => {
    main();
});
```