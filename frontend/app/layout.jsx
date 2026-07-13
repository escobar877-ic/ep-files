import '../src/index.css';

export const metadata = {
  title: 'EP Files',
  description: 'Личное файловое пространство EP Files',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
