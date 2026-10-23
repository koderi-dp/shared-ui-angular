export function searchTokens(value: string): string[] {
  return value.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * Every token must appear in one of the fields. `field:value` restricts a token to one
 * field, so `tag:prod` only matches the `tag` field. Fields are compared lowercased.
 */
export function matchesTokens(tokens: string[], fields: Record<string, string>): boolean {
  return tokens.every((token) => {
    const separator = token.indexOf(":");
    if (separator > 0) {
      const field = token.slice(0, separator);
      const value = token.slice(separator + 1);
      if (value && fields[field] != null) return fields[field].toLowerCase().includes(value);
    }
    return Object.values(fields).some((value) => value.toLowerCase().includes(token));
  });
}
