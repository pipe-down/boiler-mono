import React from 'react';

export function escapeRegex(s: string) {
  const specials = new Set(['\\', '^', '$', '.', '|', '?', '*', '+', '(', ')', '[', ']', '{', '}']);
  let out = '';
  for (const ch of s) out += specials.has(ch) ? '\\' + ch : ch;
  return out;
}

export function renderHighlighted(text: string, keyword: string) {
  if (!keyword) return text;
  const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
  const parts = (text || '').split(regex);
  return parts.map((part, idx) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? React.createElement('mark', { key: idx }, part)
      : React.createElement('span', { key: idx }, part),
  );
}

export function renderContentWithLinks(text: string) {
  // Use RegExp constructor to avoid literal parsing issues
  const urlRe = new RegExp('(https?:\\/\\/\\S+)', 'g');
  const parts = (text || '').split(urlRe);
  const startsWithUrl = new RegExp('^https?:\\/\\/');
  return parts.map((part, idx) => {
    if (startsWithUrl.test(part)) {
      return React.createElement(
        'a',
        {
          key: idx,
          href: part,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'underline break-all',
        },
        part,
      );
    }
    return React.createElement('span', { key: idx }, part);
  });
}
