// Copyright (c) 2024 by Made On Mars (https://codepen.io/made-on-mars/pen/OXKqXJ) with MIT
function getMat(color) {
  // our material is a phong material, with no shininess (highlight) and a black specular
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.9,
    transparent: true,
    opacity: 0,
    emissive: 0x270000,
    shading: THREE.FlatShading,
  });
}

var Colors = {
  red: 0xf85051,
  orange: 0xea8962,
  yellow: 0xdacf75,
  beige: 0xccc58f,
  grey: 0xbab7a1,
  blue: 0x4379a8,
  ocean: 0x4993a8,
  green: 0x24a99b,
};

var colorsLength = Object.keys(Colors).length;

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomColor() {
  var colIndx = Math.floor(Math.random() * colorsLength);
  var colorStr = Object.keys(Colors)[colIndx];
  return Colors[colorStr];
}

function shiftPosition(pos, radius) {
  if (Math.abs(pos) < radius) {
    if (pos >= 0) {
      return pos + radius;
    } else {
      return pos - radius;
    }
  } else {
    return pos;
  }
}

// Default parameters
var parameters = {
  minRadius: 30,
  maxRadius: 50,
  minSpeed: 0.015,
  maxSpeed: 0.025,
  particles: 500,
  minSize: 0.1,
  maxSize: 2,
};

// For a THREEJS project we need at least
// a scene
// a renderer
// a camera
// a light (1 or many)
// a mesh (an object to display)

var scene, renderer, camera, light;
var stars = [];
var nbPlanetsMax = 4;
var planets = [];
var WIDTH = window.innerWidth,
  HEIGHT = window.innerHeight;

// initialise the world
function initWorld() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 2000);
  camera.position.z = 100;

  //
  // THE RENDERER
  //
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;

  container = document.querySelector("div.universe");
  container.appendChild(renderer.domElement);

  // Lights
  ambientLight = new THREE.AmbientLight(0x663344, 2);
  scene.add(ambientLight);

  light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(200, 100, 200);
  light.castShadow = true;
  light.shadow.camera.left = -400;
  light.shadow.camera.right = 400;
  light.shadow.camera.top = 400;
  light.shadow.camera.bottom = -400;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 1000;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;

  scene.add(light);

  //
  // HANDLE SCREEN RESIZE
  //
  window.addEventListener("resize", handleWindowResize, false);

  // Creating firts planets
  for (var i = 0; i < nbPlanetsMax; i++) {
    planets.push(new Planet((-2000 / nbPlanetsMax) * i - 500));
  }
  addStarts();
  loop();
}

function animateStars(z) {
  // loop through each star
  for (var i = 0; i < stars.length; i++) {
    star = stars[i];
    // if the particle is too close move it to the back
    if (star.position.z > z) star.position.z -= 2000;
  }
}

function addStarts() {
  for (var z = -2000; z < 0; z += 20) {
    var geometry = new THREE.SphereGeometry(0.5, 32, 32);
    var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var sphere = new THREE.Mesh(geometry, material);

    sphere.position.x = randomRange(
      -1 * Math.floor(WIDTH / 2),
      Math.floor(WIDTH / 2)
    );
    sphere.position.y = randomRange(
      -1 * Math.floor(HEIGHT / 2),
      Math.floor(HEIGHT / 2)
    );

    // Then set the z position to where it is in the loop (distance of camera)
    sphere.position.z = z;

    // scale it up a bit
    sphere.scale.x = sphere.scale.y = 2;

    //add the sphere to the scene
    scene.add(sphere);

    //finally push it to the stars array
    stars.push(sphere);
  }
}

var Planet = function (z) {
  // the geometry of the planet is a tetrahedron
  this.planetRadius = randomRange(12, 30);
  var planetDetail = randomRange(2, 3);
  var geomPlanet = new THREE.TetrahedronGeometry(
    this.planetRadius,
    planetDetail
  );

  var noise = randomRange(1, 5);
  for (var i = 0; i < geomPlanet.vertices.length; i++) {
    var v = geomPlanet.vertices[i];
    v.x += -noise / 2 + Math.random() * noise;
    v.y += -noise / 2 + Math.random() * noise;
    v.z += -noise / 2 + Math.random() * noise;
  }

  // create a new material for the planet
  var color = getRandomColor();
  var matPlanet = getMat(color);
  // create the mesh of the planet
  this.planet = new THREE.Mesh(geomPlanet, matPlanet);

  this.ring = new THREE.Mesh();
  this.nParticles = 0;

  // create the particles to populate the ring
  this.updateParticlesCount();

  // Create a global mesh to hold the planet and the ring
  this.mesh = new THREE.Object3D();
  this.mesh.add(this.planet);
  this.mesh.add(this.ring);

  this.planet.castShadow = true;
  this.planet.receiveShadow = true;

  // update the position of the particles => must be moved to the loop
  this.mesh.rotation.x = (Math.random() * 2 - 1) * 2 * Math.PI;
  this.mesh.rotation.z = (Math.random() * 2 - 1) * 2 * Math.PI;

  var posX = randomRange(-1 * Math.floor(WIDTH / 4), Math.floor(WIDTH / 4));
  var posY = randomRange(-1 * Math.floor(HEIGHT / 4), Math.floor(HEIGHT / 4));
  posX = shiftPosition(posX, this.planetRadius);
  posY = shiftPosition(posY, this.planetRadius);

  this.mesh.position.set(posX, posY, z);
  scene.add(this.mesh);
};
Planet.prototype.destroy = function () {
  scene.remove(this.mesh);
};
Planet.prototype.updateParticlesCount = function () {
  var parameters = {
    minRadius: randomRange(this.planetRadius + 10, 60),
    maxRadius: randomRange(40, 70),
    minSpeed: randomRange(0, 5) * 0.1 + randomRange(0, 9) * 0.01,
    maxSpeed: randomRange(0, 5) * 0.1 + randomRange(0, 9) * 0.01,
    particles: randomRange(0, 1) * randomRange(20, 30),
    minSize: randomRange(1, 3) + randomRange(0, 9) * 0.1,
    maxSize: randomRange(1, 3) + randomRange(0, 9) * 0.1,
  };

  if (this.nParticles < parameters.particles) {
    // Remove particles
    for (var i = this.nParticles; i < parameters.particles; i++) {
      var p = new Particle();
      p.mesh.rotation.x = Math.random() * Math.PI;
      p.mesh.rotation.y = Math.random() * Math.PI;
      p.mesh.position.y = -2 + Math.random() * 4;
      this.ring.add(p.mesh);
    }
  } else {
    // add particles
    while (this.nParticles > parameters.particles) {
      var m = this.ring.children[this.nParticles - 1];
      this.ring.remove(m);
      m.userData.po = null;
      this.nParticles--;
    }
  }
  this.nParticles = parameters.particles;

  // We will give a specific angle to each particle
  // to cover the whole ring we need to
  // dispatch them regularly
  this.angleStep = (Math.PI * 2) / this.nParticles;
  this.updateParticlesDefiniton();
};

