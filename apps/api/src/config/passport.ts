import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserModel } from '../models/userModel.js';

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email from Google profile'));
          }

          let user = await UserModel.findByEmail(email);

          if (!user) {
            user = await UserModel.createFromGoogle({
              name: profile.displayName ?? email.split('@')[0],
              email,
              googleId: profile.id,
              avatarUrl: profile.photos?.[0]?.value,
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}
