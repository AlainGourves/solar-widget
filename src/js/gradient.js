const colorsMap = new Map([
    [0,     'hsl(233deg 22% 7%)'],
    [0.28,  'hsl(224deg 30% 12%)'],
    [0.36,  'hsl(218deg 41% 17%)'],
    [0.42,  'hsl(213deg 54% 21%)'],
    [0.46,  'hsl(210deg 59% 26%)'],
    [0.49,  'hsl(212deg 47% 34%)'],
    [0.52,  'hsl(213deg 40% 42%)'],
    [0.56,  'hsl(213deg 35% 50%)'],
    [0.6,   'hsl(210deg 42% 58%)'],
    [0.65,  'hsl(205deg 48% 67%)'],
    [0.74,  'hsl(201deg 57% 76%)'],
    [1,     'hsl(197deg 77% 86%)']
]);
class Gradient {
    constructor() {
        this.canvasWidth = 5;
        this.canvasHeight = 100;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true, alpha: false });

        this.gradient = this.ctx.createLinearGradient(0, 0, 0, 100);
        colorsMap.forEach((color, stop) => {
            this.gradient.addColorStop(stop, color);
        });
        this.ctx.fillStyle = this.gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    // Get the color of pixels at height y of the gradient
    // And return the `rgb(red, green, blue) string
    colorAt(y) {
        const pixelData = this.ctx.getImageData(3, y, 1, 1);
        return `rgb(${pixelData.data[0]}, ${pixelData.data[1]}, ${pixelData.data[2]})`;
    }

    // Getter
    // Returns the image of the gradient
    get image() {
        return this.canvas;
    }

    // returns an array of 100 colors from the gradient
    get colors() {
        let result = [];
        for (let i = 0; i < 100; i++) {
            result[i] = this.colorAt(i);
        }
        return result;
    }

    // returns the gradient in CSS form
    get CSSLinearGradient() {
        let values = '';
        colorsMap.forEach((color, stop) => {
            values += `${color} ${Math.round(stop * 100)}%, `;
        });
        return `linear-gradient(-90deg, ${values.slice(0, -2)})`;
    }
}

export default Gradient;