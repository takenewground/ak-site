rig.export_fn(viewport_producer);
rig.export_fn(viewport_consumer);

function viewport_producer() {
    function start() {
        update()
        window.addEventListener("resize",measure_viewport,{passive:true});
    }
    function stop() {

    }
    function update() {
        // $.log('handle_move',{clientX, clientY});
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const msg = rig.msg_alloc(2+2);
        // msg.set_type(MSG_PACKET);
        // msg.set_flags()
        msg.ser_i16(vw);
        msg.ser_i16(vh);
        rig.msg_send($.id, msg, MOUSE_DRAW,$UPDATE);
    }
}

function viewport_consumer($) {
    let size = new Uint16Array(2);
    // $.name("mouse");
    rig.export_fn(function viewport_size(){
        return size
    });
    $.msgbox_add(function update(msg) {
        size[0] = msg.des_i16();
        size[1] = msg.des_i16();
        $.log('update',{pos})
    });
}
