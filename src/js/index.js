

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}


// import "./rig.js"
// import "./rig/mouse.js"
// (async function() {
//     const MAIN = rig.man.id;
//     const DRAW = rig.hash32_str("offscreen", 0);
//     await rig.actor_spawn(MAIN, DRAW, rig.CANVAS_WORKER_T, function(){});
//     // mouse
//     const MOUSE_MAIN = rig.hash32_str("mouse_main", 0);
//     const MOUSE_DRAW = rig.hash32_str("mouse_draw", 0);
//     rig.actor_spawn(MAIN, MOUSE_MAIN, 0, rig.import_fn('mouse_producer'));
//     rig.actor_spawn(DRAW, MOUSE_DRAW, 0, rig.import_fn('mouse_consumer'));
// })();


import {map_range, spring_system_create} from "./spring/index.js"
import {ScrollRig, SCROLL_DIR_Y} from "./scroll/rig.js";


const is_mobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
let is_ready = false;

if (is_mobile) {
    window.PleaseRotateOptions = {
        startOnPageLoad: true,
        forcePortrait: false,
        message: "CHANGE YOUR PERSPECTIVE",
        subMessage: [
            "Thats what you pay me for",
            "or don't, but then how is that working out for you",
            "Most people fail this test",
        ][Math.round(Math.random()*2)],
        allowClickBypass: false,
        onlyMobile: true,
        onHide: on_ready,
        // onShow: on_ready,
    };
    import("./pleaserotate.js")
}
else
    on_ready()


function on_ready() {
    if (is_ready)
        return
    is_ready = true;
    // console.log("on_ready")
// const _canihaz = new Map();
// function canihaz(key) { return _canihaz.get(key)}
// // window.canihaz = canihaz
// function canihaz_init() {
//     _canihaz.set('wheel', ('onwheel' in document)|0);
//     _canihaz.set('mousewheel', ('onmousewheel' in document)|0);
//     _canihaz.set('touch', ('ontouchstart' in document)|0);
//     _canihaz.set('keydown', ('onkeydown' in document)|0);
//     _canihaz.set('mstouch', (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 1)|0);
//     _canihaz.set('mspointer', (!!window.navigator.msPointerEnabled)|0);
//     _canihaz.set('firefox', (navigator.userAgent.includes('Firefox'))|0);
//     // hasWheelEvent: 'onwheel' in document,
//     // hasMouseWheelEvent: 'onmousewheel' in document,
//     // hasTouch: 'ontouchstart' in document,
//     // hasTouchWin: navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 1,
//     // hasPointer: !!window.navigator.msPointerEnabled,
//     // hasKeyDown: 'onkeydown' in document,
//     // isFirefox: navigator.userAgent.indexOf('Firefox') > -1,

// //     this.options.isMobile =
// //     /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
// //     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
// //     window.innerWidth < this.tablet.breakpoint;
// // this.options.isTablet =
// //     this.options.isMobile && window.innerWidth >= this.tablet.breakpoint;
// }
const keyCodes = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    TAB: 9,
    PAGEUP: 33,
    PAGEDOWN: 34,
    HOME: 36,
    END: 35
};

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}



function threshold_steps(n) {
    let thresholds = [];
    for (let i = 1.0; i <= n; i++)
        thresholds.push(i/n);
    thresholds.push(0);
    return thresholds;
}

// let inob = new IntersectionObserver(
//     function(entries) {
//         console.log("intersection...")
//         for (let entry of entries) {
//             // entry.isIntersecting
//             const el = entry.target;
//             const visible = entry.isVisible;
//             const inrect = entry.intersectionRect
//             console.log(entry)
//         }
//     },
//     {
//         root: null,
//         rootMargin: '0px',
//         threshold: threshold_steps(50)
//     }
// );
// let sections = document.querySelectorAll('main>section');
// // for (let section of sections) {
// //     inob.observe(section)
// //     break
// // }

// class Section {

// }
// class SectionRig {
//     constructor() {
//         this.sections = [];
//     }

// }

const section_style = document.createElement('style');
document.body.appendChild(section_style)

// const section_intro = document.querySelector('section.intro');



let scroll_y = 0;

const scrollrig = new ScrollRig();
scrollrig.jack('main', document.querySelector('main'), {
    dir:SCROLL_DIR_Y,
    onrender($) {
        scroll_y = $.dim_y[0];
        let styles = `
            #s1>.graphic {transform:translate3d(0,${map_range(scroll_y, 0,vh, 0,-vh/4)}px,0);}
            #s2>.graphic {transform:translate3d(0,${map_range(scroll_y, vh,vh<<1, 0,-vh/6)}px,0);}
        `;
        section_style.innerHTML = styles;
        // console.log($.dim_y[0]);
    }
})

// sections.add(document.querySelector('section.intro'),
//     function () {

