class Gradient {
    constructor() {
        this.canvasWidth = 5;
        this.canvasHeight = 100;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this.gradient = this.ctx.createLinearGradient(0, 0, 0, 100);
        this.gradient.addColorStop(0, "hsl(233deg 22% 7%)");
        this.gradient.addColorStop(0.28, "hsl(224deg 30% 12%)");
        this.gradient.addColorStop(0.36, "hsl(218deg 41% 17%)");
        this.gradient.addColorStop(0.42, "hsl(213deg 54% 21%)");
        this.gradient.addColorStop(0.46, "hsl(210deg 59% 26%)");
        this.gradient.addColorStop(0.49, "hsl(212deg 47% 34%)");
        this.gradient.addColorStop(0.52, "hsl(213deg 40% 42%)");
        this.gradient.addColorStop(0.56, "hsl(213deg 35% 50%)");
        this.gradient.addColorStop(0.6, "hsl(210deg 42% 58%)");
        this.gradient.addColorStop(0.65, "hsl(205deg 48% 67%)");
        this.gradient.addColorStop(0.74, "hsl(201deg 57% 76%)");
        this.gradient.addColorStop(1, "hsl(197deg 77% 86%)");
        this.ctx.fillStyle = this.gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    // Get the color of pixels at height y of the gradient
    // And return the `rgb(red, green, blue) string
    colorAt(y) {
        const pixelData = this.ctx.getImageData(3,y,1,1);
        return `rgb(${pixelData.data[0]}, ${pixelData.data[1]}, ${pixelData.data[2]})`;
    }

    // Getter
    // Returns the image of the gradient
    get image() {
        return this.canvas;
    }
}

export default Gradient;