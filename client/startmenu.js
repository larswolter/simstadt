import { Random } from 'meteor/random';

Template.startmenu.onCreated(function() {
    this.error = new ReactiveVar();
});

Template.startmenu.helpers({
    error() {
        return Template.instance().error.get();
    }
});

Template.startmenu.events({
    'click .action-new-game': function (e,t) {
        Game.groundInit(Game.scene);
        Meteor.call('startNewGame',Random.id());
        $('.modal').modal('hide');
    },
    'click .action-login': function (e,t) {
        e.preventDefault();
        t.error.set(undefined);
        Meteor.loginWithPassword(t.$('#login-email').val(),t.$('#login-password').val(),(err)=>{
            t.error.set(err);
        });
    },
    'click .action-logout': function (e,t) {
        e.preventDefault();
        Meteor.logout();
    },
    'click .action-register': function (e,t) {
        e.preventDefault();
        t.error.set('Nicht implementiert');
    },
    'click .action-reset': function (e,t) {
        e.preventDefault();
        t.error.set('Nicht implementiert');
    }
    
});