//     },
//     function () {

//     }
// )

let mx = 0|0;
let my = 0|0;
const mtgt_rect = new Int32Array(4);
let mtgt_has = false;
let mtgt_is_graphic = false;
let mtgt_scroll_y = 0;
function listen_mouse() {
    const listen_opts = {passive:true};
    document.addEventListener('mousemove',function(e){
        handle_move(e.clientX,e.clientY,e.target);
    }, listen_opts);
    const HAS_TOUCH = ('ontouchstart' in document);
    if (HAS_TOUCH) {
        document.addEventListener('touchmove', function (e) {
            const t = e.targetTouches ? e.targetTouches[0] : e
            handle_move(t.clientX,t.clientY,t.target);
        }, listen_opts)
        document.addEventListener('touchstart', function (e) {
            const t = e.targetTouches ? e.targetTouches[0] : e
            handle_move(t.clientX,t.clientY,t.target);
        }, listen_opts)
    }
    function handle_move(clientX, clientY, target) {
        mx = clientX;
        my = clientY;
        const tag = target.tagName.toLowerCase();
        if (tag === 'a') {
            mtgt_is_graphic = false;
            const pad = vw >> 6;
            mtgt_has = true;
            mtgt_scroll_y = scroll_y;
            let {x,y,width,height} = target.getBoundingClientRect()
            mtgt_rect[0] = x - pad;
            mtgt_rect[1] = y - pad;
            mtgt_rect[2] = width + (pad<<1);
            mtgt_rect[3] = height+ (pad<<1);
        }
        else if (target.classList.contains('graphic-item')) {
            mtgt_is_graphic = true;
            mtgt_has = true;
            mtgt_scroll_y = scroll_y;
            let {x,y,width,height,right,bottom} = target.getBoundingClientRect()
            const pad = -(height >> 2);
            mtgt_rect[0] = map_range(mx, x,right, x, x - pad);
            mtgt_rect[1] = map_range(my, y,bottom, y, y - pad);
            mtgt_rect[2] = width + (pad);
            mtgt_rect[3] = height+ (pad);
        }
        else {
            mtgt_has = false;
            mtgt_is_graphic = false;
        }
    }
}
let vw = 0|0;
let vh = 0|0;
function listen_viewport() {
    measure_viewport();
    window.addEventListener("resize",measure_viewport,{passive:true});
    function measure_viewport() {
        vw = window.innerWidth;
        vh = window.innerHeight;
    }
}


function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.arcTo(x, y, x, y + radius, radius);
    // ctx.stroke();
}

(function(){
    let canvas;
    let canvas_w = 0;
    let canvas_h = 0;
    let ctx
    let clear_color = 'rgba(0, 0, 0, 0.4)';
    const _2PI = Math.PI * 2;
    let sys
    let tgt
    let tgt_x
    let tgt_y
    const pill = {
        w: 500,
        h: 500,
        x: 100,
        y: 100,
        vx: 5,
        vy: 1,
        radius: 500,
        stroke: 'white',
        stroke_w: 1,
        fill: 'white',//'black',
        draw: function() {
          ctx.beginPath();
          const x = this.x - (this.w>>1)
          const y = this.y - (this.h>>1)
          roundedRect(ctx, x, y, this.w, this.h, this.radius)
        //   ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
          ctx.closePath();
          if (this.fill) {
            ctx.fillStyle = this.fill;
            ctx.fill();
          }
        //   if (this.stroke) {
        //     ctx.lineWidth = this.stroke_w;
        //     ctx.strokeStyle = this.stroke;
        //     ctx.stroke()
        //   }
        }
    };
    requestAnimationFrame(init);
    function init() {

        // dat.set('pill.rad', 25);
        // dat.set('pill.fill', 'white');
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        canvas.classList.add('blend_layer','layer');
        canvas.style.zIndex = -1
        canvas.width = canvas_w = vw;
        canvas.height = canvas_h = vh;
        document.querySelector('.bg').appendChild(canvas)
        tgt = document.querySelector('.logo');
        tgt_update()
        sys = spring_system_create("bg_canvas", function () {

        }, function() {

        })
        sys.set('mx', tgt_x)
        sys.set('my', tgt_y)
        sys.set('rad', 0)
        sys.set('w', 10000)
        sys.set('h', 10000)
        sys.spring('rad',20,180)
        sys.spring('h',20,90)
        sys.spring('w',20,90)
        sys.spring('mx',20,80)
        sys.spring('my',20,80)

        draw();
    }
    function tgt_update() {
        let tgt_rect = tgt.getBoundingClientRect();
        tgt_x = tgt_rect.left + (tgt_rect.width>>1);
        tgt_y = tgt_rect.top + (tgt_rect.height>>1) - scroll_y;
    }
    function clear() {
        ctx.fillStyle = clear_color
        ctx.fillRect(0,0,vw,vh);
        // ctx.clearRect(0,0, vw, vh);
    }
    function draw() {
        if (canvas_w !== vw || canvas_h !== vh) {
            canvas.width = canvas_w = vw;
            canvas.height = canvas_h = vh;
            tgt_update()
        }
        if (mtgt_has) {
            const w = mtgt_rect[2];
            const h = mtgt_rect[3];
            sys.set('w', w)
            sys.set('h', h)
            sys.set('mx', mtgt_rect[0] + (w>>1))
            sys.set('my', mtgt_rect[1] + (h>>1) - (mtgt_scroll_y - scroll_y))
            sys.set('rad', Math.max(0, Math.min(pill.w,pill.h)>>1 ))
        }
        else if (scroll_y > -100) {
            const r = vw/12
            sys.set('w', r<<1)
            sys.set('h', r<<1)
            sys.set('rad', r)
            sys.set('mx', tgt_x)
            sys.set('my', tgt_y)
        }
        else {
            const r = Math.abs(map_range(Math.abs(pill.x + pill.y - (mx + my)), 500,0, vw/36,vw/18))
            sys.set('w', r<<1)
            sys.set('h', r<<1)
            sys.set('rad',r)
            sys.set('mx', mx)
            sys.set('my', my)
        }

        sys.update()
        clear();
        pill.x = sys.get('mx');
        pill.y = sys.get('my');
        pill.radius = Math.max(sys.get('rad'),0);
        pill.w = Math.max(sys.get('w'),0);
        pill.h = Math.max(sys.get('h'),0);

        // pill.stroke_w = vw >> 6;

        pill.draw();
        requestAnimationFrame(draw)
    }
})();


