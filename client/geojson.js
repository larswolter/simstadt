Meteor.startup(function () {

    _.extend(Game, {

        loadGeoJSON: function (json) {
            var material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
            var count = 0;
            var zero;
            json.features.forEach(function(feature){
                geo = new THREE.BufferGeometry();
                geo.dynamic = false;
                geo.verticesNeedUpdate = true;            
                if(feature.geometry.type==='LineString') {
                    if(!zero)
                        zero = feature.geometry.coordinates[0];

                    var vertices = new Float32Array(feature.geometry.coordinates.length * 3); // three components per vertex
                    var colors = new Float32Array(feature.geometry.coordinates.length * 3);
                    feature.geometry.coordinates.forEach(function(coordinate,idx){
                       vertices[idx*3] = (coordinate[0] - zero[0])*2000;
                       vertices[idx*3+1] = (coordinate[1] - zero[1])*2000;
                       vertices[idx*3+2] = 0;
                       
                       colors[idx*3] = 0;
                       colors[idx*3+1] = 0;
                       colors[idx*3+2] = 0;
                    });
                    geo.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
                    geo.addAttribute('color', new THREE.BufferAttribute(colors, 3));
                    geo.computeBoundingSphere();
                    var mesh = new THREE.Line(geo, material);
                    mesh.name = "Geojson";
                    mesh.renderOrder = 1;
                    Game.scene.add(mesh);
                    count++;
                }
                //streetGeometry.addDrawCall(0, 100, 0);
            });
            console.log("Added line strings:",count);
        }
    });
});
