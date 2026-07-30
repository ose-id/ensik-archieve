export default defineOAuthDiscordEventHandler({
  async onSuccess(event, { user, tokens }) {
    try {
      if (!await verifyDiscordRole(event, tokens.access_token))
        return sendRedirect(event, '/?error=unauthorized');

      await setUserSession(event, {
        user: {
          discordId: user.id,
          username: user.username,
          avatar: user.avatar,
        },
        loggedInAt: new Date(),
        roleVerifiedAt: new Date(),
        siteAuthenticated: true,
        secure: {
          discordAccessToken: tokens.access_token,
        },
      });

      return sendRedirect(event, '/');
    }
    catch {
      return sendRedirect(event, '/?error=unauthorized');
    }
  },
  onError(event) {
    return sendRedirect(event, '/?error=unauthorized');
  },
});
