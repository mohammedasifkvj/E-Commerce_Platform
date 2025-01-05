const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User }= require('../models/signup');
const keys = require('../config/keys');

passport.use(
    new GoogleStrategy({
        // clientID: process.env.googleClientID,
        //clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        //callbackURL: `${process.env.BASE_URL}/google/callback`
        clientID:keys.googleClientID,
        clientSecret: keys.googleClientSecret,
        callbackURL: keys.GOOGLE_URL
    },
    async (accessToken, refreshToken, profile, done) => {
        const existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
            return done(null, existingUser);
        }

        // Check if a user with the given email already exists and doesn't have a Google ID
      const existingUserWithPW = await User.findOne({ email: profile.emails[0].value });
      if (existingUserWithPW && !existingUserWithPW.googleId) {
       return done(null, false, { message: 'Account with this email already exists. Please Sign-in using email and password.' });
       
      }

      // If no such user exists, create a new user with Google ID
        const user = new User({
            googleId: profile.id,
            name:profile.displayName,
            email: profile.emails[0].value // Get email from Google profile
        });

        await user.save();
        done(null, user);
    })
);

// Comment out or remove serializeUser and deserializeUser
// passport.serializeUser((user, done) => {
//     done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//     User.findById(id, (err, user) => {
//         done(err, user);
//     });
// });
