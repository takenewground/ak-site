
function NOOP() {}

import ScrollObserver from './observer.js';
import {spring_system_create} from "../spring/index.js"

export const SCROLL_DIR_X = 1;
export const SCROLL_DIR_Y = 2;
export const SCROLL_DIR_XY = SCROLL_DIR_X | SCROLL_DIR_Y;

const DIM_LENGTH = 5
const DIM_ARRAY_T =  Float32Array // Int16Array
const EMPTY_DIM = new DIM_ARRAY_T(DIM_LENGTH);
const DIM_VAL = 0;
const DIM_TGT = 1;
const DIM_MIN = 3;
const DIM_MAX = 4;
const DIM_DELTA = 4;
// const DIM_MICROSEC = 4;

export class ScrollJack {
    constructor(el, opts) {
        opts || (opts = {});
        this.is_scrolling = false;
        this.committing = false;
        this.needs_commit = true;
        const dir = opts.dir || (SCROLL_DIR_Y);
        this.dir = dir;
        this.onrender = opts.onrender || function(){};
        this.onrest = opts.onrest || function(){};
        this.el = el;

        const $ = this;

        if (dir & SCROLL_DIR_Y) {
            const dim = this.dim_y = new DIM_ARRAY_T(DIM_LENGTH);
            this.update_y = function(delta) {$._update_dim(dim, delta);}
            this.resize_y = function(content_size, visible_size) {$._resize_dim(dim, content_size, visible_size);}
        }
        else {
            this.dim_y = EMPTY_DIM;
            this.update_y = NOOP;
            this.resize_y = NOOP;
        }

        if (dir & SCROLL_DIR_X) {
            const dim = this.dim_x = new DIM_ARRAY_T(DIM_LENGTH);
            this.update_x = function(delta) {$._update_dim(dim, delta);}
            this.resize_x = function(content_size, visible_size) {$._resize_dim(dim, content_size, visible_size);}
        }
        else {
            this.dim_x = EMPTY_DIM;
            this.update_x = NOOP;
            this.resize_x = NOOP;
        }
        this._commit = function() {
            const x = $.dim_x[DIM_TGT];
            const y = $.dim_y[DIM_TGT];

            sys.set('x',x)
            sys.set('y',y)
            sys.update();

            // $.el.style.transform = `translate3d(${x}px,${y}px,0px)`;
            $.committing = false;
        }
        this.commit = function() {
            if (this.committing)
                return;
            this.committing = true;
            this.needs_commit = false;
            // requestAnimationFrame(this._commit)
            this._commit()
        }

        const sys = spring_system_create('world', _tick, _rest);
        this.sys = sys;
        sys.set('y',0);
        sys.set('x',0);

        // sys.spring('y', 30, 150);
        sys.spring('y', 200, 500);
        sys.spring('x', 12, 180);
        // sys.spring('z', 12, 180); // use default
        // sys.to('y',111);
        // sys.to('x',111);
        // sys.to('z',1110);
        // sys.update();
        let has_raf = false;
        function _tick() {
            $.dim_x[DIM_VAL] = sys.get('x');
            $.dim_y[DIM_VAL] = sys.get('y');
            if (has_raf)
                return
            has_raf = true;
            requestAnimationFrame(_render)
            // sys.update(); // requestAnimationFrame(sys.update)
        }

        function _render() {
            if (!$.is_scrolling) {
                $.el.classList.add('is-scrolling');
                $.is_scrolling = true
            }

            has_raf = false;
            $.onrender($)
            // console.log($.dim_y[DIM_VAL],$.dim_y[DIM_TGT])
            $.el.style.transform = `translate3d(${$.dim_x[DIM_VAL]}px,${$.dim_y[DIM_VAL]}px,0px)`;
            sys.update();
        }

        function _rest() {
            $.onrest($)
            $.el.classList.remove('is-scrolling');
            $.is_scrolling = false
            // sys.destroy();
            // console.log($.dim_y[DIM_VAL],$.dim_y[DIM_TGT])
            // console.log('rest!')
        }

        this.measure();
        const sob = new ScrollObserver(function (entries) {
            let {dx, dy} = entries[0];
            // console.log(dy)
            $.update(dx,dy)
        })
        // TODO:
        const rob = new ResizeObserver(function(entries) {
            $.measure();
        })
        sob.observe(el);
        rob.observe(el)

    }
    _update_dim(dim, delta, microsec) {
        const prev = dim[DIM_TGT];
        const min = dim[DIM_MIN];
        const max = dim[DIM_MAX];
        let curr = prev + delta;
        if (curr < min)
            curr = min
        else if (curr > max)
            curr = max
        if (curr == prev)
            return;
        dim[DIM_TGT] = curr;
        this.needs_commit = true;
    }

    // TODO: min/max padding?

    _resize_dim(dim, content_size, visible_size) {
        const prev_min = dim[DIM_MIN];
        const min = -(content_size - visible_size);
        dim[DIM_MIN] = min;
        if (prev_min) {
            const prev = dim[DIM_TGT];
            let curr = (prev / prev_min) * min;
            dim[DIM_TGT] = curr
        }


        // TODO: update dim val to kill jank
        this.needs_commit = true;
    }

    update(dx,dy) {
        this.update_x(dx)
        this.update_y(dy)
        this.commit_if_needed();
    }
    measure() {
        const rect = this.el.getBoundingClientRect();
        this.resize_x(rect.width, window.innerWidth)
        this.resize_y(rect.height,window.innerHeight)
        this.commit_if_needed();
    }
    commit_if_needed() {
        if (this.needs_commit) this.commit()
    }

}

export class ScrollRig {
    constructor() {
        if (history.scrollRestoration) {
            history.scrollRestoration = 'manual';
        }

        const html = document.body.parentElement;
        html.classList.add('has-scroll-smooth')
        window.scrollTo(0, 0);
        this.jacks = new Map()
    }
    jack(key, el, opts) {
        this.jacks.set(key, new ScrollJack(el, opts) )
    }
    start() {

    }
    stop() {

    }
}