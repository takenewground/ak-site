import { writeFile } from 'fs/promises';
import '../dss/dss.js';
dss.init();
dss.install(dss.plugin_from_obj({
    async install() {
        await dss.install_paths([
            `${dss.DIR}/plugins/css/index.js`,
            // "/plugins/clr.js",
            `${dss.DIR}/plugins/typ.js`,
            // "/plugins/prose/index.js"
        ])
    },
    async configure() {
        const {set,set_multi_band,set_merge} = dss;
        set('xxs',320)      // 200 'xxs' Mobile portait (320px to 414px) — For devices with 4" to 6.9" screens.
        set('xs',480)       // 300 'xs' Mobile landscape
        set('sm',640)       // 400 'sm'
        set('md',768)       // 500 'md' Tablet-portrait (and larger)
        set('lg',992)       // 600 'lg' Tablet-landscape (and larger) // 'lg': '1024px',
        set('xl',1200)      // 700 'xl' // Laptops (and langer)
        set('xxl',1800)     // 800 'xxl' ... or 1920 '1536px' '2xl'
        set('xxxl',2400)    // 900 'xxxl'
        // dark fg
        set_multi_band('clr.dark.fg', {
            range: [100, 900], step: 100, default: 500,
            props: [
                ['h', ()=> 219],
                ['s', ()=> '25%'],
                ['l'],
                ['a'],
            ]
        });
        set_merge('clr.dark.fg.100', {l: '87%', a:0.2});
        set_merge('clr.dark.fg.400', {l: '87%', a:0.6});
        set_merge('clr.dark.fg.500', {l: '87%', a:1.0});
        set_merge('clr.dark.fg.700', {l: '93%', a:1.0});
        set_merge('clr.dark.fg.900', {l:'100%', a:1.0});
        // dark bg
        set_multi_band('clr.dark.bg', {
            range: [100, 900], step: 100, default: 500,
            props: [
                ['h'],
                ['s', ()=> '25%'],
                ['l'],
                // ['a', band.const(1.0)],
            ]
        });
        set_merge('clr.dark.bg.100', {h:225, s:'13%', l:  '0%'}),
        set_merge('clr.dark.bg.300', {h:225, s:'13%', l: '12%'}),
        set_merge('clr.dark.bg.400', {h:234, s:'13%', l: '15%'}),
        set_merge('clr.dark.bg.500', {h:240, s:'10%', l: '18%'}),
        set_merge('clr.dark.bg.600', {h:220, s: '6%', l: '22%'}),
        set_merge('clr.dark.bg.700', {h:230, s: '8%', l: '26%'}),
        set_merge('clr.dark.bg.900', {h:230, s:'7%', l:'29%'}),
        // pop colors
        set_merge('clr.pop1', {h:116, s: '32%', l: '64%'}); /*green*/
        set_merge('clr.pop2', {h: 40, s:'100%', l: '75%'}); /*yellow*/
        set_merge('clr.pop3', {h:194, s: '94%', l: '51%'}); /*blue*/
        set_merge('clr.pop4', {h:248, s: '59%', l: '63%'}); /*purp*/
        set_merge('clr.pop5', {h:340, s:'100%', l: '84%'}); /*pink*/
        //  $.set_merge('clr.pop_100', {h:194, s: 94, l:100}); /*white*/
    },
    make() {
        const {get} = dss;
        const css = get("/css");
        // const prose = get("/prose");
        const out = css.flatten([
            css.make_all(),
            // prose.make_css(),
            app_css()
        ]);
        // console.log(css.mixin('flex-v', ['gap',css.rlh(1)] ))
        writeFile("./src/css/base.css", css.beautify(out))
        // console.log(css.beautify(out));
        console.log(css.class`relative grid`)

        function app_css()
        {
            const $ = css.class;
            return css.flatten([
                ['body',`
                    --color-text: #fff;
                    --color-bg: #1e2227;
                    --color-bg: #2b2b2b;
                    --color-bg: hsl(0 0% 0%);
                    --color-bg-shift:  #e1ddd8;
                    --main-bg: hsl(0deg 0% 23%);

                    --color-link: #fff;
                    --color-link-hover: #fff;

                    --page-padding: 2vw;
                    color: var(--color-text);
                    background-color: var(--color-bg);
                    font-family: 'Aktiv Grotesk', Nexa Text, brother-1816, sans-serif;
                    --rfs: 0.938vw;
                    --rlh: calc(var(--rfs) * 1.875 / 0.938);
                    font-size: 1.0vw;
                    font-weight: 400;
                    line-height: calc(1.875 / 0.938);
                    line-height: 1.6666666;
                    letter-spacing: 0.034vw;
                    font-family: 'Aktiv Grotesk';

                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                `
                ],
                ['.layer',$`fixed t(0) l(0) `],
                ['a',$`color(${css.v('color-link')}) cursor(pointer)
                    textline-under textline-dotted textline.color(black) textline.h(.11em) textline.y(.33333333em)
                `,
                    ['&:hover',$`textline-solid`],
                ],
                ['p',$`w.max(64ch)`,
                    ['&.lead', `
                        font-size: var(--rlh);
                        -webkit-hyphens: auto;
	                    hyphens: auto;
                    `],
                ],
                ['h3', $`relative`, `
                            font-weight: bold;
                            font-size: 0.77777777vw;
                            line-height: 1em;
                            letter-spacing: 1.5ch;
                            text-indent: 1.5ch;
                            text-transform: uppercase;
                            font-family: 'Aktiv Grotesk';
                            --line-w: 1px;
                        `,
                        ['&:before', `
                            content: "";
                            position: absolute;
                            display: block;
                            width: 100%;
                            height: 100%;
                            top: -250%;

                            border-bottom: var(--line-w) solid hsl(0deg 0% 0%);
                            border-top: var(--line-w) solid hsl(0deg 0% 0%);
                            transform: skewX(70deg);
                            transform-origin: 0% 0%;
                        `],
                        ['&:after', `
                            content: "";
                            position: absolute;
                            display: block;
                            width: 100%;
                            height: 100%;
                            top: 250%;
                            border-bottom: var(--line-w) solid hsl(0deg 0% 0%);
                            border-top: var(--line-w) solid hsl(0deg 0% 0%);
                            transform: skewX(70deg);
                            transform-origin: 100% 100%;
                        `],
                ],
                ['[data-scroll-container].is-scrolling',
                    `will-change:transform;`,
                    // ['[data-scroll-section], [data-scroll], .c-scrollbar_thumb',`will-change:transform;`],
                    // ['[data-scroll-container]',`will-change:transform;`],
                    ['[data-scroll-section], [data-scroll], .c-scrollbar_thumb',`will-change:transform;`],
                ],


                ['.mix-blend',`mix-blend-mode:exclusion;`],

                ['.bg',`
                        background: var(--color-bg);
                        position: fixed;
                        top: 0;
                        height: 100%;
                        width: 100%;
                        pointer-events: none;
                `],

                ['#main-wrap',$`bg(${css.v('main-bg')}) contain(style)`],
                ['main',$`flex-v contain(${`style paint`}) backface-hidden style(${`
                    transform:translate3d(0px,0px,0px);
                `})`],
                ['section', $`contain(style)`,// $`bg(${css.v('section-bg')})`,
                ],
                ['section.intro',
                    $`relative h(100vh) p.y(${css.vh(100/18)})
                        grid grid.cols(9) grid.rows(9)
                    `,
                    ['> .graphic', $`col.start(6) col.end(9) row.start(1) row.end(9) m.b(${css.vh(-100/9)})
                        flex-h zi(-1)`,
                        ['.graphic-item', $`w(100%) block rounded(999px) bg.size(cover) bg.position(${'50% 50%'})`],
                    ],
                    ['> .title', $`col.start(2) col.end(7) row.start(2) row.end(auto)
                        flex-v gap(6vw) items-center
                        uppercase text-center`,`
                        text-transform: uppercase;
                        text-align:center;
                        `,
                        ['.logo',$`h.min(6vw) flex items-center color(black)`],
                        ['.title-main',$`m(0) style(${`
                            font-size: 13vw;
                            font-family: Saol Display, ivypresto-display, serif;
                            font-weight: 500;
                            font-size: 6vw;
                            line-height: 1.1111111;
                            letter-spacing: -0.231vw;
                            pointer-events: none;
                        `})`],
                    ],
                    ['> .social-links',
                        // $`col.start(3) col.end(6) row.start(8) row.end(auto) flex-v items-center text-center
                        $`col.start(8) col.end(10) row.start(1) row.end(auto) flex-v items-center text-center
                            gap(1.6666666vw)
                            none`,
                        // $`col.start(3) col.end(6) row.start(9) row.end(auto) flex-h items-end content-between gap(2em) text-center`,
                        // ['>a',$`w.max(9em)`],

                    ],
                ],
                ['section.outro',
                    $`relative h(100vh) p.t(0)
                        grid grid.cols(9) grid.rows(9)
                    `,
                    ['> .graphic', $`col.start(2) col.end(5) row.start(3) row.end(10)
                        flex-h zi(-1)`,
                        ['.graphic-item', $`w(100%) block rounded.t(999px) bg.size(cover) bg.position(${'50% 0%'})`],
                    ],
                    ['> .text', $`col.start(6) col.end(8) row.start(8) row.end(auto)
                        flex-v gap(5vw) items-center`
                    ],

                ],
                ['section.graphic-text',
                    $`relative h(100vh) p.y(${css.vh(0/9)})
                        grid grid.cols(9) grid.rows(9)
                    `,
                    ['> .graphic', $`col.start(3) col.end(5) row.start(1) row.end(6) m.b(${css.vh(-100/9)})
                        flex-h`,
                        ['.graphic-item', $`w(100%) block rounded(999px) bg.size(cover) bg.position(${'50% 50%'})`],
                    ],
                    ['> .text', $`col.start(6) col.end(8) row.start(6) row.end(auto)`
                    ],

                ],

                ['section.present', css.class`relative flex-v`, `
                        padding-top: 33.333333vh;
                        padding-bottom: 33.333333vh;
                        gap: 3.75vw;
                    `
                ],
                ['section.clients', css.class`relative flex-v items-center`, `
                        padding-top: 33.333333vh;
                        padding-bottom: 33.333333vh;
                        gap: 7vw;
                        text-align:center;
                    `,
                    ['li',`
                        font-weight: 500;
                        font-family: 'Saol Display';
                        font-size: 5vw;
                        line-height: 5.55555vw;
                        min-height: 8vw;
                        letter-spacing: -0.04ch;
                    `,
                        ['a',$`relative zi(10)`,['&:not([href])',$`textline-none`]],
                        ['.gallery', css.class`absolute`,`
                            z-index:0;
                            visibility:hidden;
                            left:0; right:0;
                            height:100%;
                        `],
                        ['&:hover', css.class`italic`,
                            ['.gallery',`
                                visibility:visible;
                            `],
                        ]
                    ]
                ],
            ])
        }
    }
})).then(async ()=> {
    await dss.run('configure')
    await dss.run('make')
})

