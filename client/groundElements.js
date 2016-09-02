
import Building from './building.js';

Meteor.startup(function () {
    Tracker.autorun(()=>{
        if(Game.groundInitDone.get() && Game.terrainHeightData.get())
            Meteor.subscribe('groundElements');
    });
    Game.groundElements.find().observe({
        added: function(node) {
            Game.groundAdd(node.x, node.y, 0, 0);
            updateImage(node);
            
            console.log('Added ground element');
        },
        changed: function(node) {
            updateImage(node);
        }
    });
});

function updateImage(node) {
    if (node.right && node.bottom && node.top && node.left)
        Game.groundUpdate(node.offset, node.type + 3, 0);
    else if (node.right && node.bottom && node.top)
        Game.groundUpdate(node.offset, node.type + 2, 3);
    else if (node.right && node.left && node.top)
        Game.groundUpdate(node.offset, node.type + 2, 0);
    else if (node.left && node.bottom && node.top)
        Game.groundUpdate(node.offset, node.type + 2, 1);
    else if (node.right && node.bottom && node.left)
        Game.groundUpdate(node.offset, node.type + 2, 2);
    else if (node.top && node.bottom)
        Game.groundUpdate(node.offset, node.type + 1, 1);
    else if (node.left && node.right)
        Game.groundUpdate(node.offset, node.type + 1, 0);
    else if (node.left && node.bottom)
        Game.groundUpdate(node.offset, node.type + 4, 1);
    else if (node.right && node.bottom)
        Game.groundUpdate(node.offset, node.type + 4, 2);
    else if (node.right && node.top)
        Game.groundUpdate(node.offset, node.type + 4, 3);
    else if (node.left && node.top)
        Game.groundUpdate(node.offset, node.type + 4, 0);
    else if (node.left)
        Game.groundUpdate(node.offset, node.type, 0);
    else if (node.bottom)
        Game.groundUpdate(node.offset, node.type, 1);
    else if (node.right)
        Game.groundUpdate(node.offset, node.type, 2);
    else if (node.top)
        Game.groundUpdate(node.offset, node.type, 3);
    else
        Game.groundUpdate(node.offset, node.type, 0);

    if(node.type === Game.elements.AREA_LIVING) {
        Building.build(node._id,new THREE.Vector3(node.x,node.y,Game.groundHeight(node.x,node.y)));
    }
}