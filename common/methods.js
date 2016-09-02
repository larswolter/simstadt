Meteor.methods({
    groundElementsInsert: function(x,y,type) {
        let user = Meteor.users.findOne(this.userId);
        let game = user.profile.activeGame;
        if(!game)
            return;
        if(Game.groundElements.findOne({x,y,game}))
            return Game.groundElements.update({x,y,game},{$set:{type}});
        let element = {x,y,type,offset:Game.groundElements.find({game}).count(),game};
        if(this.isSimulation)
            console.log('acting as ',user);

        // check around and update associations for roads
        if(type >= Game.elements.ROAD_SINGLE && type <= Game.elements.ROAD_FOOTWALK) {

            if(Game.groundElements.findOne({x,y:y - 1,type,game})){
                Game.groundElements.update({x,y:y - 1,game},{$set:{top:true}});
                element.bottom=true;
            }
            if(Game.groundElements.findOne({x,y:y + 1,type,game})){
                Game.groundElements.update({x,y:y + 1,game},{$set:{bottom:true}});
                element.top=true;
            }
            if(Game.groundElements.findOne({x:x - 1,y,type,game})){
                Game.groundElements.update({x:x - 1,y,game},{$set:{right:true}});
                element.left=true;
            }
            if(Game.groundElements.findOne({x:x + 1,y,type,game})){
                Game.groundElements.update({x:x + 1,y,game},{$set:{left:true}});
                element.right=true;
            }
        }
        return Game.groundElements.insert(element);
    },
    groundElementsClear:  function(x,y) {
        if(!x)
            Game.groundElements.remove({});
        else
            Game.groundElements.remove({x,y});
    },
    startNewGame: function(name) {
        Meteor.users.update(this.userId,{$set:{'profile.activeGame':name}});
    }

});