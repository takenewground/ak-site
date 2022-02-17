
const {
    E: M_E,
    sqrt,
    abs,
    cos,    sin,
    cosh,   sinh,
} = Math;

const   spring_map = new Map();
const   spring_system_map = new Map();
let     CK_DEFAULT = 0;
let     C_DEFAULT = 12;
let     K_DEFAULT = 180;

function spring_register(_c, _k) {
    const c = _c || C_DEFAULT;
    const k = _k || K_DEFAULT;
    const ck = spring_ck(c, k);
    spring_map.has(ck) ? spring_map.get(ck) : _spring_register(ck,c,k);
    return ck;
}

function spring_ck(c, k) {
    return (c|0)**2 - ((k|0)<<2);
}

function spring_set_default(c, k) {
    const ck = spring(c, k);
    _spring_set_default(ck, c, k);
    return ck;
}

function _spring_register(_ck, c, k) {
    _spring_set_default(_ck, c, k);
    _spring_register = function(_ck, c, k) {
        const fun = _spring_fun_branch[(_ck >>> 31)](c, k, _ck);
        spring_map.set(_ck, fun);
        return fun;
    }
    return _spring_register(_ck, c, k);
}

function _spring_set_default(ck, c, k) {
    CK_DEFAULT = ck;
    C_DEFAULT = c;
    K_DEFAULT = k;
}

const _spring_fun_branch = [
    _spring_fun_pos,
    _spring_fun_neg,
]

function _spring_fun_pos(c,k,_ck) {
    const _sq = sqrt(_ck);
    const _cos = cosh;
    const _sin = sinh;
    return function (v,t) {
        const _t2 = t / 2.0;
        const _sq_t2 = _sq * _t2;
        const x = 1.0 + M_E**( -(c * _t2) ) *
                ( -_cos(_sq_t2) - ( _sin(_sq_t2) * (c - (v * 2.0)) / _sq ) );
        return x;
    }
}
function _spring_fun_neg(c,k,_ck) {
    const _sq = sqrt(sign_invert(_ck));
    const _cos = cos;
    const _sin = sin;
    return function (v,t) {
        const _t2 = t / 2.0;
        const _sq_t2 = _sq * _t2;
        const x = 1.0 + M_E**( -(c * _t2) ) *
                ( -_cos(_sq_t2) - ( _sin(_sq_t2) * (c - (v * 2.0)) / _sq ) );
        return x;
    }
}

const   ACTIVE = 1;
let     TIME_STEP = 16;

const TARGET_SAME = 0;
const TARGET_CHANGED = 1
const TARGET_SET = 2

const   DX_MIN = .00001;
let     VX0 = -1.0 // -1.0 simulates initial surface tension

class Spring {
    constructor(y0, c, k) {
        this.flags = 0|0;
        this.y0 = y0;
        this.y1 = y0;
        this.y = y0;
        this.x0 = 0.0;
        this.x1 = 1.0;
        this.x = 0.0;
        this.t = 0,
        this.dx = 0.0;
        this.vx0 = VX0;
        this.vx = 0.0;
        this.set_ck(c, k);
    }
    set_ck(c, k) {
        const ck = spring_register(c, k);
        this.ck = ck;
        this._compute_fn = spring_map.get(ck);
    }
    target(y1) {
        let code = TARGET_SAME;
        if (this.y1 != y1) {
            if (this.flags & ACTIVE) {
                this._change_target(y1);
                code = TARGET_CHANGED;
            }
            else {
                this._set_target(y1);
                code = TARGET_SET;
            }
            this.y1 = y1;
            this.t = 0;
            this.x = 0.0;
            this.x1 = 1.0;
        }
        return code;
    }
    update(dt) {
        this.t += dt;
        const x = this._compute_fn(this.vx0, this.t);
        const dx = x - this.x;
        if (abs(dx) <= DX_MIN) {
            const x1 = this.x1;
            this.dx = x1 - x;
            this.x = x1;
            this.y = this.y1;
            this.vx = 0.0;
            this.vx0 = 0.0;
            this.flags = 0|0;
        }
        else {
            this.x = x;
            this.y = map_01range(x, this.y0, this.y1);
            this.dx = dx;
            this.vx = dx / dt
            this.flags |= 2;
        }
    }
    _change_target(y1) {
        const y0 = this.y;
        this.vx *= (this.y1 - this.y0)/ (y1 - y0);
        this.vx0 = this.vx;
        this.y0 = y0;
    }
    _set_target(y1) {
        this.flags = ACTIVE;
        this.vx = VX0;
        this.vx0 = VX0;
        this.y0 = this.y;
    }   // TODO: simulats initial friction
}

