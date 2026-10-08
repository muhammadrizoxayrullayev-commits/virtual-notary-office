import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  providers: [

    CredentialsProvider({
      name: 'Test Login',
      credentials: {
        role: { label: "Role (CLIENT, EMPLOYEE, DIRECTOR)", type: "text", placeholder: "CLIENT" }
      },
      async authorize(credentials) {
        const role = credentials?.role?.toUpperCase() || 'CLIENT';
        
        let user = await prisma.user.findFirst({ where: { role: role as any } });
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              name: `Test ${role}`,
              email: `test-${role.toLowerCase()}@example.com`,
              role: role as any,
            }
          });
        }
        
        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'CLIENT';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
