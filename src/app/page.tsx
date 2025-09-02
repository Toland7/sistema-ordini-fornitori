export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Sistema Ordini Fornitori</h1>
        <p className="mt-4">Benvenuto! Vai al tuo dashboard.</p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
        >
          Entra nel Dashboard
        </a>
      </div>
    </main>
  );
}
