export function quickCode(code) {
  return code.length <= 1 ? code : `${code[0]}${code.at(-1)}`;
}

export function educationalCangjieCodes(codes = []) {
  const uniqueCodes = [...new Set(codes.filter(Boolean))];
  const standardCodes = uniqueCodes.filter((code) => !code.startsWith("X"));
  return (standardCodes.length ? standardCodes : uniqueCodes)
    .sort((left, right) => left.length - right.length || left.localeCompare(right));
}
