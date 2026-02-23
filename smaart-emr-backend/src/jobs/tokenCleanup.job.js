// ===============================================
// TOKEN CLEANUP BACKGROUND JOB
// Removes expired refresh tokens periodically
// ===============================================

const cron = require('node-cron');
const Token = require('../shared/token.model');
const logger = require('../config/logger');

const tokenCleanupJob = {
  start() {
    // Runs every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        const now = new Date();

        const result = await Token.deleteMany({
          expiresAt: { $lt: now }
        });

        if (result.deletedCount > 0) {
          console.log(
            `[TokenCleanupJob] Removed ${result.deletedCount} expired tokens`
          );
        }

      } catch (error) {
        console.error('[TokenCleanupJob] Error:', error.message);
      }
    });

    console.log('✅ Token Cleanup Job Started (Every 30 minutes)');
  }
};

module.exports = tokenCleanupJob;
