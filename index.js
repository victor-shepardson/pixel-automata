const regl = require('regl')()
const mouse = require('mouse-change')()

const pixels = regl.texture()

const drawFeedback = regl({
  frag: `
  precision mediump float;
  uniform sampler2D texture;
  uniform vec2 mouse;
  uniform float t;
  uniform vec2 size;
  const float pi = 3.14159;
  // varying vec2 uv;
  vec2 displace(vec3 c){
    return c.rg*exp(2.*(1.-c.b));
  }
  vec3 samp(vec2 p){
    return texture2D(texture, p/size).rgb;
  }
  void main () {
    vec2 uv = gl_FragCoord.xy;
    float dist = length(gl_FragCoord.xy - mouse)/size.y;
    vec3 src = 0.4*uv.y/size.y-exp(-dist*.5*vec3(2, 3, 1)); //exp(-uv.x/size.x*vec3(1., 1.5, 2.))-exp(-dist*vec3(2, 3, 1));
    vec3 px = vec3(1.,1.,0.);
    vec3 c0 = samp(uv);
    vec3 cb = (4.*c0
      + samp(uv+px.xz)
      + samp(uv-px.xz)
      + samp(uv+px.zy)
      + samp(uv-px.zy)
    )/8.;
    vec3 c = c0-0.5;
    float d = (1.+dist);
    c = (c+samp(uv+d*displace(c.rgb))-0.5);
    c = (c+samp(uv+d*displace(c.gbr))-0.5);
    c = (c+samp(uv+d*displace(c.brg))-0.5);
    c = (c+samp(uv+d*displace(c.rbg))-0.5);
    c = (c+samp(uv+d*displace(c.grb))-0.5);
    c = (c+samp(uv+d*displace(c.bgr))-0.5);
    vec3 c1 = mix(c0, cb, 0.1);
    gl_FragColor = vec4(mix(c1, fract(c.gbr+src), exp(-2.3-1.2*sin(2.*pi*t/20.))),1.);
  }`,

  vert: `
  precision mediump float;
  attribute vec2 position;
  // varying vec2 uv;
  void main () {
    // uv = position;
    gl_Position = vec4(2.0 * position - 1.0, 0, 1);
  }`,

  attributes: {
    position: [
      -2, 0,
      0, -2,
      2, 2]
  },

  uniforms: {
    texture: pixels,
    mouse: ({pixelRatio, viewportHeight}) => [
      mouse.x * pixelRatio,
      viewportHeight - mouse.y * pixelRatio
    ],
    t: ({tick}) => 0.01 * tick,
    // size: ({viewportWidth, viewportHeight}) => [viewportWidth, viewportHeight]
    size: (context) => [context.viewportWidth, context.viewportHeight]
  },

  count: 3
})

regl.frame(function () {
  regl.clear({
    color: [0, 0, 0, 1]
  })

  drawFeedback()

  pixels({
    copy: true
  })
})
