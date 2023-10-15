import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { accounts, users } from '@/schema';
import { and, eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_APP_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET as string,
    }),
  ],

  adapter: getAdapter(),
};

function getAdapter() {
  return {
    // @ts-expect-error FIXME: when we have a better type for this
    ...DrizzleAdapter(db),
    async getUserByAccount(providerAccount: { provider: string; providerAccountId: string; }) {
      const results = await db
        .select()
        .from(accounts)
        .leftJoin(users, eq(users.id, accounts.userId))
        .where(
          and(
            eq(accounts.provider, providerAccount.provider),
            eq(accounts.providerAccountId, providerAccount.providerAccountId)
          )
        )
        .get();

      return results?.user ?? null;
    },
  };
}

