class Starfield {

    constructor(w, h) {
        this.canvasWidth = Math.ceil(Math.sqrt(w * w + h * h));
        this.canvasHeight = this.canvasWidth;
        this.nbStars = 3000;
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
        let tmpStars = [];
        for (let i = 0; i < this.nbStars; i++) {
            tmpStars.push(this.addStar());
        }
        this.stars = tmpStars.filter(star => star.r > 0.2);
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

        const x = this.canvasWidth / 2;
        const y = this.canvasHeight / 2;

        tmpCtx.save()
        tmpCtx.translate(x, y);
        tmpCtx.rotate(this._angle);
        tmpCtx.translate(-x, -y);
        tmpCtx.drawImage(this.canvas, 0, 0, this.canvasWidth, this.canvasHeight);
        tmpCtx.restore();

        const imageData = tmpCtx.getImageData((this.canvasWidth - this.resultWidth) / 2, ((this.canvasHeight - this.resultHeight) / 2) + 20, this.resultWidth, this.resultHeight);

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
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.globalAlpha = Math.random();
            this.ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        // Pole Star
        this.ctx.globalAlpha = 0.95;
        this.ctx.beginPath();
        this.ctx.arc(this.canvasWidth/2, this.canvasHeight/2, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

export default Starfield;