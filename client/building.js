var meshes = [];
export function loadGeometries(geometryUrls,texturePath,readyCallback) {
    var loader = new THREE.JSONLoader();
    geometryUrls.forEach((geometryUrl)=>{
        loader.load(geometryUrl, (geometry,materials) => {
            
            console.log('Finished loading geometry:',geometryUrl);
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            let mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
            mesh.rotateX(Math.PI*0.5);
            meshes.push(mesh);
            if(readyCallback && meshes.length === geometryUrls.length)
                readyCallback();            
        },()=>{},(err)=>{
            console.log('Error loading geometry:',err);
            readyCallback(Meteor.Error('geometry loading error',err));
        });        
    });
}
export function build(relatedId,pos) {
    let instance = meshes[(Math.random()*meshes.length).toFixed()].clone();
    instance.name = relatedId;
    instance.position.x = pos.x;
    instance.position.y = pos.y;
    instance.position.z = pos.z;
    Game.scene.add(instance);
    console.log('placed building at ',pos);
    Game.render();
}