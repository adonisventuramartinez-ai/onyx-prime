export default function TestEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NO DEFINIDA';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NO DEFINIDA';

  return (
    <div style={{ padding: 20, color: 'white', background: '#141414', minHeight: '100vh' }}>
      <h1>🔧 Test de Variables</h1>
      <p><strong>URL:</strong> {url}</p>
      <p><strong>ANON KEY:</strong> {key !== 'NO DEFINIDA' ? '✅ DEFINIDA' : '❌ NO DEFINIDA'}</p>
    </div>
  );
}
