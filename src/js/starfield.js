class Starfield {

    constructor(w, h) {
        // canvas is a square bif enough to allow the rotation of a w*h rectangle around its center
        // this.canvas's purpose is to create the base image, generated once (here),
        // which is used later to produce the returned images (allowing the starry sky to "rotate")

        this.canvasWidth = Math.ceil(Math.sqrt(w*w + h*h));
        this.canvasHeight = this.canvasWidth;
        // dimensions of the returned image
        this.resultWidth = w;
        this.resultHeight = h;

        this.canvas = document.createElement('canvas', { 'willReadFrequently': true });
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        // Stars
        this.nbStars = Math.floor((this.canvasWidth * this.canvasWidth) /200); // # of stars is linked to the dimensions of the canvas
        // Generate the stars
        let tmpStars = [];
        for (let i = 0; i < this.nbStars; i++) {
            tmpStars.push(this.addStar());
        }
        this.stars = tmpStars.filter(star => star.r > 0.3); // filters out the smallest stars

        this.TWOPI = Math.PI * 2;
        this._angle = 0; // angle of rotation of the sky around the canvas' center
        this.angleStep = this.TWOPI / (3600 * 24);

        this.drawStars();
        this.stars = []; // not needed anymore
    }

    // Setters / Getters

    set angle(theta) {
        this._angle = theta * this.angleStep;
    }

    // returns the used image
    get image() {
        // Temporary canvas for the rotation
        const tmpCanvas = document.createElement('canvas');
        const tmpCtx = tmpCanvas.getContext('2d');
        tmpCanvas.width = this.canvasWidth;
        tmpCanvas.height = this.canvasHeight;

        const center = {
            x: this.canvasWidth / 2,
            y: this.canvasHeight / 2
        };

        tmpCtx.save()
        tmpCtx.translate(center.x, center.y);
        tmpCtx.rotate(this._angle * -1);
        tmpCtx.translate(-center.x, -center.y);
        tmpCtx.drawImage(this.canvas, 0, 0, this.canvasWidth, this.canvasHeight);
        tmpCtx.restore();

        const imageData = tmpCtx.getImageData((this.canvasWidth - this.resultWidth) / 2, ((this.canvasHeight - this.resultHeight) / 2), this.resultWidth, this.resultHeight);

        // Canvas to final dimensions
        tmpCanvas.width = this.resultWidth;
        tmpCanvas.height = this.resultHeight;
        tmpCtx.clearRect(0, 0, this.resultWidth, this.resultHeight);
        tmpCtx.putImageData(imageData, 0, 0);

        return tmpCanvas;
    }

    addStar = function () {
        const x = Math.floor(Math.random() * this.canvasWidth);
        const y = Math.floor(Math.random() * this.canvasHeight);
        const r = Math.random() * 1.25;
        return { x, y, r };
    }

    drawStars = function () {
        this.stars.forEach(star => {
            let r = Math.random()
            // Get a random hue in the ranges [10,50] (red-orange) or [200, 280] (blue-purple) depending of the value of r
            let h = (r > 0.5) ? 10 + (Math.random() * 40) : 200 + (Math.random() * 80);
            let c = `hsl(${Math.floor(h)}, 100%, ${Math.floor(80 + Math.random() * 20)}%)`;
            this.ctx.fillStyle = c;
            this.ctx.beginPath();
            this.ctx.globalAlpha = 0.25 + Math.random()/2;
            this.ctx.arc(star.x, star.y, star.r, 0, this.TWOPI);
            this.ctx.fill();
        });
        // Pole Star (at the center)
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.shadowBlur = 4;
        this.ctx.globalAlpha = 0.95;
        this.ctx.beginPath();
        this.ctx.arc(this.canvasWidth / 2, this.canvasHeight / 2, 1.5, 0, this.TWOPI);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        // Blur effect
        const radii = [4,2,1]; // blur radii
        const tmpCanvas = document.createElement('canvas');
        const tmpCtx = tmpCanvas.getContext('2d');
        tmpCanvas.width = this.canvasWidth;
        tmpCanvas.height = this.canvasHeight;
        radii.forEach(r => {
            tmpCtx.filter = `blur(${r}px)`;
            tmpCtx.drawImage(this.canvas, 0,0);
        });
        this.ctx.drawImage(tmpCanvas, 0,0); // copy tmpCanvas to this.canvas
        tmpCanvas.remove();
    }
}

export default Starfield;