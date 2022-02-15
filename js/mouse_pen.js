let dpr = 1;
	let classNames = ['layer']
	let clear_rgba = [0.0,0.0,0.0,0.0]// [0.1, 0.05, 0.02, .5]
	let line_color = "#ffffff"
	let line_thikness = 16
	let el = document.querySelector(".bg") //document.body
	const point_count = 10;
	let point_lerp_step = .7
	const spring = 0.015;
	const friction = 0.9;
	import {
	  Polyline,
	  Renderer,
	  Transform,
	  Geometry,
	  Program,
	  Mesh,
	  Vec3,
	  Vec2,
	  Color
	} from "https://cdn.jsdelivr.net/npm/ogl@0.0.86/src/index.mjs";

	const vertex = `
		  attribute vec3 position;
		  attribute vec3 next;
		  attribute vec3 prev;
		  attribute vec2 uv;
		  attribute float side;

		  uniform vec2 uResolution;
		  uniform float uDPR;
		  uniform float uThickness;

		  vec4 getPosition() {
			  vec2 aspect = vec2(uResolution.x / uResolution.y, 1);
			  vec2 nextScreen = next.xy * aspect;
			  vec2 prevScreen = prev.xy * aspect;

			  vec2 tangent = normalize(nextScreen - prevScreen);
			  vec2 normal = vec2(-tangent.y, tangent.x);
			  normal /= aspect;
			  normal *= 1.0 - pow(abs(uv.y - 0.5) * 2.0, 2.0);

			  float pixelWidth = 1.0 / (uResolution.y / uDPR);
			  normal *= pixelWidth * uThickness;

			  // When the points are on top of each other, shrink the line to avoid artifacts.
			  float dist = length(nextScreen - prevScreen);
			  normal *= smoothstep(-0.1, 0.3, dist);

			  vec4 current = vec4(position, 1);
			  current.xy -= normal * side;
			  return current;
		  }

		  void main() {
			  gl_Position = getPosition();
		  }
	  `;

	{
	  const renderer = new Renderer({ dpr });
	  const gl = renderer.gl;
	  el.appendChild(gl.canvas);
	  gl.canvas.classList.add(...classNames)
	  gl.clearColor(...clear_rgba);

	  const scene = new Transform();

	  let polyline;

	  function resize() {
		renderer.setSize(window.innerWidth, window.innerHeight);
		if (polyline) polyline.resize();
	  }
	  window.addEventListener("resize", resize, false);


	  const mouseVelocity = new Vec3();

	  // Create an array of Vec3s (eg [[0, 0, 0], ...])

	  const points = [];
	  for (let i = 0; i < point_count; i++) points.push(new Vec3());

	  polyline = new Polyline(gl, {
		points,
		vertex,
		uniforms: {
		  uColor: { value: new Color(line_color) },
		  uThickness: { value: line_thikness }
		}
	  });

	  polyline.mesh.setParent(scene);

	  // Call initial resize after creating the polylines
	  resize();

	  // Add handlers to get mouse position
	  const mouse = new Vec3();
	  if ("ontouchstart" in window) {
		window.addEventListener("touchstart", updateMouse, {passive:true});
		window.addEventListener("touchmove", updateMouse, {passive:true});
	  } else {
		window.addEventListener("mousemove", updateMouse, {passive:true});
	  }

	  function updateMouse(e) {
		if (e.changedTouches && e.changedTouches.length) {
		  e.x = e.changedTouches[0].pageX;
		  e.y = e.changedTouches[0].pageY;
		}
		if (e.x === undefined) {
		  e.x = e.pageX;
		  e.y = e.pageY;
		}

		// Get mouse value in -1 to 1 range, with y flipped
		mouse.set(
		  (e.x / gl.renderer.width) * 2 - 1,
		  (e.y / gl.renderer.height) * -2 + 1,
		  0
		);
	  }

	  const tmp = new Vec3();

	  requestAnimationFrame(update);
	  function update(t) {
		requestAnimationFrame(update);

		// Update polyline input points
		for (let i = points.length - 1; i >= 0; i--) {
		  if (!i) {
			// For the first point, spring ease it to the mouse position
			tmp
			  .copy(mouse)
			  .sub(points[i])
			  .multiply(spring);
			mouseVelocity.add(tmp).multiply(friction);
			points[i].add(mouseVelocity);
		  } else {
			// The rest of the points ease to the point in front of them, making a line
			points[i].lerp(points[i - 1], point_lerp_step);
		  }
		}
		polyline.updateGeometry();

		renderer.render({ scene });
	  }
	}