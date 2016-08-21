"use strict;"
var gl, canvas;
var vertices, width, height;
var program, programLine;
var began = false;
var buttons;

var view = {
  MANDEL: 0,
  JULIA: 1,
  current: 0
};

var state = {
  NORMAL: 0,
  JULIASCAN: 1,
  JULIAPOINT: 2,
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
// var colors = {};

var line;

var mouse = {
  last: null,
  initial: null
};

function calcLine(x, y){
  var size = 10;
  line = new Float32Array( size*2 );
  line[0] = x;
  line[1] = y;
  var c = vec2( bottomLeft.val[0] + x*pixelSize.val,
                bottomLeft.val[1] + y*pixelSize.val );
  var z = vec2(c);
  var newZ = vec2();

  for(var i = 1; i < size; ++i){
    newZ[0] = z[0]*z[0] + z[1]*z[1]*-1 + c[0];
    newZ[1] = z[0]*z[1] + z[1]*z[0] + c[1];
    z[0] = newZ[0];
    z[1] = newZ[1];

    var screenX = (x-bottomLeft.val[0])/pixelSize.val;
    var screenY = (y-bottomLeft.val[1])/pixelSize.val;
    line[i*2] = screenX;
    line[i*2+1] = screenY;
  }
}

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    canvas.addEventListener("touchstart", touchStart, false);
    canvas.addEventListener("touchend", touchEnd, false);
    canvas.addEventListener("touchmove", touchMove, false);

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // size window
    canvas.width = width = window.innerWidth;
    canvas.height = height = window.innerHeight * 0.95;

    //size buttons
    buttons = document.getElementsByClassName("btn");
    for(var i = 0; i < buttons.length; ++i)
      buttons[i].style.width = (width/7) + "px"

    // set uniform vals
    julia.val = vec2(-3.0, 0.0);
    julia.originalVal = vec2(julia.val);
    lerpAmount.val = lerpAmount.originalVal = 1.0;
    lerpAmount.add = 0.005;
    pixelSize.val = pixelSize.originalVal = width < height ? 6.0/width : 6.0/height;
    bottomLeft.val = vec2(-width/2*pixelSize.val, -height/2*pixelSize.val);
    bottomLeft.originalVal = vec2(bottomLeft.val);

    calcLine(width/2, height/2);

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
    // programLine = initShaders(gl, "vertex-shader-line", "fragment-shader-line");
    // gl.useProgram(programLine);
    //
    // var vBufferLine = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, vBufferLine);
    // gl.bufferData(gl.ARRAY_BUFFER, line, gl.STATIC_DRAW);
    //
    // vPositionLine = gl.getAttribLocation(programLine, "vPositionLine");
    // gl.vertexAttribPointer(vPositionLine, 2, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vPositionLine);



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
    // gl.uniform3fv(colors.loc, flatten(colors.val));
    gl.lineWidth(5.0);

    firstRender();
};

function Alert(head, body){
  this.draw = function(){
    var winW = width;
    var winH = height;
    var dialogoverlay = document.getElementById("dialogoverlay");
    var dialogbox = document.getElementById("dialogbox");
    dialogoverlay.style.display = "block";
    dialogoverlay.style.height = winH+"px";
    dialogbox.style.left = "10%";//((winW/2) - (550*0.5)) +"px"; // 550 is the box width
    dialogbox.style.top = "100px";
    dialogbox.style.display = "block";
    document.getElementById("dialogboxhead").innerHTML = head;
    document.getElementById("dialogboxbody").innerHTML = body;
    //document.getElementById("dialogboxfoot").innerHTML = "<button onclick=alertOk()>OK</button>";
    for(var i = 0; i < buttons.length; ++i){
      buttons[i].disabled = true;
    }
  }
}

function alertOk(){
  document.getElementById("dialogbox").style.display = "none";
  document.getElementById("dialogoverlay").style.display = "none";
  began = true;
  for(var i = 0; i < buttons.length; ++i){
    buttons[i].disabled = false;
  }
  render();
};

function firstRender(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);

  window.setTimeout(welcome, 100);
}

function welcome(){
  var alert = new Alert("Fractal Explorer",
  "<p>Move</p>---   drag mouse / finger.<br>"+
  "<p>Zoom</p>---    click mouse / tap finger.<br>"+
  "<p>Change Zoom Direction</p>---    press \"Zoom In\" or \"Zoom Out\" button.<br>"+
  "<p>View Mandelbrot Set</p>---    press \"MANDELBROT\" button.<br>"+
  "<p>View Julia Set for a specific point</p>---    press \"JULIA-POINT\" button, then click/tap the point on the screen.<br>"+
  "<p>View Julia Set for mouse location</p>---    press \"JULIA\" button, then move mouse / drag finger, around.<br>"+
  "<br><br>Press OK to continue..."
);
  alert.draw();
}


function render() {
    // gl.useProgram(program);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

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

    // gl.bindTexture(gl.TEXTURE_2D, textureOne);
    // gl.activateTexture(gl.TEXTURE0);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);

    if( (view.current === view.MANDEL && lerpAmount.val > 0) ||
        (view.current === view.JULIA && lerpAmount.val < 1) ){
      requestAnimFrame(render);
    }

    // gl.useProgram(programLine);
    // gl.bufferData(gl.ARRAY_BUFFER, line, gl.STATIC_DRAW);
    // gl.drawArrays(gl.LINE_STRIP, 0, line.length/2);
    // gl.useProgram(program);


}

function windowResize(){
  var oldCenter = vec2(bottomLeft.val[0] + width/2*pixelSize.val, bottomLeft.val[1] + height/2*pixelSize.val);
  canvas.width = width = window.innerWidth;
  canvas.height = height = window.innerHeight * 0.95;
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
  view.current = view.MANDEL;
  state.current = state.NORMAL;
  render();
}

function juliaBtn(){
  state.current = state.JULIAPOINT;
  view.current = view.JULIA;
  render();
}

function juliaPointBtn(){
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
  else if(mouseMoved  &&  state.current === state.JULIASCAN){
    julia.val = loc;
    state.current = state.NORMAL;
    view.current = view.JULIA;
    gl.uniform2fv(julia.loc, flatten(julia.val));
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

    if(state.current === state.JULIAPOINT){
      julia.val[0] = bottomLeft.val[0]+x*pixelSize.val;
      julia.val[1] = bottomLeft.val[1]+y*pixelSize.val;
      gl.uniform2fv(julia.loc, julia.val);
      render();
      return;
    }

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

  // calcLine(event.clientX, height-event.clientY);
};

window.onclick = function(){
  inputClicked(event.clientX, height-event.clientY);
};

// TOUCH
function touchStart(evt){
  evt.preventDefault();
  var touches = evt.changedTouches;
  var touch = touches[0];

  var x = touch.clientX;
  var y = height-touch.clientY;

  inputDown(x, y);
}

function touchEnd(evt){
  evt.preventDefault();
  var touches = evt.changedTouches;
  var touch = touches[0];

  var x = touch.clientX;
  var y = height-touch.clientY;

  inputClicked(x, y);
}

function touchMove(evt){
  evt.preventDefault();
  var touches = evt.changedTouches;
  var touch = touches[0];

  var x = touch.clientX;
  var y = height-touch.clientY;

  inputMoved(x, y);
}
