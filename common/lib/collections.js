Game = {
    groundElements: new Meteor.Collection('groundElements'),
    buildings: new Meteor.Collection('buildings'),
    elements: {
        ROAD_SINGLE: 0,
        ROAD_SINGLE_CYCLE: 1,
        ROAD_DOUBLE: 2,
        ROAD_HIGHWAY_ONE_DIRECTION: 3,
        ROAD_FOOTWALK: 4,
        AREA_LIVING: 5,
        AREA_COMERCIAL: 6,
        AREA_INDUSTRY: 7
    }

};

if(Meteor.isServer) {
    Meteor.publish('groundElements', function(){
        let user = Meteor.users.findOne(this.userId);
        return Game.groundElements.find({game:user.profile.activeGame});
    });
}
