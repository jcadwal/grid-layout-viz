import { OrbitControls } from './scripts/OrbitControls.js';
import * as THREE from './scripts/three.module.js';

/*
- borderAssigs = [((x,y), imageidx, cost),((x,y), imageidx, cost),...]
- At each step, assig = min(borderAssigs, key=cost)
    - Remove assig from borderAssigs
    - Create new sprite with position (x,y) and image image
- For all neighbors of the assig, recompute optimal imageidx and update
  borderAssigs (or push if neighbor does not exist)
- optimalAssig(x,y)
- grid = {x1:{y1:imageidx1,y2:imageidx2, ...}, x2:{y1:imageidx1,y2:imageidx2, ...}, ...}
*/


async function Main(){




function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
}


function distance(a,b){
    let distance = 0.0
    for(let z = 0; z < a.length; z+=1){
        distance += Math.abs(parseInt(a[z]) - parseInt(b[z]))
    } 
    return distance    
}



const file = await fetch("./data/mnist/mnist_test.csv")
const text = await file.text()
const mnist = CSVToArray(text)
// loadfile.then(
//     function(response) {
//         response.text().then(function(text) {
//             await initialize(CSVToArray(text))
//         })
//     }
// )








const images = mnist.slice(1000,1500).map(row=>row.slice(1))
var imageIdxs = new Set(Array(images.length).keys())
// console.log(images)
//1. Precompute pairwise distances    
var distances = []   
for(let x = 0; x < images.length; x+=1){
    let rowdistances = []
    for(let y = 0; y < images.length; y+=1){
        rowdistances.push(distance(images[x], images[y]))        
    }
    distances.push(rowdistances)
}    

// console.log(distances)

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0,0,-17); // Set position like this
camera.lookAt(new THREE.Vector3(0,0,0)); // 
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls( camera, renderer.domElement );

scene.background = new THREE.Color("rgb(155, 155, 155)")
renderer.setSize( window.innerWidth, window.innerHeight );
// renderer.setSize( 1200, 800 );
document.body.appendChild( renderer.domElement );

/*
- potBorderAssigs = [((x,y), imageidx, cost),((x,y), imageidx, cost),...]
- At each step, assig = min(borderAssigs, key=cost)
    - Remove assig from borderAssigs
    - Create new sprite with position (x,y) and image image
- For all neighbors of the assig, recompute optimal imageidx and update
  borderAssigs (or push if neighbor does not exist)
- optimalAssig(x,y)
- grid = {x1:{y1:imageidx1,y2:imageidx2, ...}, x2:{y1:imageidx1,y2:imageidx2, ...}, ...}
*/

var border = {0:{0:{assig:0,cost:0}}} //potential border assigments
var grid = {}



function leastCostAssig(border){
    // console.log("lca ",JSON.stringify(border))
    let [x,y,c] = [0,0,Number.MAX_VALUE]
    for(let k of Object.keys(border)){
        k=parseInt(k)
        for(let kk of Object.keys(border[k])){
            kk=parseInt(kk)
            if(border[k][kk].cost<c){
                x = parseInt(k)
                y = parseInt(kk)
                c = border[k][kk].cost
            }
        }   
    }
    // console.log(x,y)
    return [x,y]
}



function neighbors(x,y){
    x=parseInt(x)
    y=parseInt(y)
    return [[x-1,y],[x+1,y],[x,y+1],[x,y-1]] //2d   
    // return [[x-1,y],[x+1,y],[x,y+1],[x,y-1],[x-1,y-1],[x+1,y+1],[x-1,y+1],[x+1,y-1]] //2d   
}

function unoccupiedNeighbors(x,y){
    x=parseInt(x)
    y=parseInt(y)
    let r = neighbors(x,y).filter(([nx,ny])=>!(grid.hasOwnProperty(nx) && grid[nx].hasOwnProperty(ny)))
    return r
}


