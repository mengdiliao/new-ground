import { describe, it, expect } from 'vitest';
import { getCountries, browseCities, searchCities } from '@/lib/location-data';
import { toLocationValue, flagEmoji } from '@/lib/locations';

describe('Global location dataset', () => {
  it('offers a full country list, not a small hardcoded set', () => {
    const countries = getCountries();
    expect(countries.length).toBeGreaterThan(200);
    expect(countries.map(country => country.code)).toContain('FI');
    expect(countries.map(country => country.code)).toContain('DK');
  });
  it('browses cities within a selected country', () => {
    const cities = browseCities('FI');
    expect(cities.length).toBeGreaterThan(10);
    expect(cities.every(city => city.countryCode === 'FI')).toBe(true);
    expect(cities[0]?.cityName).toBe('Helsinki');
    expect(browseCities('DK').every(city => city.countryCode === 'DK')).toBe(true);
  });
  it('searches cities in English, case-insensitive and partial', () => {
    const results = searchCities('copen');
    expect(results[0]?.cityName).toBe('Copenhagen');
    expect(results[0]?.countryCode).toBe('DK');
    expect(searchCities('HELSINKI')[0]?.cityName).toBe('Helsinki');
  });
  it('disambiguates cities with identical names', () => {
    const results = searchCities('Springfield', undefined, 12);
    expect(results.length).toBeGreaterThan(1);
    expect(new Set(results.map(city => city.cityId)).size).toBe(results.length);
  });
  it('selecting a suggestion saves the full city and country identity', () => {
    const city = searchCities('Helsinki')[0];
    if (!city) throw new Error('Helsinki missing');
    const location = toLocationValue(city);
    expect(location.cityName).toBe('Helsinki');
    expect(location.countryCode).toBe('FI');
    expect(location.countryName).toBe('Finland');
    expect(typeof location.cityId).toBe('number');
    expect(location.latitude).toBeCloseTo(60.17, 1);
  });
  it('requires at least two characters before suggesting', () => {
    expect(searchCities('h')).toEqual([]);
    expect(searchCities('  ')).toEqual([]);
  });
  it('renders a flag emoji from a country code', () => {
    expect(flagEmoji('FI')).toBe('🇫🇮');
    expect(flagEmoji('xx')).toBe('');
  });
});
