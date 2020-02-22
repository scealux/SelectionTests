//IMPORTS
import $ from "jquery";
import * as THREE from "three";
import {
  CSS2DRenderer,
  CSS2DObject
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { TimelineMax } from "gsap";

const OrbitControls = require("three-orbit-controls")(THREE);

//GLOBAL VARIABLES ----------------------------------------------------------------
var scene, renderer, camera, control;
var bldgs = [];

function building(x1, y1, x2, y2, x3, y3, x4, y4, id, height) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
  this.x3 = x3;
  this.y3 = y3;
  this.x4 = x4;
  this.y4 = y4;
  this.id = id;
  this.height = height;
}

var geoData = [];

var sca = 1000; //Scaler for map coordinates

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

//Setup ThreeJS Scene
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
); //FOV, Aspect Ratio, Close Plane, Far Plane

camera.position.z = 10;
camera.position.y = 5;
camera.rotation.x = -Math.PI / 14;

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor("#e5e5e5");
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

var labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = 0;
document.body.appendChild(labelRenderer.domElement);

control = new OrbitControls(camera, labelRenderer.domElement);

control.enableDamping = true;
control.dampingFactor = 0.1;
control.minPolarAngle = 0.5;
control.maxPolarAngle = 1.5;
control.enableKeys = true;
control.rotateSpeed = 0.05;
control.zoomSpeed = 1;
control.minDistance = 7;
control.maxDistance = 15;

var ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

var dirLight = new THREE.DirectionalLight(0xffffff, 0.8, 18);
dirLight.position.set(-3, 6, -3);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 25;

dirLight.shadow.mapSize.width = 3000;
dirLight.shadow.mapSize.height = 3000;

scene.add(dirLight);

var light = new THREE.PointLight(0xffffff, 0.2, 1000);
light.position.set(-3, 6, -3);
scene.add(light);

var material = new THREE.MeshPhongMaterial({ color: 0xf7f7f7 });
//material.side = THREE.DoubleSide;
var geometries = [];

//INIT ----------------------------------------------------------------------------
function init() {
  //Load GeoJSON Data
  $.getJSON("/src/json/cityTest.json", function(result) {
    console.log("JSON load begun");
    //console.log(result.features[0].geometry.coordinates);
    geoData = result.features[0].geometry.coordinates;
    console.log(geoData.length);
  })
    .done(function() {
      //console.log("JSON loaded sucessfully");
      setup();
    })
    .fail(function() {
      //console.log("There was an error loading the JSON");
    })
    .always(function() {
      //console.log("complete");
    });
}

function setup() {
  //Place floorplane
  var floorPlane = new THREE.PlaneGeometry(30, 30);
  floorPlane.computeFaceNormals();

  var floorPlaneMesh = new THREE.Mesh(floorPlane, material);
  floorPlaneMesh.name = "floor";
  floorPlaneMesh.receiveShadow = true;

  scene.add(floorPlaneMesh);
  floorPlaneMesh.rotateX(Math.PI / -2);

  //Fill bldgs array
  console.log("GeoJson -> bldgs[]");
  for (var i = 0; i < geoData.length; i++) {
    var c1, c2, c3, c4, c5, c6, c7, c8;
    //var testHeight = getRndNum(0, 3);

    //Add foundation coordinates from JSON info
    c1 = geoData[i][0][0][0] * sca;
    c2 = geoData[i][0][0][1] * sca;
    c3 = geoData[i][0][1][0] * sca;
    c4 = geoData[i][0][1][1] * sca;
    c5 = geoData[i][0][2][0] * sca;
    c6 = geoData[i][0][2][1] * sca;
    c7 = geoData[i][0][3][0] * sca;
    c8 = geoData[i][0][3][1] * sca;
    var newBld = new building(c1, c2, c3, c4, c5, c6, c7, c8, "test", 0.1);

    //Add building to buildings array and send the info to the addBuilding function
    bldgs.push(newBld);
    addBuilding(newBld, i);
  }
}

