const rules = [
  'Jeden użytkownik może oddać jeden głos na jeden rankup.',
  'Głosowanie nie gwarantuje awansu.',
  'Administrator zatwierdza rankup.',
  'Próby manipulowania głosami mogą skutkować usunięciem głosu.',
  'Rankingi są tworzone dla zabawy i rywalizacji PvP.'
];

export default function Rules() {
  return (
    <div className="flex justify-center py-6">
      <div
        className="max-w-2xl w-full p-8 relative"
        style={{
          background: 'linear-gradient(180deg, #e8d9a8 0%, #d9c68a 100%)',
          color: '#3a2f1a',
          border: '8px solid #7a5c2e',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.6)'
        }}
      >
        <h1 className="font-pixel text-xl text-center mb-6" style={{ color: '#5c4321' }}>
          📜 Rules
        </h1>
        <ol className="flex flex-col gap-4 text-xl leading-relaxed" style={{ fontFamily: "'VT323', monospace" }}>
          {rules.map((r, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-pixel text-sm" style={{ color: '#7a5c2e' }}>
                {i + 1}.
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
