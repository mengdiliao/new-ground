// Server-side access to the bundled GeoNames dataset (cities with population
// over 15,000 plus every country). Never import this from browser code.
import citiesJson from './data/cities.json';
import countriesJson from './data/countries.json';
import type { CitySuggestion, CountryOption } from './locations';

interface CityRecord { i: number; n: string; a: string; c: string; r: string; la: number; lo: number; p: number; }

const cities = citiesJson as CityRecord[];
const countries = countriesJson as CountryOption[];
const countryNames = new Map(countries.map(country => [country.code, country.name]));

export function getCountries(): CountryOption[] {
  return countries;
}

function toSuggestion(city: CityRecord): CitySuggestion {
  return { cityId: city.i, cityName: city.n, countryCode: city.c, countryName: countryNames.get(city.c) ?? city.c, region: city.r, latitude: city.la, longitude: city.lo, population: city.p };
}

// The largest cities of a country, for scrollable browsing before typing.
export function browseCities(countryCode: string, limit = 100): CitySuggestion[] {
  return cities.filter(city => city.c === countryCode).sort((a, b) => b.p - a.p).slice(0, limit).map(toSuggestion);
}

function rank(city: CityRecord, query: string): number {
  const name = city.n.toLowerCase();
  const ascii = city.a.toLowerCase();
  if (name === query || ascii === query) return 0;
  if (name.startsWith(query) || ascii.startsWith(query)) return 1;
  if (name.split(/[\s-]+/).some(word => word.startsWith(query)) || ascii.split(/[\s-]+/).some(word => word.startsWith(query))) return 2;
  return 3;
}

// Case-insensitive partial matching across the whole dataset (or one country),
// ranked by match quality then population. Identical city names in different
// regions stay separate so the UI can disambiguate them.
export function searchCities(query: string, countryCode?: string, limit = 12): CitySuggestion[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];
  return cities
    .filter(city => (!countryCode || city.c === countryCode) && (city.n.toLowerCase().includes(normalized) || city.a.toLowerCase().includes(normalized)))
    .map(city => ({ city, score: rank(city, normalized) }))
    .sort((a, b) => a.score - b.score || b.city.p - a.city.p)
    .slice(0, limit)
    .map(entry => toSuggestion(entry.city));
}
