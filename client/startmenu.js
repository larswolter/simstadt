import { Random } from 'meteor/random';

Template.startmenu.events({
    'click .action-new-game': function () {
        Meteor.call('startNewGame',Random.id());
        $('.modal').modal('hide');
    }
});