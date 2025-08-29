import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import * as jose from 'jose';

// Accessible without needing to log in
const noAuthRoutes = [
    '/',
    '/api',
    '/img',
    '/sounds',
    '/uploads',
    '/fonts',
    '/robots.txt',
    '//robots.txt',
    '/favicon.ico',
    '/_next',
    '/sitemap'
];

// Accessible only to users not logged in
const noAuthOnlyRoutes = ['/register', '/login', '/forgot-password', '/reset-password'];

export const validateToken = async (token: string): Promise<false | any> => {
    try {
        const decoded = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET ?? ''));

        return decoded.payload as unknown as any;
    } catch (e: any) {
        return false;
    }
};

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const page = request.nextUrl.pathname;

    if (page === '/' || noAuthRoutes.some((route) => page.startsWith(route))) {
        return NextResponse.next();
    }

    if (noAuthOnlyRoutes.some((route) => page.startsWith(route))) {
        if (token) {
            const valRes = await validateToken(token);
            if (valRes) return NextResponse.redirect(new URL('/', request.url));

            return NextResponse.next();
        } else {
            return NextResponse.next();
        }
    } else {
        if (!token) {
            const redirectTo = encodeURIComponent(request.nextUrl.href);

            return NextResponse.redirect(new URL(`/login?r=${redirectTo}`, request.url));
        }

        // Muse use jose because jsonwebtoken doesn't run on edge runtime - jose does
        let userToken;
        const valRes = await validateToken(token);
        if (!valRes) return NextResponse.redirect(new URL('/login', request.url));

        return NextResponse.next();
    }
}

/*export const config = {
    //   matcher: ["/", "/settings"],
}*/
