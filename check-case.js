// check-case.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function checkCaseSensitivity() {
    try {
        console.log('\n🔍 CASE SENSITIVITY CHECK\n');
        console.log('='.repeat(60));

        if (!fs.existsSync(UPLOADS_DIR)) {
            console.log('❌ uploads folder not found!');
            process.exit(1);
        }

        const actualFiles = fs.readdirSync(UPLOADS_DIR);
        console.log(`\n📁 Files in uploads folder: ${actualFiles.length}`);
        
        const fileMap = new Map();
        actualFiles.forEach(file => {
            fileMap.set(file.toLowerCase(), file);
        });

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        const db = mongoose.connection.db;

        let totalIssues = 0;
        let totalChecked = 0;

        console.log('🔍 Checking Products...\n');
        const products = await db.collection('products').find({}).toArray();

        for (let p of products) {
            const images = [];
            if (p.mainImage) images.push({ field: 'mainImage', url: p.mainImage });
            if (p.image) images.push({ field: 'image', url: p.image });
            if (p.subImages && Array.isArray(p.subImages)) {
                p.subImages.forEach((img, i) => images.push({ field: `subImages[${i}]`, url: img }));
            }

            for (let { field, url } of images) {
                if (!url || typeof url !== 'string' || url.startsWith('data:')) continue;
                totalChecked++;

                const filename = url.split('/').pop().split('?')[0];
                const exactPath = path.join(UPLOADS_DIR, filename);

                if (!fs.existsSync(exactPath)) {
                    const lowerName = filename.toLowerCase();
                    if (fileMap.has(lowerName)) {
                        const actualName = fileMap.get(lowerName);
                        console.log(`⚠️  CASE MISMATCH:`);
                        console.log(`   Product: ${p.name}`);
                        console.log(`   Field:   ${field}`);
                        console.log(`   DB has:  ${filename}`);
                        console.log(`   Actual:  ${actualName}\n`);
                        totalIssues++;
                    } else {
                        console.log(`❌ MISSING: ${p.name} → ${filename}\n`);
                        totalIssues++;
                    }
                }
            }
        }

        console.log('🔍 Checking Categories...\n');
        const categories = await db.collection('categories').find({}).toArray();
        for (let c of categories) {
            if (!c.image || typeof c.image !== 'string' || c.image.startsWith('data:')) continue;
            totalChecked++;
            const filename = c.image.split('/').pop().split('?')[0];
            if (!fs.existsSync(path.join(UPLOADS_DIR, filename))) {
                const lowerName = filename.toLowerCase();
                if (fileMap.has(lowerName)) {
                    console.log(`⚠️  CASE: ${c.name} → ${filename} (actual: ${fileMap.get(lowerName)})\n`);
                    totalIssues++;
                } else {
                    console.log(`❌ MISSING: ${c.name} → ${filename}\n`);
                    totalIssues++;
                }
            }
        }

        console.log('🔍 Checking Subcategories...\n');
        const subcategories = await db.collection('subcategories').find({}).toArray();
        for (let s of subcategories) {
            if (!s.image || typeof s.image !== 'string' || s.image.startsWith('data:')) continue;
            totalChecked++;
            const filename = s.image.split('/').pop().split('?')[0];
            if (!fs.existsSync(path.join(UPLOADS_DIR, filename))) {
                const lowerName = filename.toLowerCase();
                if (fileMap.has(lowerName)) {
                    console.log(`⚠️  CASE: ${s.name} → ${filename}\n`);
                    totalIssues++;
                } else {
                    console.log(`❌ MISSING: ${s.name} → ${filename}\n`);
                    totalIssues++;
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`   Total images checked:  ${totalChecked}`);
        console.log(`   Total issues found:    ${totalIssues}`);
        console.log(`   Files in uploads:      ${actualFiles.length}\n`);

        if (totalIssues === 0) {
            console.log('✅ NO ISSUES! Linux deployment-க்கு ready.\n');
        } else {
            console.log(`⚠️  ${totalIssues} ISSUES FOUND!\n`);
        }
        console.log('='.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkCaseSensitivity();