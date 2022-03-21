

// const MOUSE_MAIN = rig.hash32_str("mouse_main", 0);
const MOUSE_DRAW = rig.hash32_str("mouse_draw", 0);
// rig.actor_spawn(MAIN, MOUSE_MAIN, 0, mouse_producer)
// rig.actor_spawn(MAIN, MOUSE_MAIN, 0, mouse_producer)

rig.export_fn(mouse_producer);
rig.export_fn(mouse_consumer);

async function mouse_producer($) {
    const {hash32_str} = rig;
    const $UPDATE = hash32_str("update", 0);
    $.msgbox.set(1, start);
    $.msgbox.set(-1, stop);
    // await spawn_mouse_draw();
    start();
    // console.time("move")
    function handle_move(clientX, clientY, target)
    {
        // console.timeEnd("move")
        // console.time("move")
        $.log('handle_move',{clientX, clientY});
        const msg = rig.msg_alloc(2+2);
        // msg.set_type(MSG_PACKET);
        // msg.set_flags()
        // msg.recycle(1);
        msg.ser_i16(clientX);
        msg.ser_i16(clientY);
        rig.msg_send($.id, msg, MOUSE_DRAW,$UPDATE);
    }
    function start()
    {
        const listen_opts = {passive:true};
        document.addEventListener('mousemove',
            function(e) {
                handle_move(e.clientX,e.clientY,e.target);
            }, listen_opts
        );
        const HAS_TOUCH = ('ontouchstart' in document);
        if (HAS_TOUCH) {
            document.addEventListener('touchmove',
                function (e) {
                    const t = e.targetTouches ? e.targetTouches[0] : e
                    handle_move(t.clientX,t.clientY,t.target);
                }, listen_opts
            );
            document.addEventListener('touchstart',
                function (e) {
                    const t = e.targetTouches ? e.targetTouches[0] : e
                    handle_move(t.clientX,t.clientY,t.target);
                }, listen_opts
            );
        }
    }

}

function mouse_consumer($) {
    let pos = new Uint16Array(2);
    // $.name("mouse");
    rig.export_fn(function
        mouse_pos(){
            return pos
        });
    $.msgbox_add(function
        update(msg) {
            pos[0] = msg.des_i16();
            pos[1] = msg.des_i16();
            $.log('update',{pos})
        });
}
