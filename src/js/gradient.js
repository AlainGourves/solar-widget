const colors = [
    'hsl(233deg 22% 7%)',
    'hsl(224deg 30% 12%)',
    'hsl(218deg 41% 17%)',
    'hsl(213deg 54% 21%)',
    'hsl(210deg 59% 26%)',
    'hsl(212deg 47% 34%)',
    'hsl(213deg 40% 42%)',
    'hsl(213deg 35% 50%)',
    'hsl(210deg 42% 58%)',
    'hsl(205deg 48% 67%)',
    'hsl(201deg 57% 76%)',
    'hsl(197deg 77% 86%)'
];
const stops = [
    0,
    0.28,
    0.36,
    0.42,
    0.46,
    0.49,
    0.52,
    0.56,
    0.6,
    0.65,
    0.74,
    1
];
class Gradient {
    constructor() {
        this.canvasWidth = 5;
        this.canvasHeight = 100;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true, alpha: false });

        this.gradient = this.ctx.createLinearGradient(0, 0, 0, 100);
        colors.forEach((col, idx) => {
            this.gradient.addColorStop(stops[idx], col);
        })
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
        const val = colors.reduce((accumulator, col, idx) => {
            return `${accumulator}, ${col} ${Math.round(stops[idx]*100)}%`;
        });
        return `linear-gradient(-90deg, ${val})`;
    }
}

export default Gradient;