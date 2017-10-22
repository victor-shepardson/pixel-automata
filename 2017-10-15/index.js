const regl = require('regl')({
  // extensions:['OES_texture_float']
});
const mouse = require('mouse-change')();

const pixels = regl.texture({
  // type:'float32'
  min: 'linear',
  mag: 'linear'
});

const drawFeedback = regl({
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
  vec3 weird_filter(vec2 uv, float d){
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
    vec3 sigma = sqrt(d_e+d_w+d_n+d_s)/3.;
    return (samp(uv)-mu)*(sigma*1.5+.5)+mu;
  }
  vec3 color_mid2min_broken(vec3 x){
    // (for nonnegative x) adds mid to max channel and zeros mid channel
    // but actually no
    for(int i=0;i<3;i++){
      if(x.r > x.g && x.r > x.b){
        if(x.g < x.b){
          x.g+=x.b;
          x.b=0.;
        } else {
          x.b+=x.g;
          x.g=0.;
        }
      }
      x = x.grb;
    }
    return x;
  }
  vec3 color_mid2min(vec3 x){
    // (for nonnegative x) adds mid to max channel and zeros mid channel
    vec3 t = x;
    for(int i=0;i<3;i++){
      if(t.r > t.g && t.r > t.b){
        if(t.g < t.b){
          x.g+=x.b;
          x.b=0.;
        } else {
          x.b+=x.g;
          x.g=0.;
        }
      }
      x = x.grb;
      t = t.grb;
    }
    return x;
  }
  void main () {
    float ff = 1.75; //
    float fb = -1.; //
    float fsv = 0.05; //
    float m = 0.005; //
    float octaves = (1.-cos(pi*t/100.))*.5; //1.0; //
    vec2 uv = gl_FragCoord.xy;
    vec3 sv = sin(vec3(1.,2.,1.)*pi*uv.yyx/size.yyx)-1.;
    vec3 c = vec3(0.); //(sv*.5+1.)*1.;
    if (t>.5){
      vec3 c0 = samp(uv);
      vec3 c1 = samp(uv+=pow(2.,c0.r*octaves)*cos(2.*pi*vec2(c0.g, c0.g+0.25)));
      vec3 c2 = weird_filter(uv, pow(2., c1.b*octaves)).gbr;
      vec3 c3 = fract(ff*c2 + fb*c1 + fsv*sv);
      vec3 c4 = color_mid2min_broken(c3);
      // vec3 c4 = color_mid2min(c3);
      c = mix(c1, c4, m);
    }
    gl_FragColor = vec4(c, 1.);
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
});

regl.frame(function () {
  regl.clear({
    color: [0, 0, 0, 1]
  })

  drawFeedback()

  pixels({
    copy: true
  })
});
