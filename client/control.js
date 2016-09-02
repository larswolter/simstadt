var SCROLL_SPEED = 0.2;
var ZOOM_SPEED = 1;
var ROTATE_SPEED = 2;

import pepjs from 'pepjs';

var mousePosition = new ReactiveVar(new THREE.Vector2());
var viewCommands = new ReactiveVar({});
var cursorGeometry;
var activeField = new ReactiveVar({
    x: undefined,
    y: undefined
});

Meteor.startup(function () {

    _.extend(Game, {
        mousePos:mousePosition,
        initInteraction: function () {
            var lastPos = new THREE.Vector2();
            var lastTimestamp =0;
            var downPos = new THREE.Vector2();
            var downTimestamp=0;

            window.addEventListener('wheel', function (event) {
                
                Game.camDist.set(Math.max(5.0, Game.camDist.get() - ZOOM_SPEED * event.deltaY*(-0.005) * Game.camDist.get()));
                Game.camRotation.set(Game.camRotation.get() + ROTATE_SPEED * event.deltaX*0.005);
            });

            $('#view3d')[0].addEventListener('pointerdown', function (event) {
                if(!event.isPrimary)
                    return;
                downPos.x = -(event.clientX / window.innerWidth) * 2 - 1;
                downPos.y = (event.clientY / window.innerHeight) * 2 + 1;
                lastPos = downPos;
                downTimestamp = event.timeStamp;
            });
            $('#view3d')[0].addEventListener('pointerup', function (event) {
                if(!event.isPrimary)
                    return;
                if(event.timeStamp - downTimestamp > 250)
                    return;
                let curPos =    new THREE.Vector2();
                curPos.x = -(event.clientX / window.innerWidth) * 2 - 1;
                curPos.y = (event.clientY / window.innerHeight) * 2 + 1;
                if(Math.abs(curPos.x - downPos.x) > 0.1)
                    return;
                if(Math.abs(curPos.y - downPos.y) > 0.1)
                    return;
                if (activeField.get().y)
                    Game.clickOn(activeField.get().x, activeField.get().y);
            });
 
            $('#view3d')[0].addEventListener('pointermove', function (event) {
                
                let curPos =    new THREE.Vector2();
                curPos.x = -(event.clientX / window.innerWidth) * 2 - 1;
                curPos.y = (event.clientY / window.innerHeight) * 2 + 1;
                if(event.buttons) {
                    var side = new THREE.Vector3(curPos.x - lastPos.x, curPos.y - lastPos.y, 0);
                    side.applyAxisAngle(new THREE.Vector3(0, 0, 1), Game.camRotation.get());
                    side.multiplyScalar(SCROLL_SPEED * (event.timeStamp - lastTimestamp)*0.07 * Game.camDist.get());
                    var vec = Game.camLookAt.get();
                    vec.add(side);
                    Game.camLookAt.set(vec);
                }
                lastPos = curPos;
                lastTimestamp = event.timeStamp;
                if (Game.scene.getObjectByName("TerrainMesh")) {
                    // calculate mouse position in normalized device coordinates
                    // (-1 to +1) for both components
                    var mouse = new THREE.Vector2();
                    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                    mousePosition.set(mouse);
                    raycaster.setFromCamera(mousePosition.get(), Game.camera);
                    var octreeObjects = Game.terrainOctree.search(raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction);

                    var intersects = raycaster.intersectOctreeObjects(octreeObjects);
                    // calculate objects intersecting the picking ray
                    //var intersects = raycaster.intersectObject(scene.getObjectByName("TerrainMesh"));
                    if (intersects.length > 0) {
                        var x = Math.floor(intersects[0].point.x);
                        var y = Math.floor(intersects[0].point.y);
                        activeField.set({
                            x: x,
                            y: y
                        });
                        var data = Game.terrainHeightData.get().data;
                        var width = Game.terrainHeightData.get().width;

                        cursorGeometry.vertices[0].x = x;
                        cursorGeometry.vertices[0].y = y;
                        cursorGeometry.vertices[0].z = Math.max(0,data[y * width + x]);
                        cursorGeometry.vertices[1].x = x + 1;
                        cursorGeometry.vertices[1].y = y;
                        cursorGeometry.vertices[1].z = Math.max(0,data[y * width + x + 1]);
                        cursorGeometry.vertices[2].x = x;
                        cursorGeometry.vertices[2].y = y + 1;
                        cursorGeometry.vertices[2].z = Math.max(0,data[(y + 1) * width + x]);
                        cursorGeometry.vertices[3].x = x + 1;
                        cursorGeometry.vertices[3].y = y + 1;
                        cursorGeometry.vertices[3].z = Math.max(0,data[(y + 1) * width + x + 1]);
                        cursorGeometry.dynamic = true;
                        cursorGeometry.verticesNeedUpdate = true;
                        //Game.render();
                    } else {
                        activeField.set({
                            x: undefined,
                            y: undefined
                        });
                        for (var i = 0; i < 4; i++) {
                            cursorGeometry.vertices[i].x = 0;
                            cursorGeometry.vertices[i].y = 0;
                            cursorGeometry.vertices[i].z = 0;
                            cursorGeometry.dynamic = true;
                            cursorGeometry.verticesNeedUpdate = true;
                        }
                    }
                }
            }, false);
            window.addEventListener("keyup", keyEventHandler);
            window.addEventListener("keydown", keyEventHandler);
            cursorGeometry = new THREE.Geometry();
            cursorGeometry.dynamic = true;
            cursorGeometry.vertices.push(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0));
            cursorGeometry.faces.push(new THREE.Face3(0, 1, 2), new THREE.Face3(2, 1, 3));
            var material = new THREE.MeshLambertMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5
            });
            var mesh = new THREE.Mesh(cursorGeometry, material);
            mesh.name = "Cursor";
            mesh.renderOrder = 2;
            Game.scene.add(mesh);

        },
        updateControls: function (timeDiff) {
            if(!Game.camLookAt.get())
                return;
            var com = viewCommands.get();
            if (com.left || com.right) {
                var side = new THREE.Vector3(1, 0, 0);
                side.applyAxisAngle(new THREE.Vector3(0, 0, 1), Game.camRotation.get());
                side.multiplyScalar(SCROLL_SPEED * timeDiff * Game.camDist.get() * (com.left ? -1 : 1));
                var vec = Game.camLookAt.get();
                vec.add(side);
                Game.camLookAt.set(vec);
            }
            if (com.up || com.down) {
                var front = new THREE.Vector3(0, 1, 0);
                front.applyAxisAngle(new THREE.Vector3(0, 0, 1), Game.camRotation.get());
                front.multiplyScalar(SCROLL_SPEED * timeDiff * Game.camDist.get() * (com.down ? -1 : 1));
                var vec2 = Game.camLookAt.get();
                vec2.add(front);
                Game.camLookAt.set(vec2);
            }
            if (com.tiltup)
                Game.camTilt.set(Math.min(Math.PI / 2, Game.camTilt.get() + ROTATE_SPEED * timeDiff));
            else if (com.tiltdown)
                Game.camTilt.set(Math.max(Math.PI / 8, Game.camTilt.get() - ROTATE_SPEED * timeDiff));

            if (com.rotleft)
                Game.camRotation.set(Game.camRotation.get() + ROTATE_SPEED * timeDiff);
            else if (com.rotright)
                Game.camRotation.set(Game.camRotation.get() - ROTATE_SPEED * timeDiff);

            if (com.near)
                Game.camDist.set(Math.max(5.0, Game.camDist.get() - ZOOM_SPEED * timeDiff * Game.camDist.get()));
            else if (com.far)
                Game.camDist.set(Math.min(500.0, Game.camDist.get() + ZOOM_SPEED * timeDiff * Game.camDist.get()));
        }
    });/*
    window.addEventListener('click', function (event) {
        console.log(event);
        if (activeField.get().y)
            Game.clickOn(activeField.get().x, activeField.get().y);
    });*/
    var raycaster = new THREE.Raycaster();
    Tracker.autorun(function () {

    });
    Game.terrainOctree = new THREE.Octree({
        // uncomment below to see the octree (may kill the fps)
        //scene: scene,
        // when undeferred = true, objects are inserted immediately
        // instead of being deferred until next octree.update() call
        // this may decrease performance as it forces a matrix update
        undeferred: false,
        // set the max depth of tree
        depthMax: Infinity,
        // max number of objects before nodes split or merge
        objectsThreshold: 8,
        // percent between 0 and 1 that nodes will overlap each other
        // helps insert objects that lie over more than one node
        overlapPct: 0.15
    });
});

function keyEventHandler(e) {
    console.log(e.type);
    var value;
    if (e.type === "keydown")
        value = true;
    var commands = viewCommands.get();
    switch (e.keyCode) {
    case 37: //left
        commands.left = value;
        break;
    case 38: //up
        commands.up = value;
        break;
    case 39: //right
        commands.right = value;
        break;
    case 40: //down
        commands.down = value;
        break;
    case 34: //page down tiltdown
        commands.tiltdown = value;
        break;
    case 33: //page up tiltup
        commands.tiltup = value;
        break;
    case 81: //q rotate left
        commands.rotleft = value;
        break;
    case 87: //w rotate right
        commands.rotright = value;
        break;
    case 187: //+ near
        commands.near = value;
        break;
    case 189: //+ far
        commands.far = value;
        break;
    }
    viewCommands.set(commands);

}