class SpringSystem {
    constructor(ontick, onrest) {
        this.ontick = ontick;
        this.onrest = onrest;
        this._is_rested = 1;
        this._t_prev = 0;
        this._frame = 0;
        this.dx_min = .000001;
        this.vx0 = -1.0; // -1.0 simulates initial surface tension
        this.vals = new Map();
        // this.setters = new Map();
        this.springs = new Map();
        this.springing = [];
        // this.springing_count = 0;
        this.changed = [];
        // this.changed_count = 0;
        // const   props = new Map();
        // const   props_active = [];
        // let     props_active_l = 0;
        // let     props_changed = [];
        // let     props_changed_l = 0;
    }

    set(key, val) {
        if (this.springs.has(key))
            this.spring_to(key, val);
        else {
            const vals = this.vals;
            if (vals.has(key)) {
                if (vals.get(key) == val)
                    return
                this._on_change_static(key, val)
                vals.set(key, val)
            }
            else {
                this._on_change_static(key, val)
                vals.set(key, val)
            }
        }
    }
    has(key) {
        return this.vals.has(key)
    }
    get(key) {
        return this.vals.get(key)
    }

    spring(key, c, k) {
        const y0 = this.vals.get(key) || 0;
        const springs = this.springs;
        if (springs.has(key))
            springs.get(key).set_ck(c, k);
        else
            springs.set(key, new Spring(y0, c, k));
    }
    spring_to(key, y1) {
        if (this.springs.get(key).target(y1) == TARGET_SET)
            this.springing.push(key);
    }
    update() {
        if (this.springing.length > 0) {
            this._is_rested = 0;
            this._update(TIME_STEP);
            this.ontick(this);
        }
        else if (this._is_rested === 0) {
            this._is_rested = 1;
            this.onrest(this);
        }
        this.changed.length = 0;
    }

    _update(dt_ms) {
        ++this._frame;
        const dt = dt_ms / 1000.0;
        const active = this.springing.slice(0);
        this.springing.length = 0;
        for (let key of active) {
            const spring = this.springs.get(key);
            spring.update(dt)
            if (spring.flags !== 0)
                this.springing.push(key);
            this.vals.set(key, spring.y);
            this.changed.push(key);
        }
    }

    _on_change_static(key, val) {
        this.changed.push(key);
        // TODO: ...
    }

    destroy() {
        this.clear();
        // spring_system_map.delete();
    }

    clear() {
        this.springs.clear()
        this.vals.clear()
        this.changed.length = 0;
        this.springing.length = 0;
        this._t_prev = 0;
        this._frame = 0;
        this._is_rested = 1;
    }



}

function spring_system_create(name, ontick, onrest) {
    let sys = new SpringSystem(ontick, onrest);
    spring_system_map.set(name, sys)
    return sys;
}


function time_ms() {
    return performance.now(0)|0;
}

function map_range(input, in0, in1, out0, out1) {
    const scale = (input - in0) / (in1 - in0);
    return out0 + scale * (out1 - out0);
}

function map_01range(input, out0, out1) {
    return out0 + input * (out1 - out0);
}

function sign_invert(x) {
    return (x ^ -1) + 1;
}

export {
    spring_system_create,
    spring_register,
    spring_set_default,
    // spring_system,
    spring_system_map,
    time_ms,
    map_range,
    map_01range,
    sign_invert,
}

