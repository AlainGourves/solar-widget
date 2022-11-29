# Solar Widget

## Usage

### HTML

```html
<div class="..." id="...">
    <!-- The widget will be inserted here -->
</div>
```

### CSS/SCSS

```scss
.solar-widget__wrap{
    width: var(--sw-canvas-w);
    height: var(--sw-canvas-h);
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

const parent = document.querySelector([parent element selector]);
let widget;

async function main() {
    const params = {
        lat: 48.1124,
        lon: -1.6798,
        apiKey: OPENWEATHERMAP_API_KEY
    }
    widget = new SolarWidget(parent, params);
    widget.clipping = true;
    widget.refreshDelay = 60000; // redraw every minute
    await widget.init()
    temp.innerHTML = widget.temperature;
    hum.innerHTML = widget.humidity;
    widget.refresh();
}

window.addEventListener('load', ev => {
    main();
});
```