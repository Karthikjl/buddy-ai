import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    username?: string | null;
    name?: string | null;
    role: string;
    status: string;
    mustResetPassword: boolean;
    rateLimit: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      username?: string | null;
      name?: string | null;
      role: string;
      status: string;
      mustResetPassword: boolean;
      rateLimit: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string | null;
    role: string;
    status: string;
    mustResetPassword: boolean;
    rateLimit: number;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Please provide both identifier and password");
        }

        const { identifier, password } = credentials;
        const cleanIdentifier = identifier.trim().toLowerCase();

        // Retrieve dynamic rate limit settings from database (with fallback defaults)
        let rateLimitEnabled = true;
        let windowMinutes = 15;
        let maxAttempts = 20;

        try {
          const [enabledSetting, windowSetting, maxSetting] = await Promise.all([
            prisma.systemSetting.findUnique({ where: { key: "loginRateLimit_enabled" } }),
            prisma.systemSetting.findUnique({ where: { key: "loginRateLimit_window" } }),
            prisma.systemSetting.findUnique({ where: { key: "loginRateLimit_maxAttempts" } }),
          ]);

          if (enabledSetting) rateLimitEnabled = enabledSetting.value !== "false";
          if (windowSetting) windowMinutes = Math.max(1, parseInt(windowSetting.value, 10) || 15);
          if (maxSetting) maxAttempts = Math.max(1, parseInt(maxSetting.value, 10) || 20);
        } catch (e) {
          // fallback to defaults
        }

        if (rateLimitEnabled) {
          const rateCheck = checkRateLimit(
            `login:${cleanIdentifier}`,
            maxAttempts,
            windowMinutes * 60 * 1000
          );

          if (!rateCheck.allowed) {
            throw new Error(
              `Too many failed login attempts (${rateCheck.count}/${maxAttempts}). Please wait ${Math.ceil(
                rateCheck.resetInSeconds / 60
              )} minute(s) before trying again or contact an administrator.`
            );
          }
        }

        // Look up by email OR username OR name
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: cleanIdentifier },
              { username: cleanIdentifier },
              { name: cleanIdentifier },
            ],
          },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (user.status === "INACTIVE") {
          throw new Error("Your account has been deactivated. Please contact an administrator.");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Reset rate limiter upon successful authentication
        resetRateLimit(`login:${cleanIdentifier}`);

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name || user.username || user.email.split("@")[0],
          role: user.role || "USER",
          status: user.status || "ACTIVE",
          mustResetPassword: !!user.mustResetPassword,
          rateLimit: user.rateLimit ?? 60,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.status = user.status;
        token.mustResetPassword = user.mustResetPassword;
        token.rateLimit = user.rateLimit;
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (typeof session.mustResetPassword === "boolean") {
          token.mustResetPassword = session.mustResetPassword;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | undefined;
        session.user.role = (token.role as string) || "USER";
        session.user.status = (token.status as string) || "ACTIVE";
        session.user.mustResetPassword = !!token.mustResetPassword;
        session.user.rateLimit = typeof token.rateLimit === "number" ? token.rateLimit : 60;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "default_nextauth_secret_key_buddyai",
};
