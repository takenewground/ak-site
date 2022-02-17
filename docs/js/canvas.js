



function NOOP() {}

class CanvasItem {
    constructor() {
        this.parent = null;
        this.props = new Map()
        this.items = [];
        this.ondraw = NOOP;
    }
    draw() {
        for (let item of this.items) {
            item.draw()
        }
    }
}



class CanvasView {
    constructor() {
        this.props = new Map();
        this.items = [];
        this.el = document.createElement('canvas');
        this.ctx = this.el.getContext('2d');
    }
    mount(parent) {
        parent.appendChild(this.el)
    }
    unmount() {}
    append(item) {
        this.items.push(item)
    }
    render() {
        this.clear()
        this.draw()
    }
    clear() {
        const props = this.props;
        // this.ctx.fillStyle = clear_color
        // this.ctx.fillRect(0,0,vw,vh);
        this.ctx.clearRect(0,0, vw, vh);
    }
    draw() {
        for (let item of this.items) {
            item.draw()
        }
    }
}

class CanvasMan {

}

function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.stroke();
}