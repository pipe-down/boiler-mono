export const metadata = { title: "Chatstack" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header style={{padding: '12px 16px', borderBottom: '1px solid #eee'}}>
          <a href="/" style={{marginRight: 12}}>Home</a>
          <a href="/login" style={{marginRight: 12}}>Login</a>
          <a href="/register" style={{marginRight: 12}}>Register</a>
          <a href="/chat" style={{marginRight: 12}}>Chat</a>
          <a href="/upload" style={{marginRight: 12}}>Upload</a>
          <a href="/presence" style={{marginRight: 12}}>Presence</a>
          <a href="/search" style={{marginRight: 12}}>Search</a>
        </header>
        <main style={{maxWidth: 800, margin: '0 auto', padding: 16}}>{children}</main>
      </body>
    </html>
  );
}