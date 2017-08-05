import localforage from 'localforage';

var container;
var camera, scene, renderer;
var mesh;

Meteor.startup(function () {
    _.extend(Game, {
        terrainHeightData: new ReactiveVar(undefined),
        camLookAt: new ReactiveVar(),
        camRotation: new ReactiveVar(0),
        camTilt: new ReactiveVar(Math.PI / 4),
        camDist: new ReactiveVar(500.0),
        render: function () {
            renderer.render(scene, camera);
        }
    });
    localforage.getItem('camConfiguration',(err,value)=>{
        if(value) {
            Game.camLookAt.set(new THREE.Vector3(...value.lookAt));
            Game.camRotation.set(value.rotation);
            Game.camTilt.set(value.tilt);
            Game.camDist.set(value.dist);
        }
        else
            Game.camLookAt.set(new THREE.Vector3(0,0,0));
    });
    Tracker.autorun(()=>{
        if(Game.camLookAt.get())
            localforage.setItem('camConfiguration',{
                lookAt:Game.camLookAt.get().toArray(),
                rotation:Game.camRotation.get(),
                tilt:Game.camTilt.get(),
                dist:Game.camDist.get()
            });
    });
});

Template.view3d.onRendered(function () {

    init();
    animate();
});





function init() {

    container = document.getElementById('view3d');

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 20000);
    Game.camera = camera;
    /*camera = new THREE.OrthographicCamera(window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2, 1, 20000);
    */

    renderer = new THREE.WebGLRenderer();
    Game.renderer = renderer;
    renderer.setClearColor(0xbfd1e5);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapCullFace = THREE.CullFaceBack;
   
    scene = new THREE.Scene();
    Game.scene = scene;
    scene.add(camera);

    Game.initInteraction();

    generateHeightData('/terrain/landscapeSm.png');


    var directionalLight = new THREE.DirectionalLight(0xffffee, 1.5);
    directionalLight.position.set(0.2, 0.8, 0.4);
    directionalLight.position.normalize();
    scene.add(directionalLight);

    Tracker.autorun(function () {
        var oldMesh = scene.getObjectByName("TerrainMesh");
        if (oldMesh)
            scene.remove(oldMesh);

        if (!Game.terrainHeightData.get())
            return;
        var width = Game.terrainHeightData.get().width;
        var height = Game.terrainHeightData.get().height;
        var data = Game.terrainHeightData.get().data;
        var vertexCount = width * height;
        
        var geometry = new THREE.BufferGeometry();
        var collisionGeometry = new THREE.Geometry();

        Game.terrainGeom = geometry;
        var vertices = new Float32Array(vertexCount * 3);
        var uvs = new Float32Array(vertexCount * 2);
        var colors = new Float32Array(vertexCount * 3);
        var indices = new Uint32Array((width - 1) * (height - 1) * 6);
        var curIdx = 0;
        for (var y = 0; y < height - 1; y++) {
            for (var x = 0; x < width - 1; x++) {
                uvs[y * height * 2 + x * 2] = x / (width - 1) * 512;
                uvs[y * height * 2 + x * 2 + 1] = y / (height - 1) * 512;
                var j = (y * height + x) * 3;
                var level = data[y * width + x];
                vertices[j] = x;
                vertices[j + 1] = y;
                vertices[j + 2] = level;
                collisionGeometry.vertices.push(new THREE.Vector3(x, y, level));
                if (x < width - 1 && y < height - 1) {
                    indices[curIdx++] = y * height + x;
                    indices[curIdx++] = y * height + x + 1;
                    indices[curIdx++] = (y + 1) * height + x;
                    indices[curIdx++] = y * height + x + 1;
                    indices[curIdx++] = (y + 1) * height + x + 1;
                    indices[curIdx++] = (y + 1) * height + x;
                    collisionGeometry.faces.push(new THREE.Face3(y * height + x, y * height + x + 1, (y + 1) * height + x));
                    collisionGeometry.faces.push(new THREE.Face3(y * height + x + 1, (y + 1) * height + x + 1, (y + 1) * height + x));
                }

                if (level > 7) {
                    colors[j] = 0.9;
                    colors[j + 1] = 0.85;
                    colors[j + 2] = 0.65;
                } else if (level < 0) {
                    colors[j] = 0;
                    colors[j + 1] = 0.1;
                    colors[j + 2] = 0.4;
                } else {
                    colors[j] = 0.3;
                    colors[j + 1] = 0.7;
                    colors[j + 2] = 0.2;
                }
            }
        }
        console.log("Created buffers", vertexCount, curIdx);
        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
        geometry.addAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));
        geometry.setIndex( new THREE.BufferAttribute(indices, 1));

        geometry.buffersNeedUpdate = true;
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        collisionGeometry.computeBoundingSphere();

        var mapHeight = THREE.ImageUtils.loadTexture("/terrain/noise.png");
        mapHeight.wrapS = THREE.MirroredRepeatWrapping;
        mapHeight.wrapT = THREE.MirroredRepeatWrapping;
        var material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0x335533,
            shininess: 2,
            bumpMap: mapHeight,
            bumpScale: 1,
            wireframe: false,
            metal: false,
            vertexColors: THREE.VertexColors
        });

        mesh = new THREE.Mesh(geometry, material);

        mesh.name = "TerrainMesh";
        scene.add(mesh);
        Game.terrainOctree.add(new THREE.Mesh(collisionGeometry), {
            useFaces: true
        });
        try {
            Game.terrainOctree.update();
        } catch (e) {
            console.log(e);
        }
        // Add some water
        geometry = new THREE.PlaneBufferGeometry(width, height, 1, 1);
        material = new THREE.MeshPhongMaterial({
            color: 0xaabbff,
            specular: 0xffffff,
            shininess: 60,
            transparent: true,
            opacity: 0.8,
            wireframe: false,
            metal: true,
            depthWrite: false
        });
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(width * 0.5, height * 0.5, 0));
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = "TerrainWater";
        scene.add(mesh);

        Game.camLookAt.set(new THREE.Vector3(width * 0.25, height * 0.25));
        Game.render();
    });

    Game.groundInit(scene);

    Tracker.autorun(function () {

        var pos = new THREE.Vector3();
        pos.x = 0;
        pos.y = -Math.cos(Game.camTilt.get()) * Game.camDist.get();
        pos.z = Math.sin(Game.camTilt.get()) * Game.camDist.get();
        pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), Game.camRotation.get());
        if(Game.camLookAt.get()) {
            pos.add(Game.camLookAt.get());
            camera.position.addVectors(pos, Game.camLookAt.get());
        }
        camera.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
        camera.rotateZ(Game.camRotation.get());
        camera.rotateX((Math.PI / 2) - Game.camTilt.get());
        camera.updateProjectionMatrix();
        camera.updateMatrix();
        Game.render();
    });



    container.innerHTML = "";

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    /*
        camera.left = window.innerWidth / -2;
        camera.right = window.innerWidth / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = window.innerHeight / -2;
        camera.updateProjectionMatrix();
        */
    renderer.setSize(window.innerWidth, window.innerHeight);
    Game.render();
}

function generateHeightData(url) {



    var loader = new THREE.ImageLoader();

    // load a image resource
    loader.load(
        // resource URL
        url,
        // Function when resource is loaded
        function (image) {
            // do something with it

            // like drawing a part of it on a canvas
            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            var imageData = context.getImageData(0, 0, image.width, image.height);
            var imageArray = imageData.data;

            var size = image.width * image.height,
                data = new Float32Array(size);

            // iterate over all pixels
            for (var i = 0, n = imageArray.length; i < n; i += 4) {
                data[i / 4] = (imageArray[i] - 100) * 0.1;
            }
            Game.terrainHeightData.set({
                data: data,
                width: image.width,
                height: image.height
            });
        },
        // Function called when download progresses
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // Function called when download errors
        function (xhr) {
            console.log('An error happened', xhr);
        }
    );
}

//
var lastFrameTime = 0;

function animate(timestamp) {
    var timeDiff = (timestamp - lastFrameTime) / 1000.0;
    lastFrameTime = timestamp;
    Game.updateControls(timeDiff);
    requestAnimationFrame(animate);
}