(function(){
    let canvas;
    let canvas_w = 0;
    let canvas_h = 0;
    let ctx
    // let dat = new Map();
    let clear_color = 'rgba(0, 0, 0, 0.5)';
    var ball = {
        x: 100,
        y: 100,
        vx: 5,
        vy: 1,
        radius: 500,
        stroke: 'black',
        stroke_w: 20,
        fill: '',//'black',
        draw: function() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
          ctx.closePath();
          if (this.fill) {
            ctx.fillStyle = this.fill;
            ctx.fill();
          }
          if (this.stroke) {
            ctx.lineWidth = this.stroke_w;
            ctx.strokeStyle = this.stroke;
            ctx.stroke()
          }
        }
    };
    var circle_striped = {
        x: 100,
        y: 100,
        line_gap: 10,
        vx: 5,
        vy: 1,
        radius: 500,
        stroke: 'black',
        stroke_w: 20,
        fill: '',//'black',
        draw: function() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
            if (this.fill) {
                ctx.fillStyle = this.fill;
                ctx.fill();
            }
            if (this.stroke) {
                ctx.lineWidth = this.stroke_w;
                ctx.strokeStyle = this.stroke;
                ctx.stroke()
            }
            ctx.save()
                ctx.clip()
                // ctx.closePath();
                ctx.translate(this.x + this.radius, this.y - this.radius);
                ctx.beginPath();
                const diam = this.radius<<1;
                ctx.translate(0, this.line_gap); ctx.moveTo(0,0); ctx.lineTo(diam*-4/9, 0);
                ctx.translate(0, this.line_gap); ctx.moveTo(0,0); ctx.lineTo(diam*-5/9, 0);
                ctx.translate(0, this.line_gap); ctx.moveTo(0,0); ctx.lineTo(diam*-3/9, 0);
                ctx.translate(0, this.line_gap); ctx.moveTo(0,0); ctx.lineTo(diam*-4/9, 0);
                ctx.translate(0, this.line_gap); ctx.moveTo(0,0); ctx.lineTo(diam*-3/9, 0);
                ctx.translate(0, this.line_gap); ctx.moveTo(0,0); ctx.lineTo(diam*-4/9, 0);
                ctx.translate(0, this.line_gap); ctx.moveTo(0,0); ctx.lineTo(diam*-5/9, 0);
                ctx.lineWidth = this.stroke_w;
                ctx.strokeStyle = this.stroke;
                ctx.stroke()
            ctx.restore()
            // ctx.closePath();
        }
    };
    const _2PI = Math.PI * 2;
    requestAnimationFrame(init);


    function init() {
        // dat.set('ball.rad', 25);
        // dat.set('ball.fill', 'white');
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        canvas.classList.add('blend_layer','layer');
        canvas.style.zIndex = -1
        canvas.width = canvas_w = vw;
        canvas.height = canvas_h = vh;
        document.getElementById('main-wrap').appendChild(canvas)

        draw();
    }
    function clear() {
        // ctx.fillStyle = clear_color
        // ctx.fillRect(0,0,vw,vh);
        ctx.clearRect(0,0, vw, vh);
    }
    function draw() {

        if (scroll_y < -(vh<<2)) {
            requestAnimationFrame(draw)
            return
        }

        if (canvas_w !== vw)
            canvas.width = canvas_w = vw;
        if (canvas_h !== vh)
            canvas.height = canvas_h = vh;
        clear();
        ball.radius = vw / 3;
        ball.stroke_w = vw >> 6;
        ball.x = map_range(scroll_y, 0,vh<<2,  vw * 8/9,ball.radius + ball.stroke_w);
        ball.y = vh / 9 ;
        ball.draw();
        circle_striped.line_gap = vw/100 * .7;
        circle_striped.stroke_w = 1;
        circle_striped.radius = vw*2/18;
        circle_striped.x = map_range(scroll_y, 0,-(vh<<2),
                vw*2/9, -1*(circle_striped.radius + circle_striped.stroke_w));

        circle_striped.y = vh*8/9 + circle_striped.radius + (circle_striped.line_gap<<1);
        // circle_striped.y = map_range(scroll_y, 0,-vh,
        //     vh*8/9 + circle_striped.radius,  0);

        circle_striped.draw()
        requestAnimationFrame(draw)
    }
})();

