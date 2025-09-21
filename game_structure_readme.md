
# Game Templates System

This document explains how **Game Templates** are structured, published, consumed by merchants, and used at runtime in the Tribes platform.

---

## 📖 Table of Contents
1. [Game Template Structure](#-game-template-structure)
2. [Admin Workflow](#-admin-workflow)
3. [Merchant Workflow](#-merchant-workflow)
4. [Flexibility for Different Game Types](#-flexibility-for-different-game-types)
5. [Runtime Payload](#-runtime-payload)
6. [Flip-Card Sample Response](#-flip-card-sample-response)
7. [Summary](#-summary)

---

## 📦 Game Template Structure

Each `GameTemplate` document defines everything the **frontend** and **merchant dashboard** need to render a configurable game card.

### Fields
- **Identifiers**
  - `game_template_id` – auto-generated unique identifier
  - `game_template_name` – human-readable name
- **Metadata**
  - `description` – descriptive copy
  - `template_thumbnail_url` – catalog thumbnail
  - `template_metadata` – high-level info (use case, expected duration, etc.)
- **Options Array**
  - Configurable fields merchants must provide:
    - `input_name` (key)
    - `input_type` (`string`, `number`, `image`, `color`, etc.)
    - `default` (optional)
    - `required` (boolean)
- **Defaults**
  - `default_options` such as `game_background_image`
- **Status**
  - `status_enabled` (boolean) – controls visibility in catalog

---

## 🛠 Admin Workflow

Admin-only REST endpoints (guarded by `adminMiddleware`) provide CRUD operations under `/game-templates`.

### Endpoints
- **POST /game-templates**  
  Calls `GameTemplateService.createTemplate` to persist schema-compliant JSON including option definitions.
- **PUT /game-templates/:id**  
  Update template details or options.
- **DELETE /game-templates/:id**  
  Retire templates.
- **GET /game-templates**  
  List all templates (admin view).

### Registering a New Game Template
Admin provides:
- **Stable identifier** (`game_template_id` or `game_type`)
- **Metadata** (`description`, `template_thumbnail_url`)
- **Optional defaults** (`default_options`, `template_metadata`)
- **Options array** describing UI fields  
  Example:  
  - `"targetSeconds"` → number input, required, default = `30`  
  - `"ballAsset.url"` → image input  

> Publishing with `status_enabled: true` makes it available immediately in the merchant portal.

---

## 🏪 Merchant Workflow

Merchants access only curated (enabled) templates.

### Endpoints
- **GET /game-templates/merchant**  
  Returns only enabled templates.
- **GET /:game_template_id**  
  Fetch a specific template.
- **GET /:game_template_id/options**  
  Retrieve option definitions for pre-filling forms.

### Game Creation Flow
1. Merchant selects a template by `game_template_name`.
2. Dashboard collects option values from merchant.
3. Backend:
   - Loads the template
   - Validates required options
   - Merges defaults
   - Stores expanded options in the game document
4. Any uploaded assets are saved and linked to their option entries.

This ensures **all games follow the template contract**.

---

## 🎮 Flexibility for Different Game Types

Each template defines its own option schema, making the system highly flexible.

### Examples
- **Voice-Controlled Game (`vocal-lift`)**
  - Number inputs (timing thresholds)
  - String inputs (instructions)
  - Image inputs (assets)
  - Defaults (e.g., 30 seconds, SVG assets)

- **Card-Matching Game (`flip-card`)**
  - Number inputs for move/time limits
  - JSON or array inputs for card deck definition
  - Use `mongoose.Schema.Types.Mixed` or nested schemas to support structured data

### Best Practices
- Include `game_type` (enum) alongside `game_template_id`
- Require `description` and `template_thumbnail_url`
- Provide defaults to guide merchants

---

## 📡 Runtime Payload

The storefront calls:

```http
POST /games/list

The controller relays raw `Game` documents.
```
### Game Document Fields

-   **Metadata**  
    `game_id`, `game_template_name`, `merchant_id`, dates, status, prize map
    
-   **Options**  
    Array of:
    
    -   `input_name`
        
    -   `input_type`
        
    -   `value` (stored as string)
        
    -   `required`
        
-   **Prizes & Play Data**  
    e.g., `hard_play_count_limit`, `play_count`, `prize_distribution_strategy`
    

> ⚠️ Complex values (like card decks) must be **JSON-stringified** before saving and **parsed on the client**.


```
{
  "game_id": "flip-001",
  "game_template_name": "flip-card",
  "merchant_id": "merchant-demo",
  "name": "White Tiffin Flip & Match",
  "game_background_image": "",
  "game_logo_image": "",
  "options": [
    {
      "input_name": "gameDescription",
      "input_type": "string",
      "value": "Players flip cards to match pairs of dishes before they run out of moves.",
      "required": true
    },
    {
      "input_name": "moveLimit",
      "input_type": "number",
      "value": "5",
      "required": true
    },
    {
      "input_name": "initialRevealSeconds",
      "input_type": "number",
      "value": "3",
      "required": true
    },
    {
      "input_name": "cardUpflipSeconds",
      "input_type": "number",
      "value": "1",
      "required": true
    },
    {
      "input_name": "cardBackImage",
      "input_type": "image",
      "value": "/images/matching-game-assets/white-tiffin-assets/white-tiffin-logo.png",
      "required": true
    },
    {
      "input_name": "submissionEndpoint",
      "input_type": "string",
      "value": "/api/games/flip-card/flip-001/results",
      "required": true
    },
    {
      "input_name": "cards",
      "input_type": "string",
      "value": "[{\"id\":\"mee-siam-with-prawns\",\"type\":\"Mee Siam With Prawns\",\"image\":\"/images/matching-game-assets/white-tiffin-assets/mee-siam-with-prawns.png\",\"altText\":\"White Tiffin Mee Siam With Prawns card artwork\"}]",
      "required": true
    }
  ],
  "start_date": "2024-01-01T00:00:00.000Z",
  "end_date": "2024-12-31T23:59:59.000Z",
  "status": "created",
  "is_active": true,
  "hard_play_count_limit": 0,
  "play_count": 0,
  "prizes": {},
  "is_quests_enabled": false,
  "quests": [],
  "leaderboard_id": null,
  "prize_distribution_strategy": "cascade",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "__v": 0
}

```

# Game Creation Flow with Templates

This section describes the **end-to-end process** of creating a new game that merchants can select and users can play on the frontend.

---

## 🚀 Steps to Create a New Game

1. **Game Development**
   - Admin and team decide on a new game concept.
   - Game is built in **ReactJS**, ensuring **mobile compatibility**.
   - The game is dropped into the **frontend user app**.

2. **Frontend Initialisation**
   - The game is coded to initialise with **expected configuration fields** (e.g., background image, timers, assets).
   - These fields define the **contract** the backend must follow.

3. **Admin Creates Game Template**
   - An **admin** creates a new `GameTemplate` in the admin dashboard.
   - The `GameTemplate` must have **100% matching configuration fields** to the game initialiser on the frontend.
   - Template includes:
     - Metadata (name, description, thumbnail)
     - Option definitions (inputs merchants can edit)

4. **Template–Frontend Alignment**
   - **Critical requirement**: The template’s option fields **must match exactly** with the frontend’s expected fields.
   - This ensures that when a merchant configures a game, the values map directly into the frontend initialiser.

5. **Merchant Selection**
   - Merchants can now see the new template in their dashboard.
   - They select the game, review/edit its configurable fields (description, assets, timers, etc.).

6. **Merchant Game Creation**
   - When a merchant creates a game:
     - A **new game document** is generated in the backend.
     - It is tagged with a **unique `game_id`**.
     - The `GameTemplate` provides defaults and validation for required fields.

7. **Linking Game to Store**
   - Merchant links the created game to their store.
   - On the user landing page:
     - The game appears as part of the store experience.
     - Clicking the game loads the **merchant’s game instance**.

8. **User Gameplay**
   - The frontend game initialiser calls an API to fetch the **game instance document**.
   - This document includes all populated configuration fields.
   - Users play the customised version of the game based on merchant inputs.

9. **Submission & Rewards**
   - Upon completion:
     - The game calls a **submit API** with the `game_id` and user results.
     - Backend processes results and calculates rewards.
     - API response includes gameplay results and any **earned prizes**.

---

## 🎯 Why This Works

- **Reusability**: A single game template can power multiple campaigns across merchants.  
- **Customisation**: Each merchant can set different visuals, timings, or assets.  
- **Consistency**: Templates enforce schema alignment with frontend initialisers.  
- **Scalability**: New games require only:
  1. Frontend implementation  
  2. Matching `GameTemplate` schema  
  3. Merchant configuration  

---

## 📝 Example Flow

Admin Team → Build Game (ReactJS) → Add to User App
↓
Admin Dashboard → Create GameTemplate (matching config fields)
↓
Merchant Dashboard → Select & Configure Game
↓
Merchant Store → Game linked & visible on landing page
↓
User → Plays customised game
↓
Backend → Submit results + prizes issued


---

## ✅ Summary

1. **Admins** develop games and define matching templates.  
2. **Merchants** configure and launch customised game instances.  
3. **Users** play games tied to stores, earning prizes.  
4. **Backend** ensures results, validation, and prize distribution.  

This templating system allows **different merchants to run unique campaigns** using the **same game type**, but with different configurations, branding, and rewards.
