# RoomScape 🛋️

RoomScape (also styled as Roomscape) is an open-source, AI-powered virtual room staging web application. It helps real estate professionals, interior designers, and homeowners transform empty, unfurnished spaces into beautifully styled rooms in minutes.

By uploading photos of empty rooms and providing styling preferences (or reference images), RoomScape automatically analyzes design styles and stages the space with realistic furniture.

---

## ✨ Features

- **Design Studio**: An image-led workspace with room type, visual style cards, colour palettes, furnishing density, optional reference analysis, and a design brief. Upload one room photo per design.
- **Reference Image Styling Analysis**: Users can upload a reference image representing their desired aesthetic. The application calls an AI-powered analyzer to extract styling details (color palettes, furniture types, layout principles, and materials) and generate precise instructions.
- **Detailed Custom Controls**: Specify text prompts to direct the layout, design themes (minimalist, modern, industrial, rustic, etc.), and lighting properties.
- **Projects Dashboard**: Browse saved rooms with search and status filters. Compare original and staged images using a keyboard-accessible slider, expand and zoom results, download images, and refine a design. Revision history is available for the current studio session.
- **Predefined Furniture Library**: Manage catalogs of styling items and furniture types to inject directly into the staging pipeline.
- **Modern User Interface**: A responsive, accessible dashboard styled with Vanilla CSS, Tailwind CSS, and Radix UI components (shadcn-ui), complete with light/dark theme support and mobile generation controls.

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS & Vanilla CSS (with custom theme support)
- **UI Components**: shadcn-ui (built on top of Radix UI primitives)
- **State & Data Fetching**: TanStack Query (React Query) & React Context API
- **Routing**: React Router DOM v6
- **Icons**: Lucide React

### Backend & Database (Supabase)

- **Database**: PostgreSQL (provided by Supabase)
- **Authentication**: Supabase Auth (User sign-up, sign-in, password reset)
- **File Storage**: Supabase Storage for uploading original room images and storing staged results
- **Edge Functions**: Deno-based Edge Functions executing serverless logic:
  - `gemini-analyzer`: Analyzes reference images using Google Gemini to extract styling guidelines.
  - `generate-staged-room`: Coordinates staging operations with Stability AI.

### AI Model Integrations

- **Google Gemini API**: Utilized for visual reasoning to analyze room dimensions, reference styling patterns, and output structured layout instructions.
- **Stability AI API**: Leveraged to run state-of-the-art image-to-image translation, controlnet, or inpainting algorithms to render furniture into the empty room image coordinates.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** (v18.x or later; Node.js 22 is recommended and was used for validation)
- **npm** (or Bun / Yarn)
- **Supabase CLI** (optional, for local backend development or deploying Edge Functions)

---

### Local Frontend Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/jsodeh/room-scape.git
   cd room-scape
   ```

2. **Install dependencies**:

   ```bash
   npm ci
   ```

3. **Configure the frontend**:
   ```bash
   cp .env.example .env.local
   ```
   Fill `VITE_SUPABASE_ANON_KEY` in `.env.local` with the new project's public API key.

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:8080`.

Copy `.env.example` to `.env.local`, then fill `VITE_SUPABASE_ANON_KEY` with the public API key for project `fkptdunoizrlkqwdmcyi`. The active client reads these environment variables; the old project's key and URL are no longer used. See [the deployment and environment-variable inventory](docs/SUPABASE_DEPLOYMENT.md) for database migrations, Edge Functions, provider secrets, and Vercel configuration. The new public key must also be set in Vercel before deploying this branch.

---

### Supabase Backend & Edge Functions Setup

RoomScape relies on Supabase Edge Functions to safely interact with Google Gemini and Stability AI without exposing API keys on the client-side.

1. **Log in to Supabase CLI**:

   ```bash
   supabase login
   ```

2. **Link the CLI to your project**:
   Get your project reference ID from your Supabase Dashboard settings and run:

   ```bash
   supabase link --project-ref fkptdunoizrlkqwdmcyi
   ```

3. **Set Secrets for Edge Functions**:
   Before deploying, set up the required API keys as secrets within your Supabase project:

   ```bash
   supabase secrets set GEMINI_API_KEY="your-gemini-api-key"
   supabase secrets set STABILITY_API_KEY="your-stability-api-key"
   ```

4. **Deploy Edge Functions**:
   Deploy the functions defined under the `supabase/functions/` folder:

   ```bash
   supabase functions deploy gemini-analyzer
   supabase functions deploy generate-staged-room
   ```

5. **Local Edge Function Development (Optional)**:
   If you want to run Edge Functions locally, set up a local `.env` file inside `supabase/functions/` or use `--env-file`:
   ```bash
   supabase functions serve --env-file supabase/.env.local
   ```

---

## 📂 Project Structure

```
├── public/                 # Static assets
├── supabase/
│   ├── config.toml        # Supabase project configuration
│   └── functions/          # Deno Edge Functions
│       ├── gemini-analyzer/       # Analyzes reference images using Gemini
│       └── generate-staged-room/  # Performs virtual staging via Stability AI
├── src/
│   ├── components/         # Reusable React components (Header, Footer, UI primitives)
│   │   ├── staging-wizard/ # Multistep staging wizard (Upload, Instruct, View)
│   │   └── ui/             # shadcn-ui customized primitives
│   ├── context/            # AuthContext and StagingContext for global state
│   ├── hooks/              # Custom React hooks (e.g., useStagingProcessor)
│   ├── integrations/       # Supabase client setup and DB types
│   ├── pages/              # View pages (Index/Home, Auth, Profile, ProjectDetail)
│   ├── services/           # Api service wrappers (stagingService, furnitureService)
│   ├── types/              # TypeScript interface definitions
│   └── utils/              # Helper utilities
├── tailwind.config.ts      # Tailwind styling configuration
└── vite.config.ts          # Vite build parameters
```

---

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](file:///Users/apple/Documents/Dev/RoomScape/room-scape/LICENSE) for more details.

## Redesign development and validation

See [the implementation plan](docs/IMPLEMENTATION_PLAN.md) for scope, completed work, and the next backend phase. Studio preferences are stored in browser session storage. The selected photo remains in memory through sign-in and navigation; it must be uploaded again after a page refresh.

```sh
npm ci
npm run dev
npm run typecheck
npm run build
# Install a Playwright browser once if one is not already available:
npx playwright install chromium
npm run test:e2e
```

The browser suite runs its own Vite server on port 4173. To use an installed Chromium binary, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium`. In the prepared cloud environment the path is `/usr/bin/chromium`. Tests mock Supabase authentication, storage, project records, and generation responses; they never write to live projects or call paid inference services. Live backend credentials, storage policies, model quality, and full server authorization require separate integration validation.

The checked-in room image is AI-generated illustrative artwork. Inspiration thumbnails do not represent a user's generated result. Preserving architecture is sent as an instruction to the existing model; it is not a guaranteed editing constraint.
