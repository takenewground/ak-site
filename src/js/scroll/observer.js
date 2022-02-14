
const HAS_WHEEL = ('onwheel' in document)|0;
const HAS_MOUSEWHEEL = ('onmousewheel' in document)|0;
const HAS_TOUCH = ('ontouchstart' in document)|0;
const HAS_MSTOUCH = (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 1)|0;
const HAS_MSPOINTER = (!!window.navigator.msPointerEnabled)|0;
const HAS_FIREFOX = (navigator.userAgent.includes('Firefox'))|0;
// const HAS_KEYDOWN = ('onkeydown' in document)|0;

function NOOP(){}

class ScrollObserverEntry {
    constructor(el, _unobserve) {
        this.time = 0.0;
        this.x = 0|0;
        this.y = 0|0;
        this.dx = 0|0;
        this.dy = 0|0;
        this.x_touch_start = 0|0;
        this.y_touch_start = 0|0;
        this.el = el
        this._unobserve = _unobserve;
    }
    unobserve() {
        this.el = undefined;
        this._unobserve();
        this._unobserve = NOOP;
    }
}

const DEFAULT_OPTIONS = {
    mouseMultiplier: (navigator.platform.indexOf('Win') > -1 ? 1 : .4),
    touchMultiplier:  2.5,
    firefoxMultiplier:  15,
    useTouch: true,
    passive: true,
}

export default class ScrollObserver {

    constructor(callback, options) {
        options || (options = {});
        this.targets = new WeakMap();
        this.entries = [];
        this.callback = callback;
        this.options = Object.assign({}, DEFAULT_OPTIONS, options);
        // this._listening = false;

    }
    observe(el) {
        if (!el)
            throw new Error(`ScrollObserver:observe(el):: el required!`)
        if (this.targets.has(el))
            return

        let entry = new ScrollObserverEntry(el, _unobserve);
        this.targets.set(el, entry);

        let _ontouchmove;
        let $ = this;
        let entries = this.entries
        let callback = this.callback
        let options = this.options;
        let _opts = {passive: options.passive};


        // if (options.preventTouch  //
        //     _ontouchmove = function (e) {
        //         __ontouchmove(e)
        //         e.preventDefault()
        //     }
        // else
            _ontouchmove = __ontouchmove;

        if (HAS_WHEEL)
            el.addEventListener('wheel', _onwheel, _opts);
        if (HAS_MOUSEWHEEL)
            el.addEventListener('mousewheel', _onmousewheel, _opts);
        if (HAS_TOUCH && options.useTouch) {
            el.addEventListener('touchstart', _ontouchstart, _opts);
            el.addEventListener('touchmove', _ontouchmove, _opts);
        }
        // TODO:
        // if (HAS_MSTOUCH && HAS_MSPOINTER) {
        //     this.#bodyTouchAction = document.body.style.msTouchAction
        //     document.body.style.msTouchAction = 'none'
        //     this.#el.addEventListener('MSPointerDown', this._onTouchStart, true)
        //     this.#el.addEventListener('MSPointerMove', this._onTouchMove, true)
        // }

        function _notify() {
            entry.time = performance.now();
            entries.push(entry)
            // TODO: queu?
            $.callback(entries, $)
            entries.length = 0;
        }

        function _unobserve() {
            targets.delete(el);

            if (HAS_WHEEL)
                el.removeEventListener('wheel', _onwheel)
            if (HAS_MOUSEWHEEL)
                el.removeEventListener('mousewheel', _onmousewheel)
            if (HAS_TOUCH && options.useTouch) {
                el.removeEventListener('touchstart', _ontouchstart)
                el.removeEventListener('touchmove', _ontouchmove)
            }
            // TODO:
            // if (HAS_MSTOUCH && HAS_MSPOINTER) {
            //     document.body.style.msTouchAction = this.#bodyTouchAction
            //     el.removeEventListener('MSPointerDown',_ontouchmove,true)
            //     el.removeEventListener('MSPointerMove',_ontouchmove,true)
            // }
            $ = undefined;
            entry = undefined;
            el = undefined;
        }

        function _onwheel (e) {
            // In Chrome and in Firefox (at least the new one)
            entry.dx = e.wheelDeltaX || (e.deltaX * -1)
            entry.dy = e.wheelDeltaY || (e.deltaY * -1)
            if (HAS_FIREFOX && e.deltaMode === 1) {
                // for our purpose deltamode = 1 means user is on a wheel mouse, not touch pad
                // real meaning: https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent#Delta_modes
                entry.dx *= options.firefoxMultiplier
                entry.dy *= options.firefoxMultiplier
            }
            entry.dx *= options.mouseMultiplier
            entry.dy *= options.mouseMultiplier
            _notify()
        }
        function _onmousewheel(e) {
            // In Safari, IE and in Chrome if 'wheel' isn't defined
            entry.dx = e.wheelDeltaX ? e.wheelDeltaX : 0
            entry.dy = e.wheelDeltaY ? e.wheelDeltaY : e.wheelDelta
            _notify()
        }

        function _ontouchstart(e) {
            const t = e.targetTouches ? e.targetTouches[0] : e
            entry.x_touch_start = t.pageX
            entry.y_touch_start = t.pageY
        }

        function __ontouchmove(e) {
            const t = e.targetTouches ? e.targetTouches[0] : e
            entry.dx = (t.pageX - entry.x_touch_start) * options.touchMultiplier
            entry.dy = (t.pageY - entry.y_touch_start) * options.touchMultiplier
            entry.x_touch_start = t.pageX
            entry.y_touch_start = t.pageY
            _notify()
        }
    }

    unobserve(el) {
        const targets = this.targets;
        if (!targets.has(el))
            return
        targets.get(el).unobserve();
    }
    takeRecords() {
        return targets.values();
    }
    disconnect() {
        for (let entry of targets.values())
            entry.unobserve()
        targets.clear()
    }
}

ScrollObserver.ScrollObserverEntry = ScrollObserverEntry;
ScrollObserver.DEFAULT_OPTIONS = DEFAULT_OPTIONS;