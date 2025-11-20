// config/passport.js
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(new FacebookStrategy({
    clientID: "836608155559961",
    clientSecret: "273ae80c0a913c0e859c59e32995a459",
    callbackURL: "https://s381-kvzy.onrender.com/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ facebookId: profile.id });
      if (user) {
        return done(null, user);
      } else {
        // Create new user if not exists
        const newUser = new User({
          facebookId: profile.id,
          username: profile.displayName || `fb_${profile.id}`,
          email: profile.emails ? profile.emails[0].value : null
        });
        user = await newUser.save();
        return done(null, user);
      }
    } catch (err) {
      return done(err, false);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};