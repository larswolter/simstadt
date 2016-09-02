T9n.setLanguage('de');

AccountsTemplates.configure({
    // Behavior
    confirmPassword: false,
    enablePasswordChange: true,
    forbidClientAccountCreation: false,
    overrideLoginErrors: true,
    sendVerificationEmail: false,
    lowercaseUsername: false,
    focusFirstInput: true,

    // Appearance
    showAddRemoveServices: false,
    showForgotPasswordLink: false,
    showLabels: true,
    showPlaceholders: true,
    showResendVerificationEmailLink: false,

    // Client-side Validation
    continuousValidation: false,
    negativeFeedback: false,
    negativeValidation: true,
    positiveValidation: true,
    positiveFeedback: true,
    showValidating: true

});

if(Meteor.isServer) {
    Accounts.onLogin(function(attempt){
        if(!attempt.user.username)
            Meteor.users.update(attempt.user._id,{$set:{username:attempt.user.emails[0].address}});
    });
}
