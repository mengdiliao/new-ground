import { createServerFn } from '@tanstack/react-start';
import { searchInput, searchFailure } from '@/lib/exa-search';
import { requestExa } from '@/lib/exa-search.server';

export const searchWeb = createServerFn({ method: 'POST' })
  .inputValidator(input => searchInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env['EXA_API_KEY'];
    if (!apiKey) return searchFailure('configuration');
    return requestExa(data.query, apiKey);
  });