class Starfield {

    constructor(w, h) {
        // canvas is a square of side sqrt(2)*w to allow the rotation of a w*h rectangle
        // this.canvas's purpose is to create the base image, generated once (here),
        // which is used later to produce the returned images (allowings the starry sky to "rotate")

        this.canvasWidth = Math.ceil(Math.sqrt(2) * w);
        this.canvasHeight = this.canvasWidth;
        // dimensions of the returned image
        this.resultWidth = w;
        this.resultHeight = h;

        this.canvas = document.createElement('canvas', { 'willReadFrequently': true });
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        // à virer après
        this.sfCanvas = document.createElement('canvas');
        this.sfCtx = this.sfCanvas.getContext('2d');
        this.sfCanvas.width = this.resultWidth;
        this.sfCanvas.height = this.resultHeight;

        // Stars
        this.nbStars = 8000;
        this.starColor = '#fff';
        // Generate the stars
        let tmpStars = [];
        for (let i = 0; i < this.nbStars; i++) {
            tmpStars.push(this.addStar());
        }
        this.stars = tmpStars.filter(star => star.r > 0.5); // filters out the smallest stars

        this._angle = 0; // angle of rotation of the sky
        this.angleStep = (Math.PI * 2) / (3600 * 24);

        this.drawStars();
        this.stars = []; // not needed anymore
    }

    // Setters / Getters

    set angle(theta) {
        this._angle = theta * this.angleStep;
    }

    // returns the used image
    get image() {
        // Temporary canvas
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

        tmpCanvas.width = this.resultWidth;
        tmpCanvas.height = this.resultHeight;
        tmpCtx.clearRect(0, 0, this.resultWidth, this.resultHeight);
        tmpCtx.putImageData(imageData, 0, 0);

        // à virer après
        this.sfCtx.clearRect(0, 0, this.resultWidth, this.resultHeight);
        this.sfCtx.putImageData(imageData, 0, 0);

        return tmpCanvas;
    }

    // à virer après
    downloadImage = function () {
        return this.sfCanvas.toDataURL()
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
            let h = (r > 0.5) ? 1 + (Math.random() * 40) : 190 + (Math.random() * 90);
            let c = `hsl(${Math.floor(h)}, 100%, ${Math.floor(80 + Math.random() * 20)}%)`;
            this.ctx.fillStyle = c;
            if (star.r >= 1) {
                this.ctx.shadowColor = c;
                this.ctx.shadowBlur = 4 + (Math.random() * 6);
            }
            this.ctx.beginPath();
            this.ctx.globalAlpha = 0.25 + Math.random()/2;
            this.ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        // Pole Star (at the center)
        this.ctx.fillStyle = this.starColor;
        this.ctx.shadowColor = this.starColor;
        this.ctx.shadowBlur = 10;
        this.ctx.globalAlpha = 0.95;
        this.ctx.beginPath();
        this.ctx.arc(this.canvasWidth / 2, this.canvasHeight / 2, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

export default Starfield;