function occupiedNeighbors(x,y){
    x=parseInt(x)
    y=parseInt(y)
    // console.log("occ ", x, y)
    let r = neighbors(x,y).filter(([nx,ny])=>(grid.hasOwnProperty(nx) && grid[nx].hasOwnProperty(ny)))     
    return r
}




function optimalAssig(x,y){
    x=parseInt(x)
    y=parseInt(y)
    // console.log("optimal: ",x,y)
    let [lowestCost, assig] = [Number.MAX_VALUE, -1]
    let occs = occupiedNeighbors(x,y).map(([a,b])=>grid[a][b].assig)
    // console.log("occs: ",occs)

    // console.log(imageIdxs)
    for(let imageIdx of imageIdxs){
        let cost = occs.reduce((c,ni)=>c+distances[imageIdx][ni],0)
        cost = cost / occs.length
        // console.log("cost",cost)
        if(cost < lowestCost){
            lowestCost = cost
            assig = imageIdx
        }
    }
    return [lowestCost, assig]
}


const spacer = 1; //pixel spacer

animate()

function animate(){    
    if(imageIdxs.size>0){
        let [x,y] = leastCostAssig(border)
        // console.log("lca: ",x,y,border)

        //remove lca from available images
        // console.log(x,y)
        imageIdxs.delete(border[x][y].assig)
        
        //add lca to grid 
        if(!grid.hasOwnProperty(x)){
            grid[x] = {}
        }
        if(!grid[x].hasOwnProperty(y)){
            grid[x][y] = {}
        }       
        grid[x][y] = {assig:border[x][y].assig, cost:border[x][y].cost}
        
        //remove lca from border        
        delete border[x][y]
        if(Object.keys(border[x]).length == 0) delete border[x]
        // console.log("border: ",JSON.stringify(border))
        // console.log("grid: ",JSON.stringify(grid))
        
        //update border elements that are neighbors of x,y
        for(let [nx, ny] of unoccupiedNeighbors(x,y)){
            // console.log("unocc n: ",x,y,nx,ny)
            let [cost,assig] = optimalAssig(nx,ny)
            // console.log("update neighbors: ,",nx,ny,cost,assig)
            if(!border.hasOwnProperty(nx)){
                border[nx] = {}
            }            
            border[nx][ny] = {cost:cost,assig:assig}
        }
        

        

        //update border elements that used the same assig
        for(let k of Object.keys(border)){
            k = parseInt(k)
            for(let kk of Object.keys(border[k])){
                kk = parseInt(kk)
                if(border[k][kk].assig == grid[x][y].assig){
                    let [cost,assig] = optimalAssig(k,kk)
                    border[k][kk] = {cost:cost,assig:assig}
                }
            }
        }

        
        // console.log("border: ",JSON.stringify(border))


        //handle graphics
        var image = images[grid[x][y].assig]
        var imageCanvas = document.createElement("canvas")
        imageCanvas.setAttribute("width","28px")
        imageCanvas.setAttribute("height","28px")
        var g = imageCanvas.getContext("2d")
        for (let i = 0; i < 28; i++) {
            for (let j = 0; j < 28; j++) {                        
                g.fillStyle = image[i*28 + j]==0 ? 
                                `rgba(0,0,0,0)` :
                                `rgba(${image[i*28 + j]},${image[i*28 + j]},${image[i*28 + j]},1)`
                g.fillRect(j,i,1,1)                    
            }                
        }
        let png = imageCanvas.toDataURL()
        // document.body.appendChild(imageCanvas)

        let map = new THREE.TextureLoader().load( png )
        // map.magFilter = THREE.NearestFilter
        // map.minFilter = THREE.NearestFilter
        let material = new THREE.SpriteMaterial( { map: map } );
        let sprite = new THREE.Sprite( material );
        sprite.position.x = x * spacer
        sprite.position.y = y * spacer
        sprite.position.z = 0                                      
        scene.add( sprite );

    }
    


    controls.update()
    renderer.render( scene, camera );
    requestAnimationFrame(animate)
}


}

Main()
            