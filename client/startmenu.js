import { Random } from 'meteor/random';

Template.startmenu.onCreated(function() {
  this.error = new ReactiveVar();
});

Template.startmenu.helpers({
  error() {
    return Template.instance().error.get();
  },
});

Template.startmenu.events({
  'click .action-new-game' (e, t) {
    Game.groundInit(Game.scene);
    Meteor.call('startNewGame', Random.id());
    $('.modal').modal('hide');
  },
  'click .action-login' (e, t) {
    e.preventDefault();
    t.error.set(undefined);
    Meteor.loginWithPassword(t.$('#login-email').val(), t.$('#login-password').val(), (err) => {
      t.error.set(err);
    });
  },
  'click .action-logout' (e, t) {
    e.preventDefault();
    Meteor.logout();
  },
  'click .action-register' (e, t) {
    e.preventDefault();
    Accounts.createUser({
      username: t.$('#login-email').val(),
      password: t.$('#login-password').val(),
      email: t.$('#login-email').val(),
      profile: { name: 'Spieler' },
    });
    t.error.set('Nicht implementiert');
  },
  'click .action-reset' (e, t) {
    e.preventDefault();
    t.error.set('Nicht implementiert');
  },

});
