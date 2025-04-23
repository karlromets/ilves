import cron from 'node-cron';
import { db } from '../db/index.js';
import { prizesTable, type PrizeInsert } from '../db/schema.js';
import 'dotenv/config';
import { eq } from 'drizzle-orm';

// Default: Midnight daily
const PRIZE_GENERATION_SCHEDULE = process.env.PRIZE_GENERATION_SCHEDULE || '0 0 * * *';

export async function generateDailyPrizes() {
    console.log('Checking daily prize generation job...');
    const now = new Date();
    // Get the start of today (UTC, since cron runs in UTC)
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Check if prizes for today already exist
    const existingPrizes = db.select({ id: prizesTable.id })
                                   .from(prizesTable)
                                   .where(eq(prizesTable.availableDate, startOfToday))
                                   .limit(1)
                                   .get();

    if (existingPrizes) {
        console.log(`Prizes for ${startOfToday.toDateString()} already exist. Skipping generation.`);
        return;
    }

    console.log(`Generating prizes for ${startOfToday.toDateString()}...`);
    const prizesToInsert: PrizeInsert[] = [];

    // 1 High Tier Prize
    prizesToInsert.push({
        tier: 'high',
        awarded: false,
        availableDate: startOfToday,
    });

    // 2 Medium Tier Prizes
    for (let i = 0; i < 2; i++) {
        prizesToInsert.push({
            tier: 'medium',
            awarded: false,
            availableDate: startOfToday,
        });
    }

    // 3 Low Tier Prizes
    for (let i = 0; i < 3; i++) {
        prizesToInsert.push({
            tier: 'low',
            awarded: false,
            availableDate: startOfToday,
        });
    }

    try {
        await db.insert(prizesTable).values(prizesToInsert);
        console.log(`Successfully inserted ${prizesToInsert.length} prizes for ${startOfToday.toDateString()}.`);
    } catch (error) {
        console.error('Failed to insert daily prizes:', error);
    }
}

export function schedulePrizeGeneration() {
    // Validate the cron schedule pattern (basic check)
    if (!cron.validate(PRIZE_GENERATION_SCHEDULE)) {
        console.error(`Invalid PRIZE_GENERATION_SCHEDULE: "${PRIZE_GENERATION_SCHEDULE}". Defaulting to midnight.`);
        cron.schedule('0 0 * * *', generateDailyPrizes, {
            timezone: "UTC"
        });
    } else {
         cron.schedule(PRIZE_GENERATION_SCHEDULE, generateDailyPrizes, {
            timezone: "UTC"
        });
    }

    console.log(`Prize generation scheduled with pattern: "${PRIZE_GENERATION_SCHEDULE}"`);

    console.log("Running initial prize generation check on startup...");
    generateDailyPrizes();
}
