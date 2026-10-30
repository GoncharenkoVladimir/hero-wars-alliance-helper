# Дані гри Hero Wars Alliance

Довідник по даних у `src/data/`. Прочитай його, перш ніж знову досліджувати дампи.

## Файли

| Файл | У git? | Що це |
|---|---|---|
| `dame-data.json` | **ні** (`.gitignore`) | Сирий дамп сесії гравця (742 KB). Містить `sessionId`, `authToken`, токени, id акаунтів і нікнейми гравців клану. Не комітити і нікуди не відправляти. |
| `game-data.sanitized.json` | так | Санітизований дамп: білий список блоків, без облікових даних, id псевдонімізовані (257 KB). |
| `configs/*.json` | лише 12 потрібних | Підмножина статичних remote-конфігів гри з CDN (388 KB) + `configs/_index.json` (id індексу, хеш, URL, розмір кожного). Решта ігнорується через `.gitignore`. |
| `heroes.json` | так | Герої для застосунку (82, формат як блок `heroes` + `name`/`nameEn`/`img`). Синхронізовано з дампом 2026-10-30 через `mergeHeroes`; для героя 78 немає `img`, а `nameEn` = `Vodrin` (транслітерація, офіційну англійську назву не перевірено). |
| `hero-counters.json` | так | Таблиця «Best Hero Counters Quick List» з omg.rocks (80 героїв). `counters` — список варіантів; вкладений масив = комбо (`Orion + Mojo`), `raw` — оригінальний текст клітинки. `id` із `heroes.json`, `null` для невідомих (Elmir, Ninja Turtles) і категорії `AoE heroes`. Для 37 героїв є `howToCounter` (секція «How to counter <hero>»): `title`, `sectionId`, `detailsUrl` («More details»), `entries[]` з `label` (жирне ім'я контр-героя або назва зв'язки на кшталт `Way of Eternity`), `labelId`, `text` (опис) і `mentionedIds` (інші герої з тексту, без самого героя). Записи без жирного імені (Cleaver, Fafnir, Julius, Octavia, Tristan) мають `label: null`; у решти героїв `howToCounter: null`. |
| `player.ts` | так | `INITIAL_PLAYER` (Kragen, 120, сервер 1175, дата дампа 2026-10-30). |

Скрипти (корінь репо):

```bash
# 1. санітизація (читає dame-data.json, пише game-data.sanitized.json, у кінці перевіряє, що секрети не просочились)
node scripts/sanitize-dump.mjs [raw] [out]

# 2. завантаження конфігів зі списку KEEP у скрипті (індекс береться з санітизованого дампа; повторний запуск докачує лише змінені/відсутні)
node scripts/fetch-configs.mjs [dump] [outDir]
# усі 319 конфігів (~17 MB, у git не потраплять)
node scripts/fetch-configs.mjs --all
```

Новий дамп: поклади як `src/data/dame-data.json`, запусти обидва скрипти по черзі. Конфіги мають content-hash в URL, тож після оновлення клієнта індекс дає нові URL.

## Формат сирого дампа

`{ results: [ { ident, result: { response, ...billingsUpdate/endSpecialOffers/quests } } × 34 ], date }`

- Це пакетна відповідь API на логін. `date` — unix-час зняття (`1793351685` = 2026-10-30).
- `ident` — хеш **запиту**, а не типу даних; порядок блоків теж не гарантований. Тому блоки визнач **за вмістом** (сигнатури в `scripts/sanitize-dump.mjs`), а не за `ident` чи індексом.
- Версія клієнта: `trunk:0.847.0` (з `index.id` у блоці конфіг-індексу).

## Блоки дампа

Імена блоків — `ident` у санітизованому файлі (вони там замінені на назву типу).

| `ident` у sanitized | Сигнатура | Зміст |
|---|---|---|
| `configIndex` | `response.index.configs` | Індекс із 319 конфігів: `{ name: { url, preload } }`. Лише URL на CDN, самих даних немає. |
| `profile` | `name` + `accountId` + `serverId` | Профіль: `id`, `name` (`Kragen`), `level` 120, `serverId` 1175, `clanId`, `gold`, `starMoney`, `vipPoints`, `registrationTime`, `refillable[88]`, прапорці. |
| `inventory` | `consumable` + `gear` + `fragmentHero` | `{ категорія: { itemId: кількість } }`. Категорії: consumable, gear, coin, scroll, border, patron, fragmentHero/Gear/Scroll/Artifact/Titan. |
| `heroes` | словник, у кожного `power`+`artifacts`, id < 4000 | 82 герої, ключ = id героя (1…504). Поля нижче. |
| `titans` | словник з `power`, id ≥ 4000 | 29 титанів (4000–4053), ті самі поля без рун/талісманів. |
| `missions` | масив `{id, stars, triesSpent}` | 226 місій кампанії (223 з 3 зірками). |
| `teams` | `arena` + `grand` + `boss_fight` | 25 збережених складів: `arena`, `grand` (3×5), `clan_boss` (3×5), `brawl`, `eternal_story`, `dungeon_*` (титани) тощо. Значення — id героїв/титанів. |
| `arena` | `arenaPlace` + `grandPlace` | Місце на арені (11796) і grand (88), зліпки команд із білдом (скін, патрон, талісман). |
| `clan` | `clanData.clan` | Клан «Mystic Black Cats»: `clan` (30 `members`, activity, dungeonPoints), `membersStat[30]` (activity, `raidDamage` по босах), `stat`. |
| `expeditions` | `slotId` + `storyId` | 9 експедицій: `status`, `reward`, `duration`, `power`, `attemptsLeft`. |

