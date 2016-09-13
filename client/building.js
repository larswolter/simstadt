var meshes = {};
export function loadGeometries(geometryUrls,texturePath,readyCallback) {
    var loader = new THREE.JSONLoader();
    geometryUrls.forEach((geometryUrl)=>{
        loader.load(geometryUrl, (geometry,materials) => {
            
            console.log('Finished loading geometry:',geometryUrl.split('/').reverse()[0]);
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            let mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
            mesh.translation = geometry.center();
            mesh.rotateX(Math.PI*0.5);
            mesh.translation.z = 0;
            mesh.name = geometryUrl.split('/').reverse()[0];
            meshes[mesh.name] = mesh;
            if(readyCallback && (Object.keys(meshes).length === geometryUrls.length))
                readyCallback();            
        },()=>{},(err)=>{
            console.log('Error loading geometry:',err);
            readyCallback(Meteor.Error('geometry loading error',err));
        });        
    });
}
export function build(relatedId,pos,specific) {
    let name = specific || _.sample(Object.keys(meshes));
    let instance = meshes[name].clone(); 
    instance.name = relatedId;
    instance.position.x = pos.x+0.5;
    instance.position.y = pos.y+0.5;
    instance.position.z = pos.z;
    Game.scene.add(instance);
    Game.render();
    return name;
}