#!/bin/bash

# Exit on error
set -e

echo "Fixing lint errors..."

# Fix unused variables by commenting them out
echo "Fixing unused variables..."

# app/components/RouteStations.tsx
sed -i 's/import { RailcamStation } from/\/\/ import { RailcamStation } from/' app/components/RouteStations.tsx

# app/components/TrainInstance.tsx
sed -i 's/import { Train, RailcamStation } from/import { Train } from/' app/components/TrainInstance.tsx

# app/components/TrainStatus.tsx
sed -i 's/const nextStationName = /\/\/ const nextStationName = /' app/components/TrainStatus.tsx

# app/components/YouTubePlayer.tsx
sed -i 's/const width = /\/\/ const width = /' app/components/YouTubePlayer.tsx
sed -i 's/const height = /\/\/ const height = /' app/components/YouTubePlayer.tsx
sed -i 's/}, \[videoId\]);/}, \[videoId, getYoutubeEmbedUrl\]);/' app/components/YouTubePlayer.tsx

# app/components/admin/AdminAuthCheck.tsx
sed -i 's/const router = /\/\/ const router = /' app/components/admin/AdminAuthCheck.tsx

# app/components/admin/LoginForm.tsx
sed -i 's/const router = /\/\/ const router = /' app/components/admin/LoginForm.tsx

# app/utils/amtrak-scraper.ts
sed -i 's/export function getStationByName/\/\/ export function getStationByName/' app/utils/amtrak-scraper.ts
sed -i 's/let actualArrivalTime/const actualArrivalTime/' app/utils/amtrak-scraper.ts
sed -i 's/const fs = require/import fs from/' app/utils/amtrak-scraper.ts
sed -i 's/const path = require/import path from/' app/utils/amtrak-scraper.ts
sed -i 's/: any/: unknown/' app/utils/amtrak-scraper.ts

# app/utils/auth.ts
sed -i 's/import { NextRequest, NextResponse } from/\/\/ import { NextRequest, NextResponse } from/' app/utils/auth.ts
sed -i 's/: any/: unknown/' app/utils/auth.ts

# app/utils/predictions.ts
sed -i 's/let minutesAway/const minutesAway/' app/utils/predictions.ts
sed -i 's/const timeZoneOffset = /\/\/ const timeZoneOffset = /' app/utils/predictions.ts
sed -i 's/const instanceInfo = /\/\/ const instanceInfo = /g' app/utils/predictions.ts

# app/utils/scraper.ts
sed -i 's/const railcamStations = /\/\/ const railcamStations = /' app/utils/scraper.ts
sed -i 's/export function createTrainStatus/\/\/ export function createTrainStatus/' app/utils/scraper.ts
sed -i 's/const mtOffset = /\/\/ const mtOffset = /' app/utils/scraper.ts
sed -i 's/const localTime = /\/\/ const localTime = /' app/utils/scraper.ts
sed -i 's/const createAdjustedDate = /\/\/ const createAdjustedDate = /' app/utils/scraper.ts

# pages/api/admin/auth.ts
sed -i "s/as 'text'/as const/" pages/api/admin/auth.ts

# pages/api/admin/logout.ts
sed -i 's/import { clearAuthFromLocalStorage } from/\/\/ import { clearAuthFromLocalStorage } from/' pages/api/admin/logout.ts
sed -i "s/as 'text'/as const/" pages/api/admin/logout.ts

# pages/api/cron.ts
sed -i 's/let status/const status/' pages/api/cron.ts

# pages/api/scrape.ts
sed -i 's/const useMockData = /\/\/ const useMockData = /' pages/api/scrape.ts
sed -i 's/let trainStatus/const trainStatus/' pages/api/scrape.ts

# pages/api/select-view.ts
sed -i 's/import { Station, RailcamStation } from/import { Station } from/' pages/api/select-view.ts
sed -i 's/import { appConfig } from/\/\/ import { appConfig } from/' pages/api/select-view.ts

# Fix the React Hook called conditionally in TrainStatus.tsx
echo "Fixing conditional React Hook in TrainStatus.tsx..."
sed -i 's/if (train.status === "ARRIVED_FINAL_DESTINATION") {/\/\/ Moved useMemo outside of conditional\nconst stationInfo = useMemo(() => {\n  if (train.status === "ARRIVED_FINAL_DESTINATION") {/' app/components/TrainStatus.tsx
sed -i 's/  return useMemo(() => {/  return {/' app/components/TrainStatus.tsx
sed -i 's/  }, \[train.finalDestination\]);/  };/' app/components/TrainStatus.tsx
sed -i 's/}/}\n}, \[train.status, train.finalDestination\]);/' app/components/TrainStatus.tsx

echo "Lint errors fixed! Running lint to verify..."
npm run lint
