import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const countryCode = z.string().regex(/^[A-Z]{2}$/);

export const listCountries = createServerFn({ method: 'GET' }).handler(async () => {
  const { getCountries } = await import('./location-data');
  return getCountries();
});

export const browseCountryCities = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => z.object({ countryCode }).parse(input))
  .handler(async ({ data }) => {
    const { browseCities } = await import('./location-data');
    return browseCities(data.countryCode);
  });

export const searchCitySuggestions = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => z.object({ query: z.string().min(2).max(120), countryCode: countryCode.optional() }).parse(input))
  .handler(async ({ data }) => {
    const { searchCities } = await import('./location-data');
    return searchCities(data.query, data.countryCode);
  });
