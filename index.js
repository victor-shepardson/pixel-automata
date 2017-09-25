const regl = require('regl')()
const mouse = require('mouse-change')()

const pixels = regl.texture()

const drawFeedback = regl({
  frag: `
  precision mediump float;
  uniform sampler2D texture;
  uniform vec2 mouse;
  uniform float t;
  const float pi = 3.14159;
  varying vec2 uv;
  vec2 displace(vec3 c){
    return c.rg*c.b*1./3.;
  }
  void main () {
    float dist = length(gl_FragCoord.xy - mouse);
    vec3 d = exp(-uv.r*vec3(1., 2., 3.));//min(exp(-dist*vec3(1e-3, 1.5e-3, 2e-3)), 1.);
    vec3 c0 = texture2D(texture, uv).rgb;
    vec3 c = c0-0.5;
    c = (c+texture2D(texture, fract(uv+displace(c.rgb))).rgb-0.5);
    c = (c+texture2D(texture, fract(uv+displace(c.gbr))).rgb-0.5);
    c = (c+texture2D(texture, fract(uv+displace(c.brg))).rgb-0.5);
    c = (c+texture2D(texture, fract(uv+displace(c.rbg))).rgb-0.5);
    c = (c+texture2D(texture, fract(uv+displace(c.grb))).rgb-0.5);
    c = (c+texture2D(texture, fract(uv+displace(c.bgr))).rgb-0.5);
    gl_FragColor = vec4(mix(c0, fract(c.gbr+d), exp(-2.3-1.2*sin(2.*pi*t/20.))),1.);//0.5*min(exp(-dist*1e-2), 1.)), 1.);
  }`,

  vert: `
  precision mediump float;
  attribute vec2 position;
  varying vec2 uv;
  void main () {
    uv = position;
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
    t: ({tick}) => 0.01 * tick
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
