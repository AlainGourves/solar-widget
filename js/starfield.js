class Starfield {

    constructor(w, h) {
        this.canvasWidth = Math.ceil(Math.sqrt(w * w + h * h));
        this.canvasHeight = this.canvasWidth;
        this.nbStars = 2000;
        this.stars = [];
        this.ctx;

        this.resultWidth = w;
        this.resultHeight = h;
        this._angle = 0;
        this.angleStep = (Math.PI * 2) / (3600 * 24);

        this.init();
        this.drawStars();
    }

    init() {
        for (let i = 0; i < this.nbStars; i++) {
            this.stars.push(this.addStar());
        }
        this.canvas = document.createElement('canvas', { 'willReadFrequently': true });
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
    }

    set angle(theta) {
        this._angle = theta * this.angleStep;
    }

    get image() {
        const tmpCanvas = document.createElement('canvas');
        const tmpCtx = tmpCanvas.getContext('2d');
        tmpCanvas.width = this.canvasWidth;
        tmpCanvas.height = this.canvasHeight;

        const w = this.canvasWidth / 2;
        const h = this.canvasHeight / 2;

        tmpCtx.save()
        tmpCtx.translate(w, h);
        tmpCtx.rotate(this._angle);
        tmpCtx.translate(-w, -h);
        tmpCtx.drawImage(this.canvas, 0, 0, this.canvasWidth, this.canvasHeight);
        tmpCtx.restore();

        const imageData = tmpCtx.getImageData((this.canvasWidth - this.resultWidth) / 2, (this.canvasHeight - this.resultHeight) / 2, this.resultWidth, this.resultHeight);

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
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowColor = '#fff';
        this.ctx.shadowBlur = 4;
        for (let i = 0; i < this.nbStars; i++) {
            this.ctx.beginPath();
            this.ctx.globalAlpha = Math.random();
            this.ctx.arc(this.stars[i].x, this.stars[i].y, this.stars[i].r, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Pole Star
        this.ctx.globalAlpha = 0.95;
        this.ctx.beginPath();
        this.ctx.arc(this.canvasWidth/2, this.canvasHeight/2, 1.2, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

export default Starfield;