

_.extend(Game,{
    creationMode: new ReactiveVar(),
    clickOn: function (x, y) {
        if(!Game.creationMode.get())
            return;
        Meteor.call('groundElementsInsert',x,y,Game.elements[Game.creationMode.get()]);
        Game.render();
    }

});
console.log("Starting game...");
Meteor.startup(function () {
});
Template.gui.onRendered(function(){
    if(!Meteor.userId())
        this.$('#menuDialog').modal('show');

    this.autorun(()=>{
        this.$(`[data-creation]`).removeClass('active');
        if(Game.creationMode.get())
            this.$(`[data-creation="${Game.creationMode.get()}"]`).addClass('active');
    });
});

Template.gui.helpers({
    networkStatus() {
        return Meteor.status();
    }
});

Template.gui.events({
    'click .toggle-object-creation': function(e,t) {
        e.preventDefault();
        let type = t.$(e.currentTarget).attr('data-creation');
        Game.creationMode.set(type);
    },
    'click .action-reconnect': function(e,t) {
        e.preventDefault();
        Meteor.reconnect();
    },
    'click .action-menu': function(e,t) {
        e.preventDefault();
        Template.instance().$('#menuDialog').modal('show');
    }
    
});