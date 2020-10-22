import Mouse from "../utils/mouse.js"
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
//import Stats from 'stats.js';
import seatModel from "../models/Seat.gltf"
import stairsModel from "../models/Stairs.gltf"
import seatTexture from "../textures/seat.png"
import stairsTexture from "../textures/stairs.png"
import { vec3 } from "gl-matrix";
import  * as d3 from "d3";
import dataCSV from "../data/data.csv"




export default class main { 
    constructor(){
// var stats = new Stats();
// stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild(stats.dom);

//SETUP
const canvas = document.querySelector('.main-canvas')
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('black', 0.004);
const camera = new THREE.PerspectiveCamera(20.4, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
const fontLoader = new THREE.FontLoader();
const gltfLoader = new GLTFLoader();
// const dracoLoader = new THREE.DRACOLoader();
// dracoLoader.setDecoderPath('../javascript/');
// dracoLoader.preload();
//gltfLoader.setDRACOLoader(dracoLoader);

const introScreen = document.getElementById("introScreen");

const movieData = document.getElementById("movieData");
const title = document.getElementById("title");
const releaseYear = document.getElementById("releaseYear");
const duration = document.getElementById("duration");
const rating = document.getElementById("rating");
const revenue = document.getElementById("revenue");
const website = document.getElementById("website");
const synopsis = document.getElementById("synopsis");

let spotIntensity = 0;
let spotMax = 3.0;
let spot = new THREE.SpotLight(0xffffff, spotIntensity, 0, Math.PI /8, 1.5, 150);
spot.castShadow = true;
scene.add(spot);
scene.add(spot.target);

let pLight = new THREE.PointLight(0x202020, 1.0);
pLight.decay = 2;
scene.add(pLight);

let time = 0;
let currentIndex = 0;
let currentMovie;
let chairs = new Array(400);
let maxRev = 0;
let started = false;

let camPos = new THREE.Vector3(0, -30, 285);
//camPos = new THREE.Vector3(800, -100, 0); //DEBUG CAMERA
//DATA
let data;
let dataLoad = d3.csv(dataCSV); //TYPE: PROMISE

dataLoad.then(function (loadedData) {
    data = loadedData;
    for (let i = 0; i < data.length; i++) {
        let movie = data[i];
        let rev = parseInt(movie.revenue);
        if (rev < 1) {
            data.splice(i, 1);
            i--;
        }
        if (rev > maxRev) {
            maxRev = rev;
        }
    }
    console.log(data.length + " movies loaded" + "\nEach Seat equals $" + maxRev/chairs.length);
    addAssets();
    update();
});




function addAssets() {
    console.log("loading assets")
    //createPlane();
    createChairs();
    createStairs();
    createDoors();
}

let titlePlane;
function createPlane() {
    let geometry = new THREE.PlaneBufferGeometry(10, 18, 1);
    let material = new THREE.MeshPhongMaterial({
        color: 0x000000,    // red (can also use a CSS color string here)
        flatShading: true,
        shininess: 0,
    });

    titlePlane = new THREE.Mesh(geometry, material);
    titlePlane.position.x = 0;
    titlePlane.position.y = 0;
    titlePlane.position.z = -1;
    
    scene.add(titlePlane);
    titlePlane.lookAt(camera.position);
    camera.lookAt(titlePlane.position);
}

function createChairs() {
    gltfLoader.load(
        seatModel,
        (gltf) => {
            let chair = gltf.scene.children[0];
            chair.castShadow = true;
            chair.rotateZ(Math.PI);
            var texture = new THREE.TextureLoader().load( seatTexture );
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            let mat = new THREE.MeshPhongMaterial( { 
                color: 0xa60303,
                //map: texture,
                transparent: true,
                flatShading: false,
                shininess: 0,
            } );
            chair.material = mat;
            let col = 28;
            let spacingX = 5.5;
            let spacingY = 2;
            let spacingZ = spacingY * 4;
            let gap = 10;
            let offsetX = 3;
            for (let i = 0; i < chairs.length; i++) {
                let c = chair.clone();
                c.name = "chair_" + i
                chairs[i] = c;
                scene.add(chairs[i]);
                chairs[i].scale.set(0.1, 0.1, 0.1);
                if (i < 8) {
                    chairs[i].position.x = (i % 8) * spacingX - 8 * spacingX / 2 + offsetX;
                    chairs[i].position.y = -100 - spacingY;
                    chairs[i].position.z = -10 + spacingZ;
                }
                else {
                    let xPlacement = ((i - 8) % col);
                    let g = 0;
                    if (xPlacement < 4)
                        g = -gap;
                    else if (xPlacement >= 24)
                        g = gap;

                        chairs[i].position.x = xPlacement * spacingX - col * spacingX / 2 + g + offsetX;
                        chairs[i].position.y = -100 + Math.floor((i - 8) / col) * spacingY;
                        chairs[i].position.z = -10 - Math.floor((i - 8) / col) * spacingZ;
                }
            }
        },
        (xhr) => {
            // called while loading is progressing
            //console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
        },
        (error) => {
            // called when loading has errors
            console.error('An error happened', error);
        },
    );


}

function createStairs() {
    gltfLoader.load(
        stairsModel,
        (gltf) => {
            //console.log(gltf);
            let stairs = gltf.scene.children[0];

            var texture = new THREE.TextureLoader().load( stairsTexture );
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            let mat = new THREE.MeshPhongMaterial({
                //map: texture,
                color: 0x101010 ,    // red (can also use a CSS color string here)
                flatShading: false,
                shininess: 20,
            });
            stairs.material = mat;
            stairs.rotateX(Math.PI * 2);
            stairs.rotateZ(Math.PI);
            stairs.position.y = -97;
            stairs.position.z = 0;
            stairs.scale.set(0.1, 0.1, 0.1);
            stairs.receiveShadow = true;
            scene.add(stairs);

        },
        (xhr) => {
            // called while loading is progressing
            //console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
        },
        (error) => {
            // called when loading has errors
            console.error('An error happened', error);
        },
    );


}

function createDoors() {
    let geometry = new THREE.PlaneBufferGeometry(10, 18, 1);
    let material = new THREE.MeshPhongMaterial({
        color: 0x050505,    // red (can also use a CSS color string here)
        flatShading: true,
        shininess: 15,
    });
    let door = new THREE.Mesh(geometry, material);
    door.position.x = 62;
    door.position.y = -71;
    door.position.z = -125;
    scene.add(door);

    geometry = new THREE.PlaneBufferGeometry(3, 0.6, 1);
    material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        flatShading: true,
        shininess: 0,
    });
    let doorLight = new THREE.Mesh(geometry, material);
    doorLight.position.x = door.position.x;
    doorLight.position.y = door.position.y + 11;
    doorLight.position.z = door.position.z;
    scene.add(doorLight);

    var pointLight1 = new THREE.PointLight(0x00ff00, 1.2, 100);
    pointLight1.position.x = doorLight.position.x;
    pointLight1.position.y = doorLight.position.y;
    pointLight1.position.z = doorLight.position.z + 1;
    scene.add(pointLight1);


    var pointLight2 = new THREE.PointLight(0x00ff00, 1.2, 100);
    pointLight2.position.x = -85;
    pointLight2.position.y = -90;
    pointLight2.position.z = 0;
    scene.add(pointLight2);
}

function loadMovie() {
    currentMovie = data[currentIndex];
    console.log(currentMovie);
    let rev = currentMovie.revenue;
    let amount = Math.floor(rev / maxRev * chairs.length);
    spotIntensity = 0.0;
    
    setTimeout(function(){ 
        chairs.forEach(chair => {
            if (chair == undefined) return;
            chair.visible = false;
        });
    
    
        let visible = getRandom(chairs, amount)
        visible.forEach(chair => {
            if (chair == undefined) return;
            chair.visible = true;
        });
        spotIntensity = spotMax;
        }, 600);

    updateText();
}

function getRandom(arr, n) {
    //console.log(arr);
    let result = new Array(n),
        len = arr.length,
        taken = new Array(arr.length);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        let x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

function updateText() {
    title.textContent = currentMovie.original_title;

    let tag = currentMovie.tagline;

    releaseYear.textContent = currentMovie.release_date;

    duration.textContent = currentMovie.runtime + " minutes";

    rating.textContent = currentMovie.vote_average + "/10"

    let rev = new Intl.NumberFormat('us-US', { style: 'currency', currency: 'USD' }).format(currentMovie.revenue).replaceAll("US", "");
    revenue.textContent = rev;

    let web = currentMovie.homepage;
    var protomatch = /^(https?|ftp):\/\//;
    web = web.replace(protomatch, '');
    website.textContent = web;
    website.href= currentMovie.homepage; 

    synopsis.textContent = currentMovie.overview;
}

function start(){
    started = true;
    spotIntensity = spotMax;
    loadMovie(currentIndex);
    introScreen.classList.add("fadeout");
    movieData.classList.add("fadein");

    setTimeout(function(){ 
    introScreen.style.opacity = "0%";
    movieData.style.opacity = "100%";
    }, 1000);


}


//UPDATE



let rotTarget = new THREE.Vector3(0,0,0);
let rotCurrent = new THREE.Vector3(0,0,0);
//camera.position.set(camPos);
function update() {
    requestAnimationFrame(update);
    renderer.render(scene, camera);
    if (!started) return;
    //stats.begin();
    camera.position.lerpVectors(camera.position, camPos, 0.03);
    let mouseX = Mouse.cursor[0];
    let mouseY = Mouse.cursor[1];
    rotTarget.set(camera.position.x + mouseX, camera.position.y - mouseY - 27, camera.position.z - 200);
    rotCurrent.lerp(rotTarget, 0.05);
    camera.lookAt(rotCurrent);
    spot.position.set(camera.position.x,camera.position.y+100,camera.position.z-50);
    spot.target.position.set(mouseX*50,-mouseY*20 - 40, mouseY*40);
    pLight.position.set(camera.position.x,camera.position.y,camera.position.z);
    time += 0.01;


    spot.intensity = lerp(spot.intensity, spotIntensity, 0.1);

    //stats.end();
}


function lerp(value1, value2, amount) {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
}


//EVENTS




document.addEventListener("keydown", event => {
    let code = event.keyCode;
    let cannotTrans = Math.abs(spotIntensity - spotMax) > 0.01 ? true : false;
    switch (code) {
        case 32:
            if (started) break;
            start();
            break;
        case 37:
            if (!started) break;
            if (cannotTrans) break;
            if (currentIndex == 0)
                currentIndex = data.length - 1;
            else
                currentIndex--;
            loadMovie();
            break;
        case 39:
            if (!started) break;
            if (cannotTrans) break;
            currentIndex = (currentIndex + 1) % data.length;
            loadMovie();
            break;
        case 82:
            currentIndex = Math.floor(Math.random()*data.length);
            loadMovie();
        default:
            break;
    }
});


window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio(window.devicePixelRatio);
});
    }
}

