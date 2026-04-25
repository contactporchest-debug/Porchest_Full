require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { ensureDemoSoftwareClient, DEMO_SOFTWARE_CLIENT_EMAIL, DEMO_SOFTWARE_CLIENT_PASSWORD } = require('../utils/ensureDemoSoftwareClient');

async function main() {
    await connectDB();
    const account = await ensureDemoSoftwareClient();
    console.log(`Demo software client login ensured: ${DEMO_SOFTWARE_CLIENT_EMAIL} / ${DEMO_SOFTWARE_CLIENT_PASSWORD}`);
    console.log(`Software client portal ready for: ${account.projectName}`);
    process.exit(0);
}

main().catch((error) => {
    console.error('Failed to create demo software client account:', error);
    process.exit(1);
});
