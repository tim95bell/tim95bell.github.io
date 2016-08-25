"use strict;"
var gl, canvas;
var vertices, width, height;
var program;
var began = true;
var buttons;

var view = {
  MANDEL: 0,
  JULIA: 1,
  current: 0
};

var state = {
  NORMAL: 0,
  JULIA: 1,
  current: 0
};

var zoom = {
  in: true,
  // amount: 0.05
  amount: 0.2
};

var bottomLeft = {};
var pixelSize = {};
var julia = {};
var lerpAmount = {};

var mouse = {
  last: null,
  initial: null
};

function preventBubble(event){
  if (event.stopPropagation){
       event.stopPropagation();
   }
   else if(window.event){
      window.event.cancelBubble=true;
   }
}

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");
    buttons = document.getElementsByClassName("btn");
    buttons = {
      reset: document.getElementById("resetBtn"),
      plus: document.getElementById("zoomInBtn"),
      minus: document.getElementById("zoomOutBtn"),
      mandel: document.getElementById("mandelBtn"),
      julia: document.getElementById("juliaBtn"),
      currentView: document.getElementById("currentView"),
      currentAction: document.getElementById("currentAction"),
      currentViewImage: document.getElementById("currentViewImage"),
      currentActionImage: document.getElementById("currentActionImage")
    };
    buttons.mandel.style.display = "none";
    buttons.plus.style.display = "none";

    canvas.addEventListener("touchstart", touchStart, false);
    canvas.addEventListener("touchend", touchEnd, false);
    canvas.addEventListener("touchmove", touchMove, false);

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // size window
    canvas.width = width = window.innerWidth;
    canvas.height = height = window.innerHeight;

    // set uniform vals
    julia.val = vec2(-3.0, 0.0);
    julia.originalVal = vec2(julia.val);
    lerpAmount.val = lerpAmount.originalVal = 1.0;
    lerpAmount.add = 0.005;
    pixelSize.val = pixelSize.originalVal = width < height ? 6.0/width : 6.0/height;
    bottomLeft.val = vec2(-width/2*pixelSize.val, -height/2*pixelSize.val);
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
    //gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
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
  canvas.height = height = window.innerHeight;
  pixelSize.val = pixelSize.originalVal = width < height ? 4.0/width : 4.0/height;

  //calc button sizes

  bottomLeft.val[0] = oldCenter[0] - (width/2*pixelSize.val);
  bottomLeft.val[1] = oldCenter[1] - (height/2*pixelSize.val);
  bottomLeft.originalVal = vec2(bottomLeft.val);

  gl.viewport(0, 0, width, height);

  //send info to gpu
  gl.uniform2fv(bottomLeft.loc, flatten(bottomLeft.val));
  gl.uniform1f(pixelSize.loc, pixelSize.val);

  if(began)
    render();
}

// Button handlers
function mandelBtn(){
  buttons.currentViewImage.src = "icons/mandelView.png";
  buttons.mandel.style.display = "none";
  view.current = view.MANDEL;
  state.current = state.NORMAL;
  render();
  event.stopPropagation();
}

function juliaBtn(){
  if(state.current === state.JULIA){
      buttons.reset.style.display = buttons.currentAction.style.display = buttons.currentView.style.display = buttons.mandel.style.display = "";
      buttons.julia.src = "icons/juliaView.png";
      buttons.julia.style.background = "#fff";
      buttons.julia.style.borderColor = "#000";
      if(view.current === view.MANDEL)
        buttons.mandel.style.display = "none";
      else
        buttons.mandel.style.display = "";
      if(zoom.in){
        buttons.plus.style.display = "none";
        buttons.minus.style.display = "";
      }
      else{
        buttons.minus.style.display = "none";
        buttons.plus.style.display = "";
      }
      state.current = state.NORMAL;
  }
  else{
    buttons.plus.style.display = buttons.minus.style.display = buttons.reset.style.display = buttons.currentAction.style.display = buttons.currentView.style.display = buttons.mandel.style.display = "none";
    buttons.julia.src = "icons/juliaViewInvert.png";
    buttons.julia.style.background = "#000";
    buttons.julia.style.borderColor = "#fff";
    state.current = state.JULIA;
    render();
  }
  event.stopPropagation();
}

function resetBtn(){
  buttons.plus.style.display = buttons.mandel.style.display = "none";
  buttons.minus.style.display = "";
  buttons.currentActionImage.src = "icons/plusWhite.png";
  buttons.currentViewImage.src = "icons/mandelView.png";

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
  event.stopPropagation();
}

