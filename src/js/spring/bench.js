
import {spring_system} from "./index.js"

function run() {
    let mutate_count = 0;
    const vals = new Map();

    console.time('run')

    const sys = spring_system('world', tick, rest);
    sys.int('y',10);
    sys.int('x',0);
    sys.int('z',0);
    sys.spring('y', 1,1400);
    sys.spring('x', 12, 180);
    sys.spring('z', 12, 180); // use default
    sys.to('y',111);
    sys.to('x',111);
    sys.to('z',1110);
    sys.update();

    function tick(each, num) {
        each(mutation);
        sys.update(); // requestAnimationFrame(sys.update)
    }

    function mutation(k, v) {
        ++mutate_count;
        console.log(k,v)
        vals.set(k,v);
    }

    function rest() {
        console.timeEnd('run')
        console.log({mutate_count, vals});
        sys.destroy();
    }
}

run()














// const _spring_fun_branch = [
//     // negative _ck
//     function(c,k,v,_ck) {
//         return __spring_fun(c,k,v,  sqrt(sign_invert(_ck)), cos, sin);
//     },
//     // positive _ck
//     function (c,k,v,_ck) {
//         return __spring_fun(c,k,v,  sqrt(_ck), cosh, sinh);
//     }
// ]
// function __spring_fun(c,k,v,_sq,_cos,_sin) {
//     return function (t) {
//         // console.time('f');
//         const _t2 = t/2;
//         const _sq_t2 = _sq*_t2;
//         const x = 1 + M_E**(-(c*_t2))*(-_cos(_sq_t2)-(_sin(_sq_t2)*(c - v*2)/(_sq))
//         );
//         // console.timeEnd('f');
//         return x;
//     }
// }

/*
a=[];
console.time('f');
d=0.01;
t=0.0;
n=0|0;
while (t<=1.0) {
    a[n++] = f(t);
    t+=d;
};
console.timeEnd('f');
console.log(a)
*/
// console.time('f');
    // const x = 1 + M_E**(-((c*t)/2)) * (
    //   -cosh(sqrt(c**2 - 4*k) *t/2)
    // - (sinh(sqrt(c**2 - 4*k) *t/2)
    //       / sqrt(c**2 - 4*k) *(c - 2*v))
    // );