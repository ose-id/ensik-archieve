export default defineNitroPlugin(() => {
  const config = useRuntimeConfig();
  const missing = [
    ['NUXT_SESSION_PASSWORD', config.session.password],
    ['NUXT_SITE_PASSWORD_HASH', config.sitePasswordHash],
    ['NUXT_OAUTH_DISCORD_CLIENT_ID', config.oauth.discord.clientId],
    ['NUXT_OAUTH_DISCORD_CLIENT_SECRET', config.oauth.discord.clientSecret],
    ['NUXT_DISCORD_GUILD_ID', config.discordGuildId],
    ['NUXT_DISCORD_ROLE_ID', config.discordRoleId],
  ]
    .filter(([, value]) => typeof value !== 'string' || !value)
    .map(([name]) => name);

  if (missing.length > 0)
    throw new Error(`Missing required runtime configuration: ${missing.join(', ')}`);

  if (config.session.password.length < 32)
    throw new Error('NUXT_SESSION_PASSWORD must contain at least 32 characters.');

  if (!/^\d{17,20}$/.test(config.oauth.discord.clientId))
    throw new Error('NUXT_OAUTH_DISCORD_CLIENT_ID must be a valid Discord snowflake.');

  if (!/^\d{17,20}$/.test(config.discordGuildId))
    throw new Error('NUXT_DISCORD_GUILD_ID must be a valid Discord snowflake.');

  if (!/^\d{17,20}$/.test(config.discordRoleId))
    throw new Error('NUXT_DISCORD_ROLE_ID must be a valid Discord snowflake.');

  if (
    !Number.isInteger(config.discordRoleRecheckSeconds)
    || config.discordRoleRecheckSeconds < 60
    || config.discordRoleRecheckSeconds > 86_400
  ) {
    throw new Error(
      'NUXT_DISCORD_ROLE_RECHECK_SECONDS must be an integer between 60 and 86400.',
    );
  }
});
