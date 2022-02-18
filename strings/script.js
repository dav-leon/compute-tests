// Import libraries
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js";
import rhino3dm from "https://cdn.jsdelivr.net/npm/rhino3dm@7.11.1/rhino3dm.module.js";
import { RhinoCompute } from "https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js";
import { Rhino3dmLoader } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js";

const definitionName = "strings.gh";

const input = document.querySelector('input');
const submitButton = document.querySelector('button');
let  log = document.getElementById('values');
submitButton.addEventListener('click', submitText);

let input_string;

//console.log(input_string)


function submitText(){
    input_string = input.value
    log.innerHTML = input_string
    input.value = "";
    compute();
};





const loader = new Rhino3dmLoader();
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/");

let rhino, definition, doc;
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

 RhinoCompute.url = "http://localhost:8081/"; //debugging locally.


  const url = definitionName;
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const arr = new Uint8Array(buffer);
  definition = arr;

});


async function compute() {

  const param1 = new RhinoCompute.Grasshopper.DataTree("Path");
  console.log(typeof input_string)
  param1.append([0], [input_string]);

  // clear values
  const trees = [];
  trees.push(param1);


  const res = await RhinoCompute.Grasshopper.evaluateDefinition(
    definition,
    trees
  );
  
  console.log(res)

  for (let i = 0; i < res.values.length; i++) {
    for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
      for (const d of value) {
        const data = JSON.parse(d.data);
        console.log(data)
        //const rhinoObject = rhino.CommonObject.decode(data);
        //doc.objects().add(rhinoObject, null);      }
    }
  }

}


