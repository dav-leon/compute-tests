// Import libraries
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.137.5/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.137.5/examples/jsm/controls/OrbitControls.js";
import rhino3dm from "https://cdn.jsdelivr.net/npm/rhino3dm@7.11.1/rhino3dm.module.js";
import { RhinoCompute } from "https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js";
import { Rhino3dmLoader } from "https://cdn.jsdelivr.net/npm/three@0.137.5/examples/jsm/loaders/3DMLoader.js";



const definitionName = "test.gh";

const count_slider = document.getElementById("count");
count_slider.addEventListener("mouseup", onSliderChange, false);
count_slider.addEventListener("touchend", onSliderChange, false);

const loader = new Rhino3dmLoader();
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/");

let rhino, definition, doc;
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

  //RhinoCompute.url = "http://localhost:8081/"; //debugging locally.
  RhinoCompute.url = 'https://macad2021.compute.rhino3d.com/'
  RhinoCompute.apiKey = getAuth( 'RHINO_COMPUTE_KEY' )  // RhinoCompute server api key. Leave blank if debugging locally.


  const url = definitionName;
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const arr = new Uint8Array(buffer);
  definition = arr;

  init();
  compute();
});


async function compute() {

  const param1 = new RhinoCompute.Grasshopper.DataTree("Count");
  param1.append([0], [count_slider.valueAsNumber]);

  // clear values
  const trees = [];
  trees.push(param1);


  const res = await RhinoCompute.Grasshopper.evaluateDefinition(
    definition,
    trees
  );


  doc = new rhino.File3dm();

  document.getElementById("loader").style.display = "none";

  for (let i = 0; i < res.values.length; i++) {
    for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
      for (const d of value) {
        const data = JSON.parse(d.data);
        const rhinoObject = rhino.CommonObject.decode(data);

        doc.objects().add(rhinoObject, null);      }
    }
  }



  // //transfer geometry userstring to object attribute for some objects
  // let objects = doc.objects();
  // for ( let i = 0; i < objects.count; i++ ) {
  //   const rhinoObject = objects.get( i );

  //   if ( rhinoObject.geometry().userStringCount > 0 ) {
  //     const g_userStrings = rhinoObject.geometry().getUserStrings()
  //     if( g_userStrings[0][0] == "geo") {
  //       rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
  //     }
  //   }
  // }


  scene.traverse((child) => {
    if (!child.isLight) {
      scene.remove(child);
    }
  });

  const buffer = new Uint8Array(doc.toByteArray()).buffer;
  loader.parse(buffer, function (object) {
    

    // go through all objects, check for userstrings and assing colors

    object.traverse((child) => {

      if(child.isLine){
        //console.log(child)
        console.log(child.userData.attributes.geometry.userStrings)


        if (child.userData.attributes.geometry.userStringCount > 0) {
          
            //get color from userStrings
            const colorData = child.userData.attributes.geometry.uerStrings[0]
            const col = colorData[1];

            //convert color from userstring to THREE color and assign it
            const threeColor = new THREE.Color("rgb(" + col + ")");
            const mat = new THREE.LineBasicMaterial({ color: threeColor });
            child.material = mat;
          
        }

    }

    });

    ///////////////////////////////////////////////////////////////////////
    // add object graph from rhino model to three.js scene
    scene.add(object);

  });
}

function onSliderChange() {
  // show spinner
  document.getElementById("loader").style.display = "block";
  compute();
}


// THREE BOILERPLATE //
let scene, camera, renderer, controls;

function init() {
  // create a scene and a camera
  scene = new THREE.Scene();
  scene.background = new THREE.Color(1, 1, 1);
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = -30;

  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement);

  // add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.intensity = 2;
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  animate();
}

function meshToThreejs(mesh, material) {
  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(mesh.toThreejsJSON());
  return new THREE.Mesh(geometry, material);
}

function getAuth( key ) {
  let value = localStorage[key]
  if ( value === undefined ) {
      const prompt = key.includes('URL') ? 'Server URL' : 'Server API Key'
      value = window.prompt('RhinoCompute ' + prompt)
      if ( value !== null ) {
          localStorage.setItem( key, value )
      }
  }
  return value
}