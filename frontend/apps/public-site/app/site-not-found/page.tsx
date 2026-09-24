export const metadata = { title: "Website not found", robots: { index: false } };

export default function SiteNotFound() {
  return (
    <main className="notfound">
      <div>
        <p className="eyebrow">404</p>
        <h1>This website isn&apos;t available</h1>
        <p className="muted">The address may be mistyped, or the salon hasn&apos;t published its website yet.</p>
      </div>
    </main>
  );
}
