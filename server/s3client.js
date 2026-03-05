const { S3Client } = require('@aws-sdk/client-s3');
const S3rver = require('s3rver');
const path = require('path');
const fs = require('fs');

const USE_LOCAL = process.env.S3_USE_LOCAL !== 'false'; // default: local s3rver
const PHOTOS_DIR = process.env.PHOTOS_PATH || path.join(__dirname, 'photos-data');
const S3_BUCKET = process.env.S3_BUCKET || 'mechanic-photos';
const S3_LOCAL_PORT = 4568;

async function startS3rver() {
    if (!USE_LOCAL) return;

    fs.mkdirSync(PHOTOS_DIR, { recursive: true });

    const instance = new S3rver({
        port: S3_LOCAL_PORT,
        address: '127.0.0.1',
        directory: PHOTOS_DIR,
        configureBuckets: [{ name: S3_BUCKET }],
        silent: false,
    });

    await instance.run();
    console.log(`[S3] Local s3rver running at http://127.0.0.1:${S3_LOCAL_PORT}, bucket: ${S3_BUCKET}`);
}

function createS3Client() {
    if (USE_LOCAL) {
        return new S3Client({
            endpoint: `http://127.0.0.1:${S3_LOCAL_PORT}`,
            region: 'us-east-1',
            credentials: { accessKeyId: 'S3RVER', secretAccessKey: 'S3RVER' },
            forcePathStyle: true,
        });
    }

    // Real AWS S3 (production): set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
    return new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
    });
}

module.exports = { startS3rver, createS3Client, S3_BUCKET };
