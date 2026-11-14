// Browser-safe location types and helpers. The GeoNames dataset itself is only
// imported by server modules so the browser bundle stays small.
export interface CountryOption { code: string; name: string; }
export interface CitySuggestion { cityId: number; cityName: string; countryCode: string; countryName: string; region: string; latitude: number; longitude: number; population: number; }
// The normalized location stored on the profile. Only ever built from an
// explicit suggestion selection — never from free text.
export interface LocationValue { cityId: number; cityName: string; countryCode: string; countryName: string; region?: string | undefined; latitude?: number | undefined; longitude?: number | undefined; }
export function toLocationValue(city: CitySuggestion): LocationValue {
  return { cityId: city.cityId, cityName: city.cityName, countryCode: city.countryCode, countryName: city.countryName, region: city.region || undefined, latitude: city.latitude, longitude: city.longitude };
}
export function flagEmoji(countryCode: string): string {
  if (!/^[A-Z]{2}$/.test(countryCode)) return '';
  return String.fromCodePoint(...[...countryCode].map(letter => 0x1f1e6 + letter.charCodeAt(0) - 65));
}
export function locationLabel(location: LocationValue): string {
  return `${location.cityName}, ${location.countryName}`;
}
