export default defineOAuthDiscordEventHandler({
  async onSuccess(event, { user, tokens }) {
    const guildId = '614405243773386753';
    const roleId = '614416579475669014';

    try {
      const memberResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!memberResponse.ok) {
        console.error('Failed to fetch member information:', await memberResponse.text());
        throw new Error('Failed to fetch member information');
      }

      const member = await memberResponse.json();

      const hasRole = member.roles.includes(roleId);
      if (!hasRole) {
        console.error('User does not have the required role');
        throw new Error('User does not have the required role');
      }

      await setUserSession(event, {
        user: {
          discordId: user.id,
          username: user.username,
        },
        loggedInAt: new Date(),
      });

      return sendRedirect(event, '/');
    }
    catch (error) {
      console.error('Discord OAuth error:', error);
      return sendRedirect(event, '/?error=unauthorized');
    }
  },
  onError(event, error) {
    console.error('Discord OAuth onError:', error);
    return sendRedirect(event, '/?error=unauthorized');
  },
});
