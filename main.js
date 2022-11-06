const canvas = document.querySelector('canvas');
const ctx = canvas.getContext("2d");
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const sineWidth = Math.ceil(canvasWidth / 2);
const sineAmplitude = canvasHeight / 3; // "height" of the sine
const step = Math.PI / sineWidth; // radians/pixels
const sunRadius = 16;
const sunBlur = 6;

const origin = {
    x: (canvasWidth - sineWidth) / 2,
    y: canvasHeight / 2
}

const temp = document.querySelector('.data li:first-of-type span');
const hum = document.querySelector('.data li:last-of-type span');

const url = 'https://api.openweathermap.org/data/2.5/onecall?lat=48.1124&lon=-1.6798&units=metric&exclude=alerts,daily,hourly,minutely&appid=19457e93f41f03d6b764271a2e6507f1';

let skyGradientCtx;

const getWeather = async function () {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data.current)
    const temperature = data.current.temp;
    const humidity = data.current.humidity;

    temp.innerHTML = `${Number.parseFloat(temperature).toFixed(1)}°C`;
    hum.innerHTML = `${humidity}%`;

    return data.current;
}

const calcSineY = function (x) {
    return sineAmplitude * Math.sin(x);
}

const calcSunPosition = function (currentWeather) {
    // computes sun's x position : x/sineWidth = (dt - sunrise)/(sunset - sunrise)
    const elapsedTime = currentWeather.dt - currentWeather.sunrise;
    return (elapsedTime * sineWidth) / (currentWeather.sunset - currentWeather.sunrise);
}

const drawSineWave = function () {
    ctx.translate(origin.x, origin.y);
    ctx.beginPath();
    ctx.strokeStyle = '#ffffffaa';
    ctx.lineWidth = 3;
    for (let i = 0; i <= sineWidth; i++) {
        const theta = i * step;
        const y = calcSineY(theta);
        ctx.lineTo(i, y * -1);
    }
    ctx.stroke();
    // Reset current transformation matrix to the identity matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const drawTime = function (t, x, y) {
    // Reset current transformation matrix to the identity matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(origin.x, origin.y);
    const d = new Date(t * 1000); // les timestamps d'openweathermap sont en secondes
    const myTime = `${d.getHours()}:${(d.getMinutes()).toString()
        .padStart(2, "0")}`;
    ctx.font = '12px system-ui';
    ctx.fillStyle = 'deeppink';
    const delta = ctx.measureText(myTime).width / 2;
    ctx.fillText(myTime, x - delta, y + 16);
}

const drawSemiCircle = function (x, y) {
    // Reset current transformation matrix to the identity matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(origin.x, origin.y);
    ctx.fillStyle = '#ffffff66';
    ctx.beginPath();
    ctx.arc(x, y, sunRadius, 0, Math.PI, true);
    ctx.fill();
}

const drawSun = function (sunX, sunY) {
    if (sunY <= sunRadius) {
        // else the sun is off screen
        // Reset current transformation matrix to the identity matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(origin.x, origin.y);
        // Create a clipping path
        ctx.save();
        ctx.beginPath()
        ctx.rect(sunRadius * -2, 0, sineWidth + sunRadius * 4, canvasHeight / -2);
        ctx.clip();
        ctx.fillStyle = '#f9c50b';
        ctx.shadowColor = '#f9c50b';
        ctx.shadowBlur = sunBlur;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
const createSkyGradient = function () {
    // Create a <canvas> element to store the gradient for the sky colors
    // This canvas is not attached to the DOM, it stays in memory
    const gradCanvas = document.createElement('canvas')
    const ctx = gradCanvas.getContext("2d", { willReadFrequently: true });
    const gradient = ctx.createLinearGradient(0, 0, 0, 100);
    gradient.addColorStop(0, 'hsl(233deg 22% 7%)');
    gradient.addColorStop(0.28, 'hsl(224deg 30% 12%)');
    gradient.addColorStop(0.36, 'hsl(218deg 41% 17%)');
    gradient.addColorStop(0.42, 'hsl(213deg 54% 21%)');
    gradient.addColorStop(0.46, 'hsl(210deg 59% 26%)');
    gradient.addColorStop(0.49, 'hsl(212deg 47% 34%)');
    gradient.addColorStop(0.52, 'hsl(213deg 40% 42%)');
    gradient.addColorStop(0.56, 'hsl(213deg 35% 50%)');
    gradient.addColorStop(0.60, 'hsl(210deg 42% 58%)');
    gradient.addColorStop(0.65, 'hsl(205deg 48% 67%)');
    gradient.addColorStop(0.74, 'hsl(201deg 57% 76%)');
    gradient.addColorStop(1, 'hsl(197deg 77% 86%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 10, 100);
    // returns the context
    return ctx;
}

const getSkyColor = function (y) {
    const pixelData = skyGradientCtx.getImageData(5, y, 1, 1);
    return `rgb(${pixelData.data[0]}, ${pixelData.data[1]}, ${pixelData.data[2]})`;
}

window.addEventListener('load', ev => {
    skyGradientCtx = createSkyGradient();

    getWeather()
        .then(currentWeather => {

            // get actual sun position relative to sineWidth
            const sunX = calcSunPosition(currentWeather);
            const sunY = calcSineY(sunX * step) * -1;

            // get sky color from the gradient: depends on the height of the sun in the sky
            // sin(x) is in [-1,1]
            // (1 + sin) is in [0,2]
            // *50 to be in [0,100] (the height of the gradient)
            const bg = getSkyColor((1 + Math.sin(sunX * step)) * 50);
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, 640, 360);

            drawSineWave();
            // sunrise
            drawSemiCircle(0, 0);
            // sunset
            drawSemiCircle(sineWidth, 0);

            // masks the bottom of the sine
            ctx.translate(origin.x - 10, origin.y - 2);
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, sineWidth + 20, 4);

            drawSun(sunX, sunY);
            drawTime(currentWeather.sunrise, 0, 0);
            drawTime(currentWeather.sunset, sineWidth, 0);

            // horizontal line
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(origin.x - 2 * sunRadius, origin.y);
            ctx.strokeStyle = '#ffffffaa';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineWidth = 2;
            ctx.lineTo(sineWidth + 4 * sunRadius, 0);
            ctx.stroke();
        })
});