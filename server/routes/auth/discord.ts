export default defineOAuthDiscordEventHandler({
  async onSuccess(event, { user, tokens }) {
    const guildId = '614405243773386753';
    const roleId = '614416579475669014';

    console.warn('Discord OAuth Success - User:', user.username, 'ID:', user.id);

    try {
      const memberResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!memberResponse.ok) {
        const errorText = await memberResponse.text();
        console.error('Failed to fetch member information:', errorText);
        console.error('Response status:', memberResponse.status);
        throw new Error(`Failed to fetch member information: ${memberResponse.status}`);
      }

      const member = await memberResponse.json();
      console.warn('Member roles:', member.roles);

      const hasRole = member.roles.includes(roleId);
      if (!hasRole) {
        console.error('User does not have the required role. User roles:', member.roles);
        throw new Error('User does not have the required role');
      }

      console.warn('Setting user session for:', user.username);
      await setUserSession(event, {
        user: {
          discordId: user.id,
          username: user.username,
          avatar: user.avatar,
        },
        loggedInAt: new Date(),
      });

      console.warn('User session set successfully');
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
