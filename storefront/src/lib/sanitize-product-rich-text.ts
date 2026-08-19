import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'blockquote',
  'a',
];

export function sanitizeProductRichText(input: string | null | undefined): string {
  if (!input) return '';

  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          rel: 'nofollow noopener noreferrer',
          target: '_blank',
        },
      }),
    },
  });
}