function zoomInBtn(){
  buttons.plus.style.display = "none";
  buttons.minus.style.display = "";
  buttons.currentActionImage.src = "icons/plusWhite.png";
  zoom.in = true;
  state.current = state.NORMAL;
  event.stopPropagation();
}

function zoomOutBtn(){
  buttons.minus.style.display = "none";
  buttons.plus.style.display = "";
  buttons.currentActionImage.src = "icons/minusWhite.png";
  zoom.in = false;
  state.current = state.NORMAL;
  event.stopPropagation();
}

////////////////////////////////////////////////////////////////////////
//////////// Touch and Mouse
////////////////////////////////////////////////////////////////////////


// Generic input
function inputClicked(x, y){
  if(x > width || y > height || x < 0 || y < 0 || !began)
    return;

  // loc in mandel space
  var loc = vec2( bottomLeft.val[0] + x*pixelSize.val, bottomLeft.val[1] + y*pixelSize.val );

  if(mouse.initial === null)
    return;
  var mouseMoved = (x === mouse.initial[0]  &&  y === mouse.initial[1]);

  // NORMAL
  if(mouseMoved  &&  state.current === state.NORMAL){

    pixelSize.val = zoom.in ?
      pixelSize.val - pixelSize.val * zoom.amount :
      pixelSize.val + pixelSize.val * zoom.amount;

    bottomLeft.val[0] = loc[0] - x*pixelSize.val;
    bottomLeft.val[1] = loc[1] - y*pixelSize.val;

    gl.uniform2fv(bottomLeft.loc, flatten(bottomLeft.val));
    gl.uniform1f(pixelSize.loc, pixelSize.val);

  }

  // JULIASCAN
  else if(mouseMoved  &&  state.current === state.JULIA){
    julia.val = loc;
    state.current = state.NORMAL;
    view.current = view.JULIA;
    gl.uniform2fv(julia.loc, flatten(julia.val));

    buttons.reset.style.display = buttons.currentAction.style.display = buttons.currentView.style.display = buttons.mandel.style.display = "";
    buttons.currentViewImage.src = "icons/juliaViewInvert.png";
    buttons.julia.src = "icons/juliaView.png";
    buttons.julia.style.background = "#fff";
    buttons.julia.style.borderColor = "#000";
    if(zoom.in){
      buttons.plus.style.display = "none";
      buttons.minus.style.display = "";
    }
    else{
      buttons.minus.style.display = "none";
      buttons.plus.style.display = "";
    }


  }

  mouse.last = null;

  render();
}

function inputDown(x, y){
  if(x > width || y > height || x < 0 || y < 0 || !began)
    return;

  mouse.last = mouse.initial = vec2(x, y);
}

function inputMoved(x, y){
  if(!began)
    return;

    // if(state.current === state.JULIA){
    //   julia.val[0] = bottomLeft.val[0]+x*pixelSize.val;
    //   julia.val[1] = bottomLeft.val[1]+y*pixelSize.val;
    //   gl.uniform2fv(julia.loc, julia.val);
    //   render();
    //   return;
    // }

    if(mouse.last === null)
      return;

     var mouseLoc = vec2(x, y);
     var dif = subtract(mouse.last, mouseLoc);
     bottomLeft.val[0] += dif[0]*pixelSize.val;
     bottomLeft.val[1] += dif[1]*pixelSize.val;
     gl.uniform2fv(bottomLeft.loc, flatten(bottomLeft.val));

    mouse.last = mouseLoc;
    render();
}

// MOUSE
window.onmousedown = function(){
  inputDown(event.clientX, height-event.clientY);
};

window.onmousemove = function(){
  inputMoved(event.clientX, height-event.clientY);

  mouse.current = vec2(event.clientX, height-event.clientY);
};

window.onclick = function(){
  inputClicked(event.clientX, height-event.clientY);
};

// TOUCH
function touchStart(evt){
  var touches = evt.changedTouches;
  var touch = touches[0];

  var x = touch.clientX;
  var y = height-touch.clientY;

  inputDown(x, y);
}

function touchEnd(evt){
  var touches = evt.changedTouches;
  var touch = touches[0];

  var x = touch.clientX;
  var y = height-touch.clientY;

  mouse.last = null;
//  inputClicked(x, y);
}

function touchMove(evt){
  var touches = evt.changedTouches;
  var touch = touches[0];

  var x = touch.clientX;
  var y = height-touch.clientY;

  inputMoved(x, y);
}
