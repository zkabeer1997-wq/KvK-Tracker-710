import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, computeAdminToken } from './lib/adminAuth';

export const config = {
matcher: ['/admin/dashboard'],
};

export async function middleware(request) {
const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
const expected = await computeAdminToken();
if (!cookie || !expected || cookie.value !== expected) {
const loginUrl = new URL('/admin/login', request.url);
return NextResponse.redirect(loginUrl);
}
return NextResponse.next();
}
