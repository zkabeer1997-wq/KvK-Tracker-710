import './globals.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export const metadata = {
title: 'K710 KvK Planner',
description: 'KvK Tracker 710 troop, hero and availability submission form',
};

export default function RootLayout({ children }) {
return (
<html lang="en">
<body>
<SiteHeader />
{children}
<SiteFooter />
</body>
</html>
);
}
