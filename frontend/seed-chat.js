const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: 'AIzaSyDIzCvfvDNrl7W6n_5Dvt2EKHsvhSuCaoA',
    authDomain: 'nextmeetbackend.firebaseapp.com',
    projectId: 'nextmeetbackend',
    storageBucket: 'nextmeetbackend.firebasestorage.app',
    messagingSenderId: '315326520856',
    appId: '1:315326520856:web:64c350cc5c917e11a06d6d',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const messages = [
    { sender: { name: 'Sumit', uid: 'user-sumit' }, message: 'hi', time: '2026-04-14T19:05:00+05:30' },
    { sender: { name: 'Sumit', uid: 'user-sumit' }, message: 'Any one there', time: '2026-04-14T19:05:30+05:30' },
    { sender: { name: 'David', uid: 'chat-David' }, message: 'Yeah! I found this site fascinating', time: '2026-04-14T19:06:00+05:30' },
    { sender: { name: 'David', uid: 'chat-David' }, message: 'whr r u from', time: '2026-04-14T19:06:20+05:30' },
    { sender: { name: 'Sumit', uid: 'user-sumit' }, message: 'los Angles,', time: '2026-04-14T19:06:40+05:30' },
    { sender: { name: 'Sumit', uid: 'user-sumit' }, message: 'u', time: '2026-04-14T19:06:50+05:30' },
    { sender: { name: 'David', uid: 'chat-David' }, message: 'mumbai', time: '2026-04-14T19:07:00+05:30' },
    { sender: { name: 'Sumit', uid: 'user-sumit' }, message: 'oh india', time: '2026-04-14T19:07:20+05:30' },
    { sender: { name: 'David', uid: 'chat-David' }, message: 'i am from india, my fam migrated here', time: '2026-04-14T19:08:00+05:30' },
    { sender: { name: 'Sumit', uid: 'user-sumit' }, message: 'whr in india', time: '2026-04-14T19:08:30+05:30' },
    { sender: { name: 'David', uid: 'chat-David' }, message: 'jodhpur', time: '2026-04-14T19:09:00+05:30' },
    { sender: { name: 'Sumit', uid: 'user-sumit' }, message: 'jodhpur is 6 hrs away frm here', time: '2026-04-14T19:09:30+05:30' },
    { sender: { name: 'David', uid: 'chat-David' }, message: 'yeah', time: '2026-04-14T19:10:00+05:30' },
];

async function seed() {
    console.log('Seeding global chat messages...');
    for (const msg of messages) {
        const ts = new Date(msg.time);
        await addDoc(collection(db, 'globalChat'), {
            sender: msg.sender,
            message: msg.message,
            timestamp: ts.toISOString(),
            createdAt: Timestamp.fromDate(ts),
        });
        console.log(`  ✓ ${msg.sender.name}: ${msg.message}`);
    }
    console.log('Done! All messages seeded.');
    process.exit(0);
}

seed().catch((e) => { console.error('Error:', e); process.exit(1); });
