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
    vec3 src = 0.4*uv.y/size.y-exp(-dist*.5*vec3(2, 3, 1));
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
    gl_FragColor = vec4(
      mix(c1, fract(c.gbr+src), exp(-2.3-1.2*sin(2.*pi*t/20.))),
      1.);
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
    //size: ({viewportWidth, viewportHeight}) => [viewportWidth, viewportHeight]
    size: (context) => [context.viewportWidth, context.viewportHeight]
  },

  count: 3
})

const drawFeedback2 = regl({
  frag: `
  precision mediump float;
  uniform sampler2D texture;
  uniform vec2 mouse;
  uniform float t;
  uniform vec2 size;
  const float pi = 3.14159;
  vec3 samp(vec2 p){
    return texture2D(texture, fract(p/size)).rgb;
  }
  vec3 fourpt(vec2 uv, float d){
    const vec3 p = vec3(1.,-1.,0.);
    vec3 e = samp(uv+d*p.zx);
    vec3 w = samp(uv+d*p.zy);
    vec3 n = samp(uv+d*p.xz);
    vec3 s = samp(uv+d*p.yz);
    vec3 mu = (e+s+n+w)/4.;
    vec3 d_e = (e-mu)*(e-mu);
    vec3 d_w = (w-mu)*(w-mu);
    vec3 d_n = (n-mu)*(n-mu);
    vec3 d_s = (s-mu)*(s-mu);
    vec3 sigma = sqrt(d_e+d_w+d_n+d_s)/2.;
    return mu.gbr/(1.+sigma);
  }
  vec3 eightpt(vec2 uv, float d){
    const vec3 p = vec3(1.,-1.,0.);
    vec3 e = samp(uv+d*p.zx);
    vec3 w = samp(uv+d*p.zy);
    vec3 n = samp(uv+d*p.xz);
    vec3 s = samp(uv+d*p.yz);
    vec3 ne = samp(uv+d*p.xx);
    vec3 nw = samp(uv+d*p.xy);
    vec3 se = samp(uv+d*p.yx);
    vec3 sw = samp(uv+d*p.yy);
    vec3 mu = (e+s+n+w+ne+nw+se+sw)/8.;
    vec3 d_e = (e-mu)*(e-mu);
    vec3 d_w = (w-mu)*(w-mu);
    vec3 d_n = (n-mu)*(n-mu);
    vec3 d_s = (s-mu)*(s-mu);
    vec3 d_ne = (ne-mu)*(ne-mu);
    vec3 d_nw = (nw-mu)*(nw-mu);
    vec3 d_se = (se-mu)*(se-mu);
    vec3 d_sw = (sw-mu)*(sw-mu);
    vec3 sigma = sqrt((d_e+d_w+d_n+d_s+d_ne+d_nw+d_se+d_sw)/8.);
    return mu.gbr/(1.+sigma);
  }
  void main () {
    float octaves = (sin(pi*t/4.)+sin(pi*t/5.)+sin(pi*t/6.)+3.)/2.;
    vec2 uv = gl_FragCoord.xy;
    vec3 c0 = samp(uv);
    c0 = samp(uv+=pow(2.,c0.r*octaves)*cos(2.*pi*vec2(c0.g, c0.g+0.25)));
    vec3 c = eightpt(uv, pow(2., c0.b*octaves));
    c = fract(1.75*c - c0 + 0.07*sin(vec3(1.,2.,1.)*pi*uv.yyx/size.yyx));
    c = mix(c, c0, .9);
    gl_FragColor = vec4(
      c,
      1.);
  }`,

  vert: `
  precision mediump float;
  attribute vec2 position;
  void main () {
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
    size: (context) => [context.viewportWidth, context.viewportHeight]
  },

  count: 3
})

regl.frame(function () {
  regl.clear({
    color: [0, 0, 0, 1]
  })

  drawFeedback2()

  pixels({
    copy: true
  })
})
