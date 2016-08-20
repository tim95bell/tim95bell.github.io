"use strict;"
var gl, canvas;
var vertices, width, height;

var view = {
  MANDEL: 0,
  JULIA: 1,
  current: 0
};

var state = {
  NORMAL: 0,
  JULIASCAN: 1,
  current: 0
};

var zoom = {
  in: true,
  amount: 0.05
};

var bottomLeft = {};
var pixelSize = {};
var julia = {};
var lerpAmount = {};

var mouse = {
  last: null,
  initial: null
};


window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // size window
    canvas.width = width = window.innerWidth;
    canvas.height = height = window.innerHeight * 0.95;

    //size buttons
    var buttons = document.getElementsByClassName("btn");
    for(var i = 0; i < buttons.length; ++i)
      buttons[i].style.width = (width/7) + "px"

    // set uniform vals
    julia.val = vec2(0.0, 0.0);
    julia.originalVal = vec2(julia.val);
    lerpAmount.val = lerpAmount.originalVal = 1.0;
    lerpAmount.add = 0.005;
    pixelSize.val = pixelSize.originalVal = width < height ? 3.0/width : 3.0/height;
    bottomLeft.val = vec2(-0.5-width/2*pixelSize.val, -height/2*pixelSize.val);
    bottomLeft.originalVal = vec2(bottomLeft.val);

    //set vertices
    vertices = [
      vec2(-1.0, -1.0),
      vec2(1.0, -1.0),
      vec2(-1.0, 1.0),
      vec2(1.0, 1.0)
    ];

    //webgl
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  shaders
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // vBuffer and vPosition
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    // set uniform locs
    bottomLeft.loc = gl.getUniformLocation(program, "bottomLeft");
    pixelSize.loc = gl.getUniformLocation(program, "pixelSize");
    lerpAmount.loc = gl.getUniformLocation(program, "lerpAmount");
    julia.loc = gl.getUniformLocation(program, "julia");

    //  var textureOneImage = document.getElementById("textureOne");
    //  var textureOne = gl.createTexture();
    //  gl.bindTexture(gl.TEXTURE_2D, textureOne);
    //  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureOneImage);
    //  gl.bindTexture(gl.TEXTURE_2D, null);

    // send uniform values to gpu
    gl.uniform2fv(bottomLeft.loc, flatten(bottomLeft.val));
    gl.uniform1f(pixelSize.loc, pixelSize.val);
    gl.uniform1f(lerpAmount.loc, lerpAmount.val);
    gl.uniform2fv(julia.loc, flatten(julia.val));

    render();
};


function render() {
    if(view.current === view.MANDEL){
      if(lerpAmount.val > 0)
        lerpAmount.val -= lerpAmount.add;
        gl.uniform1f(lerpAmount.loc, lerpAmount.val);
    }
    else{
      if(lerpAmount.val < 1)
        lerpAmount.val += lerpAmount.add;
        gl.uniform1f(lerpAmount.loc, lerpAmount.val);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);

    if( (view.current === view.MANDEL && lerpAmount.val > 0) ||
        (view.current === view.JULIA && lerpAmount.val < 1) ){
      requestAnimFrame(render);
    }
}

function windowResize(){
  var oldCenter = vec2(bottomLeft.val[0] + width/2*pixelSize.val, bottomLeft.val[1] + height/2*pixelSize.val);
  canvas.width = width = window.innerWidth;
  canvas.height = height = window.innerHeight * 0.95;
  pixelSize.val = width < height ? 4.0/width : 4.0/height;

  //calc button sizes

  bottomLeft.val[0] = oldCenter[0] - (width/2*pixelSize.val);
  bottomLeft.val[1] = oldCenter[1] - (height/2*pixelSize.val);

  gl.viewport(0, 0, width, height);

  //send info to gpu
  gl.uniform2fv(bottomLeft.loc, flatten(bottomLeft.val));
  gl.uniform1f(pixelSize.loc, pixelSize.val);

  render();
}

// Button handlers
function mandelBtn(){
  view.current = view.MANDEL;
  state.current = state.NORMAL;
  render();
}

function juliaBtn(){
  state.current = state.JULIASCAN;
  render();
}

function resetBtn(){
  state.current = state.NORMAL;
  view.current = view.MANDEL;
  zoom.in = true;
  pixelSize.val = pixelSize.originalVal;
  lerpAmount.val = lerpAmount.originalVal;
  bottomLeft.val = vec2(bottomLeft.originalVal);
  julia.val = vec2(julia.originalVal);
  gl.uniform2fv(bottomLeft.loc, flatten(bottomLeft.val));
  gl.uniform1f(pixelSize.loc, pixelSize.val);
  gl.uniform1f(lerpAmount.loc, lerpAmount.val);
  gl.uniform2fv(julia.loc, flatten(julia.val));
  render();
}

function zoomInBtn(){
  zoom.in = true;
  state.current = state.NORMAL;
}

function zoomOutBtn(){
  zoom.in = false;
  state.current = state.NORMAL;
}

// Mouse handlers
window.onclick = function(){
  if(event.clientX > width || event.clientY > height)
    return;

  // x and y in pixel space
  var x = event.clientX;
  var y = height-event.clientY;
  // loc in mandel space
  var loc = vec2( bottomLeft.val[0] + x*pixelSize.val, bottomLeft.val[1] + y*pixelSize.val );

  // NORMAL
  if(x === mouse.initial[0] && y === mouse.initial[1] && // checking mouse hasnt moved, so we zoom not move
    state.current === state.NORMAL){

    pixelSize.val = zoom.in ?
      pixelSize.val - pixelSize.val * zoom.amount :
      pixelSize.val + pixelSize.val * zoom.amount;

    bottomLeft.val[0] = loc[0] - x*pixelSize.val;
    bottomLeft.val[1] = loc[1] - y*pixelSize.val;

    gl.uniform2fv(bottomLeft.loc, flatten(bottomLeft.val));
    gl.uniform1f(pixelSize.loc, pixelSize.val);

    // pixelSize *= 0.9;
    // bottomLeft[0] = loc[0] - x*pixelSize;
    // bottomLeft[1] = loc[1] - y*pixelSize;
  }
  // JULIASCAN
  else if(state.current === state.JULIASCAN){
    julia.val = loc;
    state.current = state.NORMAL;
    view.current = view.JULIA;
    gl.uniform2fv(julia.loc, flatten(julia.val));
  }

  render();
};

window.onmousedown = function(){
  if(event.clientX > width || event.clientY > height)
    return;

    mouse.last = mouse.initial = vec2(event.clientX, height-event.clientY);
};

window.onmousemove = function(){
  if(mouse.last === null)
    return;

   var mouseLoc = vec2(event.clientX, height-event.clientY);
   var dif = subtract(mouse.last, mouseLoc);
   bottomLeft.val[0] += dif[0]*pixelSize.val;
   bottomLeft.val[1] += dif[1]*pixelSize.val;
   gl.uniform2fv(bottomLeft.loc, flatten(bottomLeft.val));

  mouse.last = mouseLoc;
  render();
};

window.onmouseup = function(){
  mouse.last = null;
};