function start_tick() {
    function tick() {
        requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
}


function init() {
    listen_mouse();
    listen_viewport();
    // start_tick();
    ready();
}


function ready() {
    document.body.classList.remove('loading');
}

init();


// var two = new Two({
//     type: Two.Types.canvas,
//     fullscreen: true,
//     autostart: true
// }).appendTo(document.body);
// two.renderer.domElement.style.background = 'transparent';
// two.renderer.domElement.style.pointerEvents = "none";
// var rect = two.makeRectangle(two.width / 2, two.height / 2, 50 ,50);

// two.bind('update', function() {
//     rect.rotation += 0.1;
//     rect.position.x = mx;
//     rect.position.y = my;
// });

// Clamps a value between an upper and lower bound
const clamp = (num, min, max) => num <= min ? min : num >= max ? max : num;

// Map number x from range [a, b] to [c, d]
const map = (x, a, b, c, d) => clamp((x - a) * (d - c) / (b - a) + c, Math.min(c,d), Math.max(c,d));

// import { deepEqual } from './utils';


// Preload images
// const imagesLoaded = require('imagesloaded');
// const preloadImages = (selector = 'img') => {
//     return new Promise((resolve) => {
//         imagesLoaded(document.querySelectorAll(selector), {background: true}, resolve);
//     });
// };


// const MAX_SCROLL_DISTANCE = 400;
// const LAYER_BOUNDS = {min: 0, max: 101}; // percentage values
// const shiftEl = document.querySelector('.shift');
// let shiftDirection = 'h';
// if ( shiftEl.classList.contains('shift--vertical') ) {
//     shiftDirection = 'v';
// }
// else if ( shiftEl.classList.contains('shift--rotated') ) {
//     shiftDirection = 'r';
// }
// const layers = [...shiftEl.querySelectorAll('.shift__layer-inner')];
// const triggerEl = document.querySelector('#trigger');

// let currentScroll = 0;

// let triggerTop;
// let cache = {};
// let layersTranslation = {x: 0, y: 0};

// const calcTriggerTop = () => triggerEl.getBoundingClientRect()['top']+currentScroll;

// import LocomotiveScroll from 'locomotive-scroll';

// Preload images then remove loader (loading class) from body
// preloadImages('.projects__img, .footer__img, .intro__gallery-item').then(() => {
//     document.body.classList.remove('loading');

    // const lscroll = new LocomotiveScroll({
    //     el: document.querySelector('[data-scroll-container]'),
    //     smooth: true,
    //     smartphone: {smooth: true},
    //     tablet: {smooth: true}
    // });

    // Locomotive Scroll event
    // lscroll.on('scroll', obj => {
    //     currentScroll = obj.scroll.y;
    //     layersTranslation.x = shiftDirection !== 'v' ? 0 : map(((currentScroll+winsize.height)-triggerTop), 0, MAX_SCROLL_DISTANCE, -1*LAYER_BOUNDS.max, LAYER_BOUNDS.min);
    //     layersTranslation.y = shiftDirection === 'v' ? 0 : map(((currentScroll+winsize.height)-triggerTop), 0, MAX_SCROLL_DISTANCE, shiftDirection === 'h' ? LAYER_BOUNDS.max : -1*LAYER_BOUNDS.max, LAYER_BOUNDS.min);

    //     // only update for different values
    //     if ( cache.layersTranslation && deepEqual(layersTranslation, cache.layersTranslation) ) {
    //         layers.forEach(layer => layer.style.transform = `translate3d(${layersTranslation.x}%, ${layersTranslation.y}%, 0)`);
    //     }
    //     // cache the last translation
    //     cache.layersTranslation = layersTranslation;
    // });

// });


}