### Поля героя (`heroes`)

- `id`, `level` (макс. 120), `xp`, `power`.
- `star` 1–6, `color` — ранг/колір спорядження (у даних 7–16; 16 = максимум, у 20 героїв).
- `skills` `{skillId: level}`, `upgradedSkills`.
- `artifacts[]` `{level, star, artifactType: weapon|book|ring}`.
- `skins` `{skinId: level}`, `currentSkin`, `baseSkinId`, `skinsInfo`, `currentSkinRank`.
- `runes[5]`, `hero_runes` `{id: level}`, `slots[4]`.
- `talisman` `{id, level, traitIds[]}` — лише в 28 героїв.
- `patronLevel`, `titanGiftLevel`, `titanCoinsSpent`.
- Імен у дампі немає — лише числові id (імена беруть із конфігів, див. нижче).

### Блоки, яких немає в санітизованому файлі (свідомо відкинуті)

Сесія і токени (`sessionId`, `supportLink`), сокет-блок (`authToken`, `token`, `topics`), GDPR/ad-згоди, налаштування клієнта, магазин і пропозиції (`billings`, `bundle`, 75 `addBilling`-офер), івенти, квести, підписка, поштові листи, `webshop_rule`. Якщо потрібен один з них — додай сигнатуру в `SIGNATURES` у скрипті.

## Що санітизується

- Видаляється: `offerWallId`, весь `clan.members[*].accountId`, `clan.blackList`, `clan.warriors`.
- Замінюється на псевдонім: `profile.accountId` → `"sanitized"` (потрібен лише як маркер для `src/lib/profileImport.ts`), всі `userId`/`ownerId`/`clanId`/`profile.id` → `user1…`/`clan1…` (стабільні в межах одного запуску), ключі, `id` і `name` учасників клану → `userN`.
- Залишено навмисно: нік власника (`profile.name`) і назва клану.
- Скрипт завершується з помилкою (exit 1), якщо в результаті лишилось будь-яке секретне значення або ключ на кшталт `token|session|auth|secret`.
- Сумісність: `extractFromProfileDump` з `src/lib/profileImport.ts` читає санітизований файл (гравець `Kragen`, 82 героя).

## Статичні конфіги (`configs/`)

Файл `<name>.json` = remote-конфіг `<name>`. У git відстежуються лише 12 (список `KEEP` у `scripts/fetch-configs.mjs`, дзеркало `!`-винятків у `.gitignore` після правила `src/data/configs/*`). Додаючи конфіг: допиши його в `KEEP` і додай `!src/data/configs/<name>.json` у `.gitignore`.

Зв'язки перевірені на дампі від 2026-10-30:

| Конфіг | Перевірка | Використання |
|---|---|---|
| `hero.json` | 82/82 героїв, 38/38 `fragmentHero` | `{id: {id, label, role, factionId}}`. **Імпортується в `src/lib/heroes.ts`** (`heroRole`, `heroFaction`) для фільтрів за роллю й фракцією. `label` — російською, тож імен для `ua`/`en` не дає. |
| `heroFaction.json` | 6/6 | 1 undead, 2 elf, 3 blessed, 4 chaos, 5 engineer, 6 mystic. Імпортується в `heroes.ts`; переклади назв — у `DICT.faction`. |
| `heroRole.json`, `heroClass.json`, `heroBattleStat.json` | — | 3 ролі (Front/Middle/Back), 7 класів (до героя не прив'язані), 17 характеристик (`label` російською). |
| `artifact.json` | 82/82 героїв мають зброю `id = 1000 + heroId` | Те, що читає `extractNameMapFromConfig`; також книги, персні, титанівські артефакти. |
| `artifactType.json`, `artifactBattleEffect.json` | — | Таблиці рівнів і вартості; статистика артефактів по рівнях. Для майбутнього калькулятора прокачки. |
| `itemColor.json` | — | Кольори предметів 1–6 (white…red). **Не** збігається з `color` героїв (7–16). |
| `patronSkill.json`, `squadHeroSkill.json`, `battleStatHeroClassBonusType.json` | патрони: 34 героя | Скіли патронів, назви скілів (частково), бонуси за клас. |

Чого в конфігах **немає** (перевірено): таблиці для `color` героїв 7–16 (тому `COLOR_META` — здогадка; `color: 11` у нього немає взагалі), конфігів скілів героїв (`skill.json` розпізнає лише 4 з 356 id), талісманів/трейтів, титанів, скінів, рун, англійських імен.

Зауваження:

- `hero.json` і `heroFaction.json` імпортуються з коду, тож потрапляють у бандл Vite (вони малі). Інші конфіги не імпортуй без потреби; для UI краще витягти потрібне в невеликий JSON.
- Повний набір (`--all`, 319 файлів, ~17 MB): найбільші `quest` 3,3 MB, `battleEffect` 2,7 MB, `globalMapSpriteObjectsIds` 1,9 MB. Решта — бази, глобальна мапа, форти, війна кланів, гача, оферти, дослідження, війська: для застосунку не потрібні. HEAD `content-length` показує стиснений розмір (1,9 MB), реальний — 17 MB.
