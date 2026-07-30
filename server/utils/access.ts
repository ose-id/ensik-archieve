import type { H3Event } from 'h3';

interface DiscordGuildMember {
  roles: string[];
}

function hasFreshRoleVerification(value: Date | string | undefined, maxAgeSeconds: number) {
  if (!value)
    return false;

  const verifiedAt = new Date(value).getTime();
  return Number.isFinite(verifiedAt)
    && Date.now() - verifiedAt <= maxAgeSeconds * 1000;
}

export async function verifyDiscordRole(event: H3Event, accessToken: string) {
  const config = useRuntimeConfig(event);
  const response = await fetch(
    `https://discord.com/api/v10/users/@me/guilds/${config.discordGuildId}/member`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (!response.ok)
    return false;

  const member = await response.json() as DiscordGuildMember;
  return Array.isArray(member.roles) && member.roles.includes(config.discordRoleId);
}

export async function requireSiteAccess(event: H3Event) {
  const session = await getUserSession(event);
  if (session.user || session.siteAuthenticated)
    return session;

  throw createError({
    statusCode: 401,
    statusMessage: 'Authentication is required.',
  });
}

export async function requireOAuthUser(event: H3Event) {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Discord authentication is required.',
    });
  }

  const config = useRuntimeConfig(event);
  if (hasFreshRoleVerification(session.roleVerifiedAt, config.discordRoleRecheckSeconds))
    return session.user;

  const accessToken = session.secure?.discordAccessToken;
  if (!accessToken || !await verifyDiscordRole(event, accessToken)) {
    await clearUserSession(event);
    throw createError({
      statusCode: 403,
      statusMessage: 'Your Discord role could not be verified. Please sign in again.',
    });
  }

  await setUserSession(event, {
    roleVerifiedAt: new Date(),
  });

  return session.user;
}
