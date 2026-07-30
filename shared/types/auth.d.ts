declare module '#auth-utils' {
  interface User {
    discordId: string;
    username: string;
    avatar: string | null;
  }

  interface UserSession {
    loggedInAt?: Date | string;
    roleVerifiedAt?: Date | string;
    siteAuthenticated?: boolean;
  }

  interface SecureSessionData {
    discordAccessToken?: string;
  }
}

export {};
