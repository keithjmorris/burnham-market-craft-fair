const admin = require('firebase-admin');
const fs    = require('fs');

// ── CONFIG ──────────────────────────────────────────────────────────
// Download your service account key from:
// Firebase console → Project settings → Service accounts → Generate new private key
// Save the downloaded file as 'serviceAccountKey.json' in this folder
const serviceAccount = require('./serviceAccountKey.json');

const databaseURL = 'https://YOUR_PROJECT_ID-default-rtdb.europe-west1.firebasedatabase.app';
// ────────────────────────────────────────────────────────────────────

admin.initializeApp({
  credential:  admin.credential.cert(serviceAccount),
  databaseURL: databaseURL
});

async function exportStalls() {
  try {
    console.log('Connecting to Firebase...');
    const db       = admin.database();
    const snapshot = await db.ref('craft-fair/stalls').once('value');
    const raw      = snapshot.val();

    if (!raw) {
      console.log('No submissions found in the database.');
      process.exit(0);
    }

    // Convert Firebase object to array and map to your standard format
    const stalls = Object.values(raw).map(stall => ({
      id:          String(stall.stallNumber),
      category:    'craft-fair',
      name:        stall.name,
      description: stall.description,
      tags:        [stall.category],
      phoneNumber: stall.phone        || '',
      postCode:    '',
      latitude:    0,
      longitude:   0,
      openingHours: {
        monday:    '',
        tuesday:   '',
        wednesday: '',
        thursday:  '',
        friday:    '',
        saturday:  '',
        sunday:    '',
        special:   '9am - 5pm'
      },
      website:     stall.website      || '',
      image:       stall.image        || '',
      stallNumber: stall.stallNumber
    }));

    // Sort by stall number
    stalls.sort((a, b) => a.stallNumber - b.stallNumber);

    // Write to file
    const output   = JSON.stringify(stalls, null, 2);
    const filename = `stalls-export-${new Date().toISOString().slice(0,10)}.json`;
    fs.writeFileSync(filename, output);

    console.log(`✓ Exported ${stalls.length} stall(s) to ${filename}`);

    // Also log a summary to the console
    console.log('\nStalls exported:');
    stalls.forEach(s => console.log(`  Stall ${s.stallNumber}: ${s.name} (${s.tags[0]})`));

    process.exit(0);

  } catch (err) {
    console.error('Export failed:', err.message);
    process.exit(1);
  }
}

exportStalls();