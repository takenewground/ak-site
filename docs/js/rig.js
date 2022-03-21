RIG_MODULE(-1, 1, 0b0000001, window, function(){});
function RIG_MODULE(_pid, _id, _flags, _global, _init_cb) {

const global = _global;
// const TH_ID = _th_id;
// const TH_MAIN = 0;
// const TH_IS_MAIN = TH_MAIN === TH_ID;

const rig = (function rig_constructor(){}).prototype;
global.rig = rig;

const $EVAL = hash32_str("eval", 0);

function __main__() {
    console.log("__main__");
    const man = new Actor(_pid, _id, _flags);
    rig.man = man;
    man.msgbox.set($EVAL, function eval_(msg) {
        const src = msg.des_str();
        // const r = eval(src);
        // if (r != undefined)
        //     msg.set_response(r)
        msg_respond(msg, eval(src));
    });
    man.msgbox_add(function ping(msg) {
        man.log("pong")
        // msg.return();
    });
    if (man.is_worker()) {
        global.onmessage = function (message) {on_messages(message.data);}
    }
    _init_cb(man);
}

// Utils

rig.hash32_str = hash32_str;
rig.pow2_floor = pow2_floor;
rig.pow2_ceil = pow2_ceil;

// export/import api
const _fn_map = new Map()
rig.export_fn = export_fn;
rig.import_fn = import_fn;
function export_fn(fn) {
    _fn_map.set(fn.name, fn)
}
function import_fn(name) {
    if (!_fn_map.has(name))
        throw new Error(`rig.import_fn: '${name}' does not exist`);
    return _fn_map.get(name)
}

// bufpool

const bufpool_map = new Map();
let _bufpool_allocs = 0;
let _bufpool_reallocs = 0;
rig.bufpool_alloc_count = function(){return _bufpool_allocs;}
rig.bufpool_realloc_count = function(){return _bufpool_reallocs;}
rig.bufpool_map = bufpool_map;
rig.bufpool_alloc = bufpool_alloc;
rig.bufpool_recycle = bufpool_recycle;
function bufpool_alloc(size) {
    size = pow2_ceil(size);
    if (bufpool_map.has(size)) {
        const pool = bufpool_map.get(size);
        if (pool.length) {
            ++_bufpool_reallocs
            return pool.pop();
        }
    }
    ++_bufpool_allocs;
    return new ArrayBuffer(size);
}
function bufpool_recycle(buf) {
    const size = pow2_ceil(buf.byteLength);
    if (bufpool_map.has(size))
        bufpool_map.get(size).push(buf);
    else
        bufpool_map.set(size, [buf]);
}

// SerDes

const SERDES_MAX_STR_LEN = (1<<16) - 4;
const BUF_EMPTY = new ArrayBuffer(0);
const DV_EMPTY = new DataView(BUF_EMPTY);
const U8_EMPTY = new Uint8Array(BUF_EMPTY);
const utf8encoder = new TextEncoder();
const utf8decoder = new TextDecoder();
function utf8enc_to(str, u8arr, offset) {
    return utf8encoder.encodeInto(str, offset ? u8arr.subarray(offset|0) : u8arr);
}
class SerDes {
    constructor() {
        this.dv = DV_EMPTY;
        this.bytes = U8_EMPTY;
        this.i0 = 0|0;
        this.i = this.i0;
    }
    clear() {
        this.dv = DV_EMPTY;
        this.bytes = U8_EMPTY;
        this.i = this.i0;
    }
    attach(buf, offset, size) {
        offset |= 0;
        size || (size = buf.byteLength - offset);
        this.dv = new DataView(buf, offset, size);
        this.bytes = new Uint8Array(buf, offset, size);
        this.i = this.i0;
    }
    jump(byte_index) {const j = this.i; this.i = byte_index; return j;};
    move(byte_delta) {this.i += byte_delta;}
    align(alignment) {return this.i = ((this.i + (alignment - 1)) & ~(alignment - 1));}
    set_f64(i, val) {this.dv.setFloat64(i, val);}
    set_f32(i, val) {this.dv.setFloat32(i, val);}
    set_i32(i, val) {this.dv.setInt32(i, val);}
    set_u32(i, val) {this.dv.setUint32(i, val);}
    set_i16(i, val) {this.dv.setInt16(i, val);}
    set_u16(i, val) {this.dv.setUint16(i, val);}
    set_i8(i, val)  {this.bytes[i] = val;}
    set_u8(i, val)  {this.bytes[i] = val;}
    ser_f64(val) {const i = this.align(8);this.i += 8;this.dv.setFloat64(i, val);}
    ser_f32(val) {const i = this.align(4);this.i += 4;this.dv.setFloat32(i, val);}
    ser_i32(val) {const i = this.align(4);this.i += 4;this.dv.setInt32(i, val);}
    ser_u32(val) {const i = this.align(4);this.i += 4;this.dv.setUint32(i, val);}
    ser_i16(val) {const i = this.align(2);this.i += 2;this.dv.setInt16(i, val);}
    ser_u16(val) {const i = this.align(2);this.i += 2;this.dv.setUint16(i, val);}
    ser_i8(val)  {this.bytes[this.i++] = val;}
    ser_u8(val)  {this.bytes[this.i++] = val;}
    ser_buf8(buf, offset, size) {
        offset |= 0;
        size || (size = buf.byteLength - offset);
        this.ser_u8(size);
        this.bytes.set(new Uint8Array(buf, offset, size), this.i);
        this.i += size;
    }
    ser_buf16(buf, offset, size) {
        offset |= 0;
        size || (size = buf.byteLength - offset);
        this.ser_u16(size);
        this.bytes.set(new Uint8Array(buf, offset, size), this.i);
        this.i += size;
    }
    ser_buf32(buf, offset, size) {
        offset |= 0;
        size || (size = buf.byteLength - offset);
        this.ser_u32(size);
        this.bytes.set(new Uint8Array(buf, offset, size), this.i);
        this.i += size;
    }
    ser_str(str) {
        const j = this.i;;
        this.move(2);
        const size = str.length;
        // if (size > SERDES_MAX_STR_LEN) throw new Error(`ser_str: size > SERDES_MAX_STR_LEN`)
        const {read, written} = utf8enc_to(str, this.bytes, this.i);
        if (read !== size) throw new Error(`ser_str: size:${size} exceeded target buffer size:${this.bytes.byteLength}`)
        this.set_u16(j, size);
        this.move(written);
    }
    get_f64(i) {return this.dv.getFloat64(i);}
    get_f32(i) {return this.dv.getFloat32(i);}
    get_i32(i) {return this.dv.getInt32(i);}
    get_u32(i) {return this.dv.getUint32(i);}
    get_i16(i) {return this.dv.getInt16(i);}
    get_u16(i) {return this.dv.getUint16(i);}
    get_i8(i)  {return this.bytes[i];}
    get_u8(i)  {return this.bytes[i];}
    des_f64() {const i = this.align(8);this.i += 8; return this.dv.getFloat64(i);}
    des_f32() {const i = this.align(4);this.i += 4; return this.dv.getFloat32(i);}
    des_i32() {const i = this.align(4);this.i += 4; return this.dv.getInt32(i);}
    des_u32() {const i = this.align(4);this.i += 4; return this.dv.getUint32(i);}
    des_i16() {const i = this.align(2);this.i += 2; return this.dv.getInt16(i);}
    des_u16() {const i = this.align(2);this.i += 2; return this.dv.getUint16(i);}
    des_i8()  {return this.bytes[this.i++];}
    des_u8()  {return this.bytes[this.i++];}
    des_buf8() {return this._des_buf(this.des_u8());}
    des_buf16() {return this._des_buf(this.des_u16());}
    des_buf32() {return this._des_buf(this.des_u32());}
    _des_buf(size) {return this.bytes.buffer.slice(this.i, this.i += size );}
    des_buf8_to(buf, offset) {this._des_buf_to(buf, offset|0, this.des_u8());}
    des_buf16_to(buf, offset) {this._des_buf_to(buf, offset|0, this.des_u16());}
    des_buf32_to(buf, offset) {this._des_buf_to(buf, offset|0, this.des_u32());}
    _des_buf_to(buf, offset, size) {(new Uint8Array(buf, offset)).set( this.bytes.subarray(this.i, this.i += size) );}
    des_str() {
        const size = this.des_u16();
        return utf8decoder.decode(
            this.bytes.subarray(this.i, this.i += size)
        );
    }
}

// msg API


// const MSG_MAX_ITEMS = 1 << 8;
// const MSG_FLAGS_MASK = (1 << (32 - 8)) - 1;

const MSG_FLAGS_SIZE = 2;
const MSG_ITEMS_SIZE = 2;
const MSG_DST_SIZE = 4;
const MSG_DST_BOX_SIZE = 4;
const MSG_SRC_SIZE = 4;
const MSG_SRC_BOX_SIZE = 4;
const MSG_RESERVED_SIZE = 20;

const MSG_FLAGS_POS = 0;
const MSG_ITEMS_POS = 2;
const MSG_DST_POS = 4;
const MSG_DST_BOX_POS = 8;
const MSG_SRC_POS = 12;
const MSG_SRC_BOX_POS = 16;

const NO_TRANSFER     = 0b00000001;
const NO_RECYCLE      = 0b00000010;
const NO_RETURN       = 0b00000100;
const MSG_RETURNED    = 0b00001000;

const _ITEM_TRANSFER_FLAG = 1<<10;

const msgpool_free = [];

rig.NO_TRANSFER = NO_TRANSFER;
rig.NO_RETURN = NO_RETURN;
rig.msg_alloc = msg_alloc;
rig.msg_from_buf = msg_from_buf;
rig.msg_send = msg_send;

function msg_alloc(data_size) {
    const size = MSG_RESERVED_SIZE + data_size;
    const buf = bufpool_alloc(size);
    return msg_from_buf(buf);
}

function msg_from_buf(buf) {
    const msg = msgpool_free.length ? msgpool_free.pop() : new Msg();
    msg.attach(buf, 0);
    return msg;
}

class Msg extends SerDes {
    constructor() {
        super();
        this.i0 = MSG_RESERVED_SIZE; // TODO: fn instead to allow dynamic i0
        this.item_map = new Map()
    }
    // attach() { super.attach()}
    free() {
        if (this.should_recycle_buffer()) {
            this.bytes.fill(0, 0, this.i0);
            bufpool_recycle(this.bytes.buffer)
        }
        this.item_map.clear();
        this.clear();
        msgpool_free.push(this);
    }
    // TODO: this assumes transferabole msg was sent before this call
    should_recycle_buffer() {
        return this.bytes.buffer.byteLength > 0;
    }
    // TODO:
    should_transfer_buffer() {
        return true;
    }
    // TODO:
    finalize() {

    }
    set_flags(flags)    {this.set_u16(MSG_FLAGS_POS, flags);}
    set_item_count(n)   {this.set_u16(MSG_ITEMS_POS, n);}
    set_dst(id)         {this.set_u32(MSG_DST_POS, id);}
    set_dst_box(hash)   {this.set_u32(MSG_DST_BOX_POS, hash);}
    set_src(id)         {this.set_u32(MSG_SRC_POS, id);}
    set_src_box(hash)   {this.set_u32(MSG_SRC_BOX_POS, hash);}
    get_flags()         {return this.get_u16(MSG_FLAGS_POS);}
    get_item_count()    {return this.get_u16(MSG_ITEMS_POS);}
    get_dst()           {return this.get_u32(MSG_DST_POS);}
    get_dst_box()       {return this.get_u32(MSG_DST_BOX_POS);}
    get_src()           {return this.get_u32(MSG_SRC_POS);}
    get_src_box()       {return this.get_u32(MSG_SRC_BOX_POS);}
    ser_transfer(item) {
        const item_count = this.get_item_count();
        this.ser_u16(item_count)
        this.item_map.set(item_count | (_ITEM_TRANSFER_FLAG), item);
        this.set_item_count(++item_count);
    }
    ser_clone(item) {
        const item_count = this.get_item_count();
        this.ser_u16(item_count);
        this.item_map.set(item_count, item);
        this.set_item_count(++item_count);
    }
    des_transfer() {
        const key = this.des_u16();
        return this.item_map.get(key);
    }
    des_clone() {
        const key = this.des_u16();
        return this.item_map.get(key);
    }
}

// msg io

const msg_queue_map = new Map();
let flush_timeout_ms = 7;
let flush_timeout_id = 0;

function on_messages(messages) {
    const msgs = [];
    const l = messages.length;
    let i = 0;
    while (i < l) {
        const msg = msg_from_buf(messages[i++]);
        if (!_msg_will_dispatch(msg))
            continue;
        const item_count = msg.get_item_count();
        let j = 0;
        while (j < item_count)
            msg.item_map.set(j++, messages[i++]);
        msgs.push(msg);
    }
    on_msgs(msgs)
}

function on_msgs(msgs) {
    for (let msg of msgs) {
        _msg_dispatch(msg);
    }
    for (let msg of msgs) {
        _msg_did_dispatch(msg)
    }
}

function _msg_dispatch(msg) {
    const dst = msg.get_dst();
    if (!actor_has(dst)) throw new Error("_msg_dispatch: actor not found");
    const dst_actor = actor_get(dst);
    dst_actor.on_msg(msg);
}

// return false to cancel dispatch
// TODO: handle response returned to dst_box?
function _msg_will_dispatch(msg) {
    let should = true;
    const flags = msg.get_flags();
    if (flags & MSG_RETURNED) {
        msg.free()
        should = false;
    }
    return should;
}

// TODO: handle response returned to dst_box?
function _msg_did_dispatch(msg) {
    const flags = msg.get_flags();
    if (flags & NO_RETURN) {
        msg.free();
        return;
    }
    msg.set_flags(flags | MSG_RETURNED);
    const src = msg.get_src();
    _msg_send_to(msg, src);
}

function msg_send(src, msg, dst, dstbox) {
    msg.set_dst(dst);
    msg.set_dst_box(dstbox);
    msg.set_src(src);
    msg.finalize();
    _msg_send_to(msg, dst);
}

function _msg_send_to(msg, dst) {
    const dst_thid = _dst_to_thid(dst);
    if (dst_thid === rig.man.id)
        _msg_send_local(msg)
    else
        _msg_send_enqueue(msg, dst_thid)
}

function msg_respond(msg, r) {

}

// TODO: broadcast thids to workers?
// now assuming parent worker can handle... see `worker_postmessage`
function _dst_to_thid(dst) {
    if (!actor_thid_map.has(dst)) {
        if (rig.man.is_worker())
            return rig.man.pid;
        throw new Error(`rig:send: can't find thread id for destination actor:${dst}`);
    }
    return actor_thid_map.get(dst);
}

function _msg_send_local(msg) {
    // console.warn("_msg_send_local() WIP");
    // debugger
    if (_msg_will_dispatch(msg)) {
        _msg_dispatch(msg);
        _msg_did_dispatch(msg);
    }
}

function _msg_send_enqueue(msg, dst_thid) {
    if (msg_queue_map.has(dst_thid))
        msg_queue_map.get(dst_thid).push(msg)
    else
        msg_queue_map.set(dst_thid, [msg])
    if (!flush_timeout_id)
        flush_timeout_id = setTimeout(_flush_timeout, flush_timeout_ms)
}

function _flush_timeout() {
    flush_timeout_id = 0;
    _flush_msg_queue();
}

function flush() {
    if (flush_timeout_id) {
        clearTimeout(flush_timeout_id);
        flush_timeout_id = 0;
    }
    if (msg_queue_map.size > 0)
        _flush_msg_queue();
}

// TODO: handle destination thread type other than postmessage API
function _flush_msg_queue() {
    for (let [dst_thid, msgs] of msg_queue_map)
        msgs_post_to(dst_thid, msgs)
    msg_queue_map.clear();
}

function msgs_post_to(thid, msgs) {
    const items = [];
    const transfers = [];
    _msgs_post_finalize(msgs, items, transfers);
    worker_postmessage(thid, items, transfers);
    for (let msg of msgs)
        msg.free();
}

function _msgs_post_finalize(msgs, items, transfers) {
    for (let msg of msgs) {
        const buffer = msg.bytes.buffer
        items.push(buffer);
        if (msg.should_transfer_buffer())
            transfers.push(msg.bytes.buffer);
        if (msg.get_item_count() > 0) {
            for (let [key, item] of msg.item_map) {
                items.push(item);
                if (key & _ITEM_TRANSFER_FLAG)
                    transfers.push(item);
            }
        }
    }
}

// Actor API

const THREAD_T = rig.THREAD_T               = 0b00000001;
const WORKER_T = rig.WORKER_T               = 0b00000101;
const CANVAS_WORKER_T = rig.CANVAS_WORKER_T = 0b00001000;
// const MAIN_THREAD_T = 0b00000011;

const actor_map = new Map();
const actor_thid_map = new Map();
// const actor_thread_map = new Map();
// const actor_threads = [];

class Actor {
    constructor(pid, id, flags) {
        if (!id) throw new Error("rig:Actor::constructor requires id");
        this.msgbox = new Map();
        this.pid = pid;
        this.id = id;
        if ((flags & CANVAS_WORKER_T) && ('OffscreenCanvas' in global)) {
            flags |= WORKER_T;
        }
        this.flags = flags;
        this.thid = _actor_get_thid(this);
        actor_thid_map.set(id, this.thid);
        actor_map.set(id, this);
        // console.log("new Actor",{id,pid,flags});
    }
    msgbox_add(fn) {
        const name = fn.name;
        if (!name) throw new Error(`Actor:msgbox_add: requires function w/ name`);
        const hash = rig.hash32_str(name, 0);
        this.msgbox.set(hash, fn);
    }
    on_msg(msg) {
        const dstbox = msg.get_dst_box();
        if (this.msgbox.has(dstbox)) {
            this.msgbox.get(dstbox)(msg);
        }
        // if send to man if not handled. TODO: bubble up?
        else if (rig.man.msgbox.has(dstbox)) {
            rig.man.msgbox.get(dstbox)(msg);
        }
        else {
            this.error(`on_msg dstbox:${dstbox} not found`);
            throw new Error()
        }
    }
    is_local() {
        return this.thid == rig.man.id;
    }
    is_worker() {
        return this.flags & WORKER_T;
    }
    is_thread() {
        return this.flags & THREAD_T
    }
    get_parent() {
        return actor_map.get(this.pid)
    }
    // send_to(id, method, args) {
    // }
    // transfer_to(id, method, transfers) {

    // }
}
Actor.prototype.log = function (...args) {
    console.log(`Actor:${this.id}::`,...args);
}
Actor.prototype.warn = function (...args) {
    console.warn(`Actor:${this.id}::`,...args);
}
Actor.prototype.error = function (...args) {
    console.error(`Actor:${this.id}::`,...args);
}
function _actor_get_thid(actor) {
    while (actor) {
        if (actor.flags & THREAD_T)
            return actor.id;
        actor = actor.get_parent();
    }
    throw new Error(`Actor:get_thread_id: thread id not found`);
}

rig.Actor = Actor;
// rig.actor_thid = actor_thid
rig.actor_spawn = actor_spawn;
rig.actor_get = actor_get;
rig.actor_has = actor_has;

function actor_get(id) {return actor_map.get(id)};
function actor_has(id) {return actor_map.has(id)};
async function actor_spawn(pid, id, flags, fn) {
    const actor = new Actor(pid, id, flags);
    if (actor.is_local())
        await _actor_spawn_local(actor, fn)
    else if (actor.is_worker())
        await _actor_spawn_as_worker(pid, id, flags, fn);
    else {
        await _actor_spawn_nonlocal(pid, id, flags, fn);
    }
}
function _actor_spawn_local(actor, fn) {
    fn(actor);
}
function _actor_spawn_as_worker(pid, id, flags, fn) {
    worker_create(pid, id, flags, fn);
}
function _actor_spawn_nonlocal(pid, id, flags, fn) {
    const src = `rig.actor_spawn(${pid},${id},${flags},${fn});`
    const msg = msg_alloc(src.length); // IMPORTANT: implies ascii chars and length < 2^16
    msg.ser_str(src);
    msg_send(rig.man.id, msg, pid, $EVAL);
}
// function actor_is_thread(id) {
//     return
// }
// function actor_get_thread_id(id) {
//     while (id >= 0) {
//         const actor = actor_get(id)
//         a
//     }
// }

// Worker API

const worker_map = new Map();
rig.worker_map = worker_map;
rig.worker_create = worker_create;
rig.worker_destroy = worker_destroy;
function worker_create(pid, id, flags, fn) {
    const blob = new Blob([`(${RIG_MODULE})(${pid},${id},${flags},self,${fn})`], {type: 'application/javascript'});
    const worker = new Worker(URL.createObjectURL(blob));
    worker_map.set(id, worker);
    worker.onmessage = function(message) {
        on_messages(message.data);
    }
    worker.onerror = function(e) {
        console.error(`rig:th worker onerror: type ${e.type}`);
        console.error(e);
    }
    // onmessageerror
    return id;
}
function worker_destroy(id) {
    if (!worker_map.has(id))
        console.warn(`rig:worker_destroy(${id}): worker not found`);
    else {
        // TODO: send destroy message? hmmm...
        const worker = worker_map.get(id);
        worker_map.delete(id);
        worker.terminate();
    }
}
function worker_postmessage(id, items, transfers) {
    if (worker_map.has(id))
        worker_map.get(id).postMessage(items, transfers)
    else if (id === rig.man.pid && rig.man.is_worker()) // TODO:
        global.postMessage(items, transfers)
    else
        throw new Error(`worker_postmessage: id:${id} unknown`)
}


__main__();


// Utils

// function mem_align(offset, alignment) {return ((offset + (alignment - 1)) & ~(alignment - 1));}
function pow2_floor(n) {return 1 << 31 - Math.clz32(n);}
function pow2_ceil(n) {return 1 << 32 - Math.clz32(n-1);}

// adopted from: https://github.com/garycourt/murmurhash-js/blob/master/murmurhash3_gc.js
// const c1 = 0xcc9e2d51; const c2 = 0x1b873593;
function hash32_str(key, seed) {
    const remainder = key.length & 3;
    const bytes = key.length - remainder;
    let h1 = seed;
    let i = 0|0;
    while (i < bytes) {
        let k1 =
        ((key.charCodeAt(i) & 0xff)) |
        ((key.charCodeAt(++i) & 0xff) << 8) |
        ((key.charCodeAt(++i) & 0xff) << 16) |
        ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;
        k1 = ((((k1 & 0xffff) * 0xcc9e2d51) + ((((k1 >>> 16) * 0xcc9e2d51) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * 0x1b873593) + ((((k1 >>> 16) * 0x1b873593) & 0xffff) << 16))) & 0xffffffff;
        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        let h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }
    let k1 = 0|0;
    switch (remainder) {
        case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1: k1 ^= (key.charCodeAt(i) & 0xff);
        k1 = (((k1 & 0xffff) * 0xcc9e2d51) + ((((k1 >>> 16) * 0xcc9e2d51) & 0xffff) << 16)) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = (((k1 & 0xffff) * 0x1b873593) + ((((k1 >>> 16) * 0x1b873593) & 0xffff) << 16)) & 0xffffffff;
        h1 ^= k1;
    }
    h1 ^= key.length;
    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;
    return h1 >>> 0;
}

}



// // Stage API
// const stage_th_map = new Map();
// rig.stage_create = stage_create;
// function stage_create(id) {
//     stage_th_map.set(id, TH_ID);
// }
// class World {
//     constructor(fn) {
//         this.children = []
//         this.raf = 0;
//         this.t = 0;
//         this.dt = 0;
//     }
//     start() {
//         const that = this
//         that.raf = requestAnimationFrame(_render)
//         function _render(t) {
//             that.dt = t - that.t;
//             that.t = t;
//             that.render()
//             that.raf = requestAnimationFrame(_render);
//         }
//     }
//     stop() {
//         if (this.raf) {
//             cancelAnimationFrame(this.raf)
//             this.raf = 0
//         }
//     }
//     add_child(name, fn) {

//     }
//     send() {

//     }
//     render() {

//     }
// }




// console.time("fetch")
// fetch("./js/rig/viewport_producer.js").then(async (response) => {
//     if (!response.ok) {
//       throw new Error('Network response was not OK');
//     }
//     const decoder = new TextDecoder('utf-8');
//     const buf = await response.arrayBuffer();
//     const str = decoder.decode(buf)
//     console.timeEnd("fetch")
//     console.log(str)
//   })