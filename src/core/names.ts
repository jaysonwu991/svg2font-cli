const toLower = (value: string): string => value.toLowerCase();

export const normalizePrefix = (prefix: string): string => {
  const trimmed = prefix.endsWith("-") ? prefix.slice(0, -1) : prefix;
  return toLower(trimmed);
};

export const classNameVariants = (prefix: string, name: string): string[] => {
  const normalized = normalizePrefix(prefix);
  const lowerName = toLower(name);
  const dashed = normalized ? `${normalized}-${lowerName}` : lowerName;
  return [dashed];
};
