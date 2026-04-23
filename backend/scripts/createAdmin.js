require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connectDB = require('../config/db');
const ensureAdminUser = require('../utils/ensureAdminUser');

async function main() {
    await connectDB();
    await ensureAdminUser();
    console.log('Admin login ensured: admin@porchest.com / porchest_admin');
    process.exit(0);
}

main().catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
});