// Update particles definition
Planet.prototype.updateParticlesDefiniton = function () {
  for (var i = 0; i < this.nParticles; i++) {
    var m = this.ring.children[i];
    var s =
      parameters.minSize +
      Math.random() * (parameters.maxSize - parameters.minSize);
    m.scale.set(s, s, s);

    // set a random distance
    m.userData.distance =
      parameters.minRadius +
      Math.random() * (parameters.maxRadius - parameters.minRadius);

    // give a unique angle to each particle
    m.userData.angle = this.angleStep * i;
    // set a speed proportionally to the distance
    m.userData.angularSpeed = rule3(
      m.userData.distance,
      parameters.minRadius,
      parameters.maxRadius,
      parameters.minSpeed,
      parameters.maxSpeed
    );
  }
};

var Particle = function () {
  // Size of the particle, make it random
  var s = 1;

  // geometry of the particle, choose between different shapes
  var geom,
    random = Math.random();

  if (random < 0.25) {
    // Cube
    geom = new THREE.BoxGeometry(s, s, s);
  } else if (random < 0.5) {
    // Pyramid
    geom = new THREE.CylinderGeometry(0, s, s * 2, 4, 1);
  } else if (random < 0.75) {
    // potato shape
    geom = new THREE.TetrahedronGeometry(s, 2);
  } else {
    // thick plane
    geom = new THREE.BoxGeometry(s / 6, s, s); // thick plane
  }
  // color of the particle, make it random and get a material
  var color = getRandomColor();
  var mat = getMat(color);

  // create the mesh of the particle
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.receiveShadow = true;
  this.mesh.castShadow = true;
  this.mesh.userData.po = this;
};

// Update particles position
Planet.prototype.updateParticlesRotation = function () {
  // increase the rotation of each particle
  // and update its position

  for (var i = 0; i < this.nParticles; i++) {
    var m = this.ring.children[i];
    // increase the rotation angle around the planet
    m.userData.angle += m.userData.angularSpeed;

    // calculate the new position
    var posX = Math.cos(m.userData.angle) * m.userData.distance;
    var posZ = Math.sin(m.userData.angle) * m.userData.distance;
    m.position.x = posX;
    m.position.z = posZ;

    //*
    // add a local rotation to the particle
    m.rotation.x += Math.random() * 0.05;
    m.rotation.y += Math.random() * 0.05;
    m.rotation.z += Math.random() * 0.05;
    //*/
  }
};

function addPlanet(z) {
  planets.push(new Planet(z));
}

function loop() {
  var horizon = -2000 + camera.position.z;
  for (var i = 0; i < planets.length; i++) {
    if (planets[i].mesh.position.z > camera.position.z) {
      planets[i].destroy();
      planets.splice(i, 1);
    }

    // If the planet is arriving
    if (
      planets[i].mesh.position.z > horizon &&
      planets[i].planet.material.opacity < 1
    ) {
      planets[i].planet.material.opacity += 0.005;
      for (var j = 0; j < planets[i].mesh.children[1].children.length; j++) {
        planets[i].mesh.children[1].children[j].material.opacity += 0.005;
      }
    }
  }

  // Adding stars
  animateStars(camera.position.z);

  if (planets.length < nbPlanetsMax) {
    addPlanet(camera.position.z - 2000);
  }

  for (var i = 0; i < planets.length; i++) {
    planets[i].planet.rotation.y -= 0.01;
    planets[i].updateParticlesRotation();
  }

  camera.position.z -= 3;

  //
  // RENDER !
  //
  renderer.render(scene, camera);

  //
  // REQUEST A NEW FRAME
  //
  requestAnimationFrame(loop);
}

function handleWindowResize() {
  // Recalculate Width and Height as they had changed
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  // Update the renderer and the camera
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

initWorld();

function rule3(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}
