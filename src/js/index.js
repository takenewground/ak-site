
console.log("1111")
const _canihaz = new Map();

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

let inob = new IntersectionObserver(
    function(entries) {
        console.log("intersection...")
        for (let entry of entries) {
            // entry.isIntersecting
            const el = entry.target;
            const visible = entry.isVisible;
            const inrect = entry.intersectionRect
            console.log(entry)
        }
    },
    {
        root: null,
        rootMargin: '0px',
        threshold: threshold_steps(50)
    }
);
let sections = document.querySelectorAll('main>section');
// for (let section of sections) {
//     inob.observe(section)
//     break
// }

class Section {

}
class SectionRig {
    constructor() {
        this.sections = [];
    }

}

const section_style = document.createElement('style');
document.body.appendChild(section_style)

const section_intro = document.querySelector('section.intro');

import {map_range, spring_system_create} from "./spring/index.js"
import {ScrollRig, SCROLL_DIR_Y} from "./scroll/rig.js";

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
function listen_mouse() {
    document.addEventListener('mousemove',function(e){
        mx = e.clientX;
        my = e.clientY;
    },{passive:true});
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



(function(){
    let canvas;
    let ctx
    let dat = new Map();
    let clear_color = 'rgba(0, 0, 0, 0.4)';
    var ball = {
        x: 100,
        y: 100,
        vx: 5,
        vy: 1,
        radius: 500,
        stroke: '',
        stroke_w: 20,
        fill: 'white',//'black',
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

    const _2PI = Math.PI * 2;
    let sys
    let tgt_x
    let tgt_y
    requestAnimationFrame(init);
    function init() {

        // dat.set('ball.rad', 25);
        // dat.set('ball.fill', 'white');
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        canvas.classList.add('blend_layer','layer');
        canvas.style.zIndex = -1
        canvas.width = vw;
        canvas.height = vh;
        document.querySelector('.bg').appendChild(canvas)

        let tgt_rect = document.querySelector('.logo').getBoundingClientRect();
        tgt_x = tgt_rect.left + (tgt_rect.width>>1);
        tgt_y = tgt_rect.top + (tgt_rect.height>>1);

        sys = spring_system_create("bg_canvas", function () {

        }, function() {

        })
        sys.set('mx', tgt_x)
        sys.set('my', tgt_y)
        sys.spring('rad',20,180)
        sys.spring('mx',20,80)
        sys.spring('my',20,80)

        draw();
    }
    function clear() {
        ctx.fillStyle = clear_color
        ctx.fillRect(0,0,vw,vh);
        // ctx.clearRect(0,0, vw, vh);
    }
    function draw() {
        if (scroll_y > -100) {
            sys.set('mx', tgt_x)
            sys.set('my', tgt_y)
            sys.set('rad', vw/18)
        }
        else {
            sys.set('mx', mx)
            sys.set('my', my)
            sys.set('rad',Math.abs(map_range(Math.abs(ball.x + ball.y - (mx + my)), 500,0, vw/36,vw/18)))
        }

        sys.update()
        clear();
        ball.x = sys.get('mx');
        ball.y = sys.get('my');
        ball.radius = sys.get('rad');

        // ball.stroke_w = vw >> 6;

        ball.draw();
        requestAnimationFrame(draw)
    }
})();


(function(){
    let canvas;
    let ctx
    let dat = new Map();
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
        canvas.width = vw;
        canvas.height = vh;
        document.getElementById('main-wrap').appendChild(canvas)

        draw();
    }
    function clear() {
        // ctx.fillStyle = clear_color
        // ctx.fillRect(0,0,vw,vh);
        ctx.clearRect(0,0, vw, vh);
    }
    function draw() {
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
    console.log(document.body.classList)
    document.body.classList.remove('loading');
    console.log(document.body.classList)
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


const MAX_SCROLL_DISTANCE = 400;
const LAYER_BOUNDS = {min: 0, max: 101}; // percentage values
const shiftEl = document.querySelector('.shift');
let shiftDirection = 'h';
if ( shiftEl.classList.contains('shift--vertical') ) {
    shiftDirection = 'v';
}
else if ( shiftEl.classList.contains('shift--rotated') ) {
    shiftDirection = 'r';
}
const layers = [...shiftEl.querySelectorAll('.shift__layer-inner')];
const triggerEl = document.querySelector('#trigger');

let currentScroll = 0;

let triggerTop;
let cache = {};
let layersTranslation = {x: 0, y: 0};

const calcTriggerTop = () => triggerEl.getBoundingClientRect()['top']+currentScroll;

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