{/* <button class="intro__menu-button invert" aria-label="Open Menu">
					<svg width="100%" height="100%" viewBox="0 0 105 105">
						<circle fill="#25282a" cx="52.5" cy="52.5" r="52.5"/>
						<path class="lines" d="M40.5 46.208h25M40.5 52.208h25M40.5 58.208h25" stroke="#B7B7B7"/>
					</svg>
				</button> */}

// .intro__menu-button {
// 	align-self: start;
// 	justify-self: end;
// 	border: 0;
// 	margin-top: 1rem;
// 	background: none;
// 	cursor: not-allowed;
// 	width: 60px;
// 	height: 60px;
//     @media screen and (min-width: 53em)
//         width: 105px;
//         height: 105px;

// }


// @media screen and (min-width: 53em) {
// 	body {
// 		--page-padding: 1.5rem;
// 	}

// 	.lines {
// 		stroke-width: 2px;
// 	}



// 	.intro {
// 		grid-template-areas:
// 		'intro-images intro-menu'
// 		'intro-images intro-ad'
// 		'intro-title intro-title';
// 		grid-template-columns: 67% 1fr;
// 		grid-template-rows: 1fr 1fr auto;
// 	}

// 	.intro__title {
// 		/* white-space: nowrap; */
// 	}

// 	.demos {
// 		position: relative;
// 		width: auto;
// 	}

// 	.demos::before {
// 		content: '';
// 		width: 3rem;
// 		border-bottom: 1px solid;
// 		display: inline-block;
// 		vertical-align: middle;
// 		margin: 0 0.5rem;
// 	}

// 	.present {
// 		display: grid;
// 		grid-template-areas: 'present-large present-large''present-small present-visual';
// 		grid-template-columns: 40% 1fr;
// 	}

// 	.type__link {
// 		display: inline-block;
// 	}

// 	.footer {
// 		display: grid;
// 		grid-template-areas: 'footer-list footer-img ...''footer-author footer-img footer-year';
// 		grid-template-columns: auto 1fr auto;
// 		align-content: space-between;
// 	}

// 	.footer__links {
// 		column-count: 2;
// 	}
// }
