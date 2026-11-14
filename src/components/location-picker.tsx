import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ChevronDown, Loader2, MapPin, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { browseCountryCities, listCountries, searchCitySuggestions } from '@/lib/location.functions';
import { flagEmoji, toLocationValue, type CitySuggestion, type CountryOption, type LocationValue } from '@/lib/locations';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  id: string;
  label: string;
  value: LocationValue | null;
  onSelect: (location: LocationValue | null) => void;
  placeholder?: string;
}

// Flight-booking-style location picker: direct city autocomplete plus
// country → city browsing. A location is only saved when the user explicitly
// selects a suggestion; free text is never treated as a valid city.
export function LocationPicker({ id, label, value, onSelect, placeholder = 'Search a city' }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'browse'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countryFilter, setCountryFilter] = useState('');
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [countryCities, setCountryCities] = useState<CitySuggestion[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);
  const cache = useRef(new Map<string, CitySuggestion[]>());
  const search = useServerFn(searchCitySuggestions);
  const browse = useServerFn(browseCountryCities);
  const loadCountries = useServerFn(listCountries);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open || countries.length) return;
    void loadCountries().then(setCountries).catch(() => {});
  }, [open, countries.length, loadCountries]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); setSearching(false); return; }
    const key = trimmed.toLowerCase();
    const cached = cache.current.get(key);
    if (cached) { setResults(cached); setActive(0); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      void search({ data: { query: trimmed } })
        .then(found => { cache.current.set(key, found); setResults(found); setActive(0); })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  const chooseCountry = (next: CountryOption) => {
    setCountry(next);
    setCityFilter('');
    setLoadingCities(true);
    void browse({ data: { countryCode: next.code } })
      .then(found => { setCountryCities(found); setActive(0); })
      .catch(() => setCountryCities([]))
      .finally(() => setLoadingCities(false));
  };

  const select = (city: CitySuggestion) => {
    onSelect(toLocationValue(city));
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  const visibleCities = useMemo(() => {
    const filter = cityFilter.trim().toLowerCase();
    if (!filter) return countryCities;
    return countryCities.filter(city => city.cityName.toLowerCase().includes(filter));
  }, [countryCities, cityFilter]);

  const visibleCountries = useMemo(() => {
    const filter = countryFilter.trim().toLowerCase();
    if (!filter) return countries;
    return countries.filter(option => option.name.toLowerCase().includes(filter));
  }, [countries, countryFilter]);

  const onListKeyDown = (event: React.KeyboardEvent, items: CitySuggestion[]) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(current => Math.min(current + 1, items.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(current => Math.max(current - 1, 0)); }
    if (event.key === 'Enter' && items[active]) { event.preventDefault(); select(items[active]); }
  };

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return <div className="location-field">
    <span id={`${id}-label`} className="text-xs font-semibold text-muted-foreground">{label}</span>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" id={id} aria-labelledby={`${id}-label`} aria-haspopup="listbox" aria-expanded={open} className={cn('location-trigger', !value && 'text-muted-foreground')}>
          <MapPin size={16} className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-left">
            {value ? <>{flagEmoji(value.countryCode)} {value.cityName}<span className="text-muted-foreground">, {value.countryName}</span></> : placeholder}
          </span>
          <ChevronDown size={15} className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="location-panel w-[min(24rem,calc(100vw-3rem))] p-0" align="start">
        <div className="flex border-b border-border" role="tablist">
          {(['search', 'browse'] as const).map(tab => <button key={tab} type="button" role="tab" aria-selected={mode === tab} onClick={() => setMode(tab)} className={cn('flex-1 px-4 py-2.5 text-xs font-semibold capitalize', mode === tab ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground')}>{tab === 'search' ? 'Search cities' : 'Browse countries'}</button>)}
        </div>
        {mode === 'search' && <div className="p-3">
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <input autoFocus value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => onListKeyDown(event, results)} placeholder="Type a city name in English" aria-label="Search cities" aria-autocomplete="list" aria-controls={`${id}-results`} className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            {searching && <Loader2 size={14} className="shrink-0 animate-spin text-muted-foreground" />}
          </div>
          <ul ref={listRef} id={`${id}-results`} role="listbox" aria-label="City suggestions" className="mt-2 max-h-64 overflow-y-auto">
            {results.map((city, index) => <li key={city.cityId} role="option" aria-selected={index === active} data-active={index === active}>
              <button type="button" onMouseEnter={() => setActive(index)} onClick={() => select(city)} className={cn('location-option', index === active && 'bg-accent')}>
                <span className="text-base leading-none">{flagEmoji(city.countryCode)}</span>
                <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{city.cityName}</span><span className="block truncate text-xs text-muted-foreground">{city.region ? `${city.region}, ` : ''}{city.countryName}</span></span>
              </button>
            </li>)}
            {!searching && query.trim().length >= 2 && !results.length && <li className="px-3 py-4 text-center text-xs text-muted-foreground">No matching cities. Try another spelling.</li>}
            {query.trim().length < 2 && <li className="px-3 py-4 text-center text-xs text-muted-foreground">Type at least two letters to search over 34,000 cities.</li>}
          </ul>
        </div>}
        {mode === 'browse' && <div className="p-3">
          {!country && <>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
              <Search size={14} className="shrink-0 text-muted-foreground" />
              <input autoFocus value={countryFilter} onChange={event => setCountryFilter(event.target.value)} placeholder="Find a country" aria-label="Find a country" className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <ul className="mt-2 max-h-64 overflow-y-auto" aria-label="Countries">
              {visibleCountries.map(option => <li key={option.code}>
                <button type="button" onClick={() => chooseCountry(option)} className="location-option">
                  <span className="text-base leading-none">{flagEmoji(option.code)}</span>
                  <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{option.name}</span>
                </button>
              </li>)}
              {!visibleCountries.length && <li className="px-3 py-4 text-center text-xs text-muted-foreground">No matching country.</li>}
            </ul>
          </>}
          {country && <>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCountry(null)} aria-label="Back to countries" className="flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /></button>
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3">
                <Search size={14} className="shrink-0 text-muted-foreground" />
                <input value={cityFilter} onChange={event => { setCityFilter(event.target.value); setActive(0); }} onKeyDown={event => onListKeyDown(event, visibleCities)} placeholder={`Cities in ${country.name}`} aria-label={`Cities in ${country.name}`} className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                {loadingCities && <Loader2 size={14} className="shrink-0 animate-spin text-muted-foreground" />}
              </div>
            </div>
            <ul ref={listRef} role="listbox" aria-label={`Cities in ${country.name}`} className="mt-2 max-h-56 overflow-y-auto">
              {visibleCities.map((city, index) => <li key={city.cityId} role="option" aria-selected={index === active} data-active={index === active}>
                <button type="button" onMouseEnter={() => setActive(index)} onClick={() => select(city)} className={cn('location-option', index === active && 'bg-accent')}>
                  <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{city.cityName}</span>{city.region && <span className="block truncate text-xs text-muted-foreground">{city.region}</span>}</span>
                </button>
              </li>)}
              {!loadingCities && !visibleCities.length && <li className="px-3 py-4 text-center text-xs text-muted-foreground">No matching cities.</li>}
            </ul>
          </>}
        </div>}
      </PopoverContent>
    </Popover>
  </div>;
}
