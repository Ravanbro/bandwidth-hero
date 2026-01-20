const sharp = require("sharp");

/**
 * Compress an image using Sharp.
 * @param {Buffer} input - Input image buffer
 * @param {boolean} webp - Output as WebP if true, JPEG if false
 * @param {boolean} grayscale - Convert to grayscale if true
 * @param {number} quality - Compression quality (0-100)
 * @param {number} originSize - Original image size in bytes
 * @returns {Promise<{err: Error|null, output?: Buffer, headers?: Object}>}
 */
async function compress(input, webp, grayscale, quality, originSize) {
    const format = webp ? "webp" : "jpeg";

    try {
        const { data: output, info } = await sharp(input)
            .grayscale(grayscale)
            .toFormat(format, {
                quality,
                progressive: true,
                optimizeScans: true
            })
            .toBuffer({ resolveWithObject: true });

        return {
            err: null,
            output,
            headers: {
                "content-type": `image/${format}`,
                "content-length": info.size,
                "x-original-size": originSize,
                "x-bytes-saved": originSize - info.size
            }
        };
    } catch (err) {
        return { err };
    }
}

module.exports = compress;
