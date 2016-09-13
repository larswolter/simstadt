import Building from './building.js';


var geometry;
var numGrounds = 0;
var MAX_GROUND = 2000;
var GROUND_TEXTURE_ITEM_COUNT = 32.0;
Game.groundInitDone = new ReactiveVar(false);

Meteor.startup(function () {

    _.extend(Game, {

        groundInit: function (scene) {
            Game.groundInitDone.set(false);
            let oldMesh = Game.scene.getObjectByName("Ground");
            if(oldMesh) {
                Game.scene.remove(oldMesh);
                oldMesh.geometry.dispose();
                oldMesh.geometry = null;
                oldMesh.material.dispose();
                oldMesh.material = null;
            }
            geometry = new THREE.BufferGeometry();
            geometry.dynamic = true;
            geometry.verticesNeedUpdate = true;
            var vertices = new Float32Array(MAX_GROUND * 4 * 3); // three components per vertex
            var uvs = new Float32Array(MAX_GROUND * 4 * 2); // two components per vertex
            var indices = new Uint32Array(MAX_GROUND * 6);
            geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            geometry.setIndex( new THREE.BufferAttribute(indices, 1));
            geometry.computeBoundingBox();
            //geometry.addDrawCall(0, 100, 0);
            var texture = THREE.ImageUtils.loadTexture("/groundAtlas.png");
            var material = new THREE.MeshLambertMaterial({
                color: 0xffffff,
                map: texture,
                transparent: true
            });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.name = "Ground";
            mesh.renderOrder = 1;
            scene.add(mesh);
            if(oldMesh)
                Game.groundInitDone.set(true);
            else
                Building.loadGeometries([
                    '/buildings/Einfamilienhaus.json',
                    '/buildings/Wohnhaus.json',
                    '/buildings/Hochhaus.json'
                ],undefined,()=>{
                    Game.groundInitDone.set(true);
                    console.log('Ground Init done!');                
                });
        },
        groundHeight: function (x,y) {
            let width = Game.terrainHeightData.get().width;
            let data = Game.terrainHeightData.get().data;
            return data[y * width + x];
        },
        groundClear: function() {
            var indices = geometry.getIndex().array;
            for(let i=0;i< indices.length;i++)
                indices[i] = 0;
            geometry.dynamic = true;
            geometry.getIndex().needsUpdate = true;
            numGrounds = 0;
        },
        groundAdd: function (x, y) {
            var offset = numGrounds;
            var width = Game.terrainHeightData.get().width;
            var data = Game.terrainHeightData.get().data;
            var vertices = [];
            vertices.push(
                x, y, data[y * width + x],
                x + 1, y, data[y * width + x + 1],
                x + 1, y + 1, data[(y + 1) * width + x + 1],
                x, y + 1, data[(y + 1) * width + x]
            );
            geometry.dynamic = true;
            var positions = geometry.getAttribute('position').array;
            var indices = geometry.getIndex().array;
            for (var d = numGrounds * 4 * 3, s = 0; s < vertices.length; d++, s++)
                positions[d] = vertices[s];
            indices[numGrounds * 6] = numGrounds * 4;
            indices[numGrounds * 6 + 1] = numGrounds * 4 + 1;
            indices[numGrounds * 6 + 2] = numGrounds * 4 + 3;
            indices[numGrounds * 6 + 3] = numGrounds * 4 + 3;
            indices[numGrounds * 6 + 4] = numGrounds * 4 + 1;
            indices[numGrounds * 6 + 5] = numGrounds * 4 + 2;
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            geometry.computeVertexNormals();
            geometry.getIndex().needsUpdate = true;
            geometry.getAttribute('position').needsUpdate = true;
            numGrounds++;
            return offset;
        },
        groundUpdate: function (offset, type, rotation) {

            var uvs = geometry.getAttribute('uv').array;
            var off = rotation * 2;
            var typeOff = type / GROUND_TEXTURE_ITEM_COUNT;
            uvs[offset * 4 * 2 + off % 8] = typeOff;
            uvs[offset * 4 * 2 + off % 8 + 1] = 0;
            uvs[offset * 4 * 2 + (off + 2) % 8] = typeOff + 1.0 / GROUND_TEXTURE_ITEM_COUNT - 1 / 2048.0;
            uvs[offset * 4 * 2 + (off + 2) % 8 + 1] = 0;
            uvs[offset * 4 * 2 + (off + 4) % 8] = typeOff + 1.0 / GROUND_TEXTURE_ITEM_COUNT - 1 / 2048.0;
            uvs[offset * 4 * 2 + (off + 4) % 8 + 1] = 1;
            uvs[offset * 4 * 2 + (off + 6) % 8] = typeOff;
            uvs[offset * 4 * 2 + (off + 6) % 8 + 1] = 1;
            geometry.getAttribute('uv').needsUpdate = true;
            //console.log(typeOff, 1.0 / GROUND_TEXTURE_ITEM_COUNT);
            //geometry.drawcalls[0].count = numGrounds * 6;
        }
    });
});