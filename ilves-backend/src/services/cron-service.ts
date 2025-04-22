import cron from 'node-cron';
import { db } from '../db/index.js';
import { prizesTable, type PrizeInsert } from '../db/schema.js';
import 'dotenv/config';

// Default: Midnight daily
const PRIZE_GENERATION_SCHEDULE = process.env.PRIZE_GENERATION_SCHEDULE || '0 0 * * *';

async function generateDailyPrizes() {
    console.log('Running daily prize generation job...');
    const now = new Date();
    const availableDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const prizesToInsert: PrizeInsert[] = [];

    // 1 High Tier Prize
    prizesToInsert.push({
        tier: 'high',
        awarded: false,
        availableDate: availableDate,
    });

    // 2 Medium Tier Prizes
    for (let i = 0; i < 2; i++) {
        prizesToInsert.push({
            tier: 'medium',
            awarded: false,
            availableDate: availableDate,
        });
    }

    // 3 Low Tier Prizes
    for (let i = 0; i < 3; i++) {
        prizesToInsert.push({
            tier: 'low',
            awarded: false,
            availableDate: availableDate,
        });
    }

    try {
        await db.insert(prizesTable).values(prizesToInsert);
        console.log(`Successfully inserted ${prizesToInsert.length} prizes for ${availableDate.toDateString()}.`);
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

    // Optional: Run once immediately on startup if needed for testing or initial population
    generateDailyPrizes();
}