//Takes in max and min, returns a number between them
function getRndNum(min, max) {
  return Math.random() * (max - min) + min;
}

//Adds the specified building to the Three scene by creating custom geometry
function addBuilding(bld, numb) {
  //Create geometry of custom foundation
  var geometry = new THREE.Geometry();

  geometry.vertices.push(
    //Floor
    new THREE.Vector3(bldgs[numb].x1, 0, bldgs[numb].y1), //0
    new THREE.Vector3(bldgs[numb].x2, 0, bldgs[numb].y2), //1
    new THREE.Vector3(bldgs[numb].x3, 0, bldgs[numb].y3), //2
    new THREE.Vector3(bldgs[numb].x4, 0, bldgs[numb].y4), //3

    //Ceiling (Given starting height so they all scale the same)
    new THREE.Vector3(bldgs[numb].x1, 1, bldgs[numb].y1), //4
    new THREE.Vector3(bldgs[numb].x2, 1, bldgs[numb].y2), //5
    new THREE.Vector3(bldgs[numb].x3, 1, bldgs[numb].y3), //6
    new THREE.Vector3(bldgs[numb].x4, 1, bldgs[numb].y4) //7
  );

  geometry.faces.push(
    //Base (Don't see it: doesn't need to be shown)
    //new THREE.Face3(2, 1, 0),
    //new THREE.Face3(3, 2, 0),

    //Top
    new THREE.Face3(7, 5, 6),
    new THREE.Face3(4, 5, 7),
    //Front
    new THREE.Face3(3, 6, 2),
    new THREE.Face3(7, 6, 3),
    //Back
    new THREE.Face3(1, 4, 0),
    new THREE.Face3(5, 4, 1),
    //Left
    new THREE.Face3(4, 7, 3),
    new THREE.Face3(3, 0, 4),
    //Right
    new THREE.Face3(6, 5, 1),
    new THREE.Face3(6, 1, 2)
  );

  geometry.computeFaceNormals();
  //geometry.normalize();

  //console.log("Made it here");
  geometry.name = String("bldg" + numb);
  geometries.push(geometry);

  //geometries[numb]
  var newBldg = new THREE.Mesh(geometry, material);
  newBldg.userData = 0.1;
  //console.log("Building #" + numb + " height = " + bld.height);
  newBldg.name = String("bldg" + numb);

  newBldg.receiveShadow = true;
  newBldg.castShadow = true;

  var buildingDiv = document.createElement("div");
  buildingDiv.className = "label";
  buildingDiv.textContent = "Building!";
  buildingDiv.style.marginTop = "-1em";
  buildingDiv.hidden = true;
  var buildingLabel = new CSS2DObject(buildingDiv);

  buildingLabel.position.set(bldgs[numb].x1, 1, bldgs[numb].y1);
  newBldg.add(buildingLabel);

  scene.add(newBldg);

  //Scale AFTER adding, so they all scale the same
  newBldg.scale.y = getRndNum(1, 4) - 0.5;
  //console.log();
}

function animate() {
  requestAnimationFrame(animate);
  update();
  render();
}

function update() {
  control.update();
}

function render() {
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

//MOUSEMOVE FUNCTION -------------------------------------------------------------
window.addEventListener("click", onMouseClick);

function onMouseClick(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length != 0) {
    if (intersects[0].object.name != "floor") {
      this.tl = new TimelineMax();
      if (intersects[0].object.userData <= 5) {
        intersects[0].object.userData += 0.2;
      } else {
        intersects[0].object.userData = 0.1;
      }

      var height = intersects[0].object.userData;
      //console.log(intersects[0].object.name + " -> " + intersects[0].object.userData);

      //Raising
      this.tl.to(intersects[0].object.scale, 1, {
        y: [height],
        ease: "bounce.out"
      });
      intersects[0].object.children[0].element.hidden = false;
      console.log(intersects[0].object.children[0].element);
    }
  }
}
//WINDOW RESIZE --------------------------------------------------------------------
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();
  //control.update();
});

//RUN -----------------------------------------------------------------------------
init();
animate();
