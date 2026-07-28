export default function CharacterDecomposition({ character, method = "cangjie" }) {
  const methodData = character?.[method];
  if (!character || !methodData) return null;
  return (
    <section className="cil-decomposition" aria-labelledby="cil-decomposition-title">
      <h3 id="cil-decomposition-title">Canonical input sequence</h3>
      <div className="cil-code-flow" aria-label={`${character.char} code ${methodData.preferredCode}`}>
        {methodData.keySequence.map((key, index) => (
          <span className="cil-code-step" key={`${key}-${index}`}>
            <span lang="zh-Hant">{methodData.rootSequence[index]}</span>
            <strong>{key}</strong>
          </span>
        ))}
      </div>
      <p className="lw-subtitle">
        This shows the verified input-method sequence. It is not presented as a complete visual or semantic decomposition of the glyph.
      </p>
      {method === "cangjie" && character.quick && (
        <p><strong>Quick comparison:</strong> {character.quick.preferredCode}</p>
      )}
      {methodData.acceptedCodes.length > 1 && (
        <p><strong>Accepted alternatives:</strong> {methodData.acceptedCodes.join(", ")}</p>
      )}
    </section>
  );
}
