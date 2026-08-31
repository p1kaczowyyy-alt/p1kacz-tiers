# P1KACZ TIERS — Minecraft PvP Rankings

Prawdziwa aplikacja webowa: React + TypeScript + Tailwind CSS na froncie,
Supabase (PostgreSQL + Auth + Row Level Security) jako backend.

Zawiera: rankingi 13 kategorii PvP, tiery HT1–LT5, system głosowania na
rankupy z zabezpieczeniem przed podwójnym głosem, panel administratora
(gracze, rankupy, kategorie, użytkownicy), statystyki, profile graczy,
logowanie (email/hasło + opcjonalnie Discord OAuth).

**Kit Bed został całkowicie usunięty i nie istnieje nigdzie w kodzie ani w bazie.**

---

## Zanim zaczniesz — czego potrzebujesz

To NIE jest statyczny mockup — potrzebuje prawdziwej bazy danych. Musisz
założyć własny (darmowy) projekt Supabase i wkleić 2 klucze do `.env`.
Bez tego kroku strona się otworzy, ale nic się nie załaduje (pusta lista
graczy, logowanie nie zadziała) — to normalne, dopóki nie podłączysz bazy.

Zajmuje to około 5–10 minut.

---

## Krok 1 — Załóż projekt Supabase

1. Wejdź na https://supabase.com i załóż darmowe konto.
2. Kliknij **New Project**, wybierz nazwę (np. `p1kacz-tiers`) i hasło do bazy.
3. Poczekaj aż projekt się utworzy (ok. 2 minuty).

## Krok 2 — Uruchom schemat bazy danych

1. W panelu Supabase wejdź w **SQL Editor**.
2. Otwórz plik `supabase/schema.sql` z tego projektu, skopiuj całą zawartość.
3. Wklej do SQL Editora i kliknij **Run**.
4. To utworzy wszystkie tabele (`players`, `categories`, `player_tiers`,
   `votes`, `rankup_requests`, `rankup_history`, `profiles`), 13 kategorii
   PvP, funkcje głosowania/zatwierdzania rankupów oraz wszystkie polityki
   Row Level Security.

## Krok 3 — Pobierz klucze API

1. W Supabase: **Project Settings → API**.
2. Skopiuj `Project URL` oraz `anon public` key.

## Krok 4 — Skonfiguruj projekt lokalnie

```bash
cp .env.example .env
```

Wklej do `.env`:

```
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-anon-key
```

Zainstaluj zależności i uruchom lokalnie:

```bash
npm install
npm run dev
```

Aplikacja wystartuje pod `http://localhost:5173`.

## Krok 5 — Zostań adminem

1. Zarejestruj się w aplikacji normalnie (przycisk **Login → Register**).
2. W Supabase wejdź w **SQL Editor** i uruchom (podmieniając username):

```sql
update public.profiles set role = 'admin' where username = 'TwojUsername';
```

3. Odśwież stronę — w navbarze pojawi się **⚙️ Admin Panel**.

## Krok 6 (opcjonalnie) — Discord OAuth

W Supabase: **Authentication → Providers → Discord**, wklej Client ID/Secret
z Discord Developer Portal. Bez tego kroku logowanie email+hasło działa
od razu, przycisk Discord po prostu nie zadziała, dopóki nie skonfigurujesz providera.

---

## Wdrożenie na Cloudflare Pages

Wygenerowany zip zawiera już plik `public/_redirects` potrzebny, żeby
routing React Router działał poprawnie na Cloudflare Pages (SPA fallback).

### Opcja A — przez dashboard Cloudflare (najprostsza, bez Gita)

1. Zbuduj projekt lokalnie: `npm install && npm run build` — powstanie folder `dist/`.
2. Wejdź na https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Upload assets**.
3. Wgraj zawartość folderu `dist/`.
4. W **Settings → Environment variables** dodaj `VITE_SUPABASE_URL` i
   `VITE_SUPABASE_ANON_KEY` — ale uwaga: przy uploadzie gotowego `dist/`
   zmienne muszą być ustawione PRZED `npm run build`, bo Vite wypala je
   do kodu w czasie builda. Dlatego zalecana jest Opcja B.

### Opcja B — przez Git (zalecana, umożliwia auto-rebuild)

1. Wrzuć ten projekt do repozytorium GitHub/GitLab.
2. W Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
3. Wybierz repo. Ustawienia builda:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. W **Settings → Environment variables** dodaj:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy — Cloudflare zbuduje projekt z Twoimi kluczami wbudowanymi poprawnie.

---

## Dodawanie graczy

Po zalogowaniu jako admin: **Admin Panel → Players → + ADD PLAYER**.
Podaj Minecraft username, Minecraft UUID (np. z https://mcuuid.net) i
rating początkowy. Gracz automatycznie dostaje wszystkie 13 kategorii
ustawione na `LT5`. Tiery każdej kategorii zmienisz w tym samym panelu.

## Struktura projektu

```
src/
  components/   — komponenty współdzielone (Navbar, karty graczy, itd.)
  context/      — AuthContext (sesja Supabase + rola)
  hooks/        — hooki do pobierania danych
  lib/          — klient Supabase, mapowanie tierów
  pages/        — Rankings, Players, PlayerProfile, Statistics, Rules,
                  Login, UserProfile, AdminPanel
  types/        — typy TypeScript zgodne ze schematem bazy
supabase/
  schema.sql    — pełny schemat: tabele, RLS, funkcje głosowania/rankupów
```

## Bezpieczeństwo

- Wszystkie tabele mają włączone Row Level Security.
- Głosy i zatwierdzanie rankupów idą wyłącznie przez funkcje
  `SECURITY DEFINER` (`cast_rankup_vote`, `approve_rankup`, `reject_rankup`),
  które sprawdzają uprawnienia po stronie bazy — nie tylko przez ukrywanie
  przycisków we froncie.
- `unique (user_id, player_id, category_id, rankup_request_id)` na tabeli
  `votes` fizycznie uniemożliwia podwójne głosowanie na poziomie bazy danych.
- Nigdy nie umieszczaj `service_role` key we froncie — używany jest wyłącznie
  klucz `anon public`, zgodnie z założeniami RLS.
