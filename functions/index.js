const pick = require("../util/pick");
const fetch = require("node-fetch");
const shouldCompress = require("../util/shouldCompress");
const compress = require("../util/compress");

const DEFAULT_QUALITY = 40;
const BMI_PROXY_REGEX = /http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i;

exports.handler = async (event) => {
    let { url } = event.queryStringParameters || {};
    const { jpeg, bw, l } = event.queryStringParameters || {};

    if (!url) {
        return {
            statusCode: 200,
            body: "bandwidth-hero-proxy"
        };
    }

    try {
        url = JSON.parse(url);
    } catch {
        // URL is already a plain string, no parsing needed
    }

    if (Array.isArray(url)) {
        url = url.join("&url=");
    }

    // Remove BMI proxy prefix if present
    url = url.replace(BMI_PROXY_REGEX, "http://");

    const webp = !jpeg;
    const grayscale = bw !== "0" && Boolean(bw);
    const quality = parseInt(l, 10) || DEFAULT_QUALITY;

    try {
        const fetchResponse = await fetch(url, {
            headers: {
                ...pick(event.headers, ["cookie", "dnt", "referer"]),
                "user-agent": "Bandwidth-Hero Compressor",
                "x-forwarded-for": event.headers["x-forwarded-for"] || event.ip || "",
                via: "1.1 bandwidth-hero"
            }
        });

        if (!fetchResponse.ok) {
            return {
                statusCode: fetchResponse.status || 302,
                body: `Upstream server returned ${fetchResponse.status}`
            };
        }

        const responseHeaders = Object.fromEntries(fetchResponse.headers.entries());
        const data = await fetchResponse.buffer();
        const originType = fetchResponse.headers.get("content-type") || "";
        const originSize = data.length;

        if (shouldCompress(originType, originSize)) {
            const { err, output, headers } = await compress(data, webp, grayscale, quality, originSize);

            if (err) {
                console.error("Compression failed:", url);
                throw err;
            }

            const savedPercent = ((originSize - output.length) / originSize * 100).toFixed(1);
            console.log(`Compressed: ${originSize} -> ${output.length} bytes (saved ${savedPercent}%)`);

            return {
                statusCode: 200,
                body: output.toString("base64"),
                isBase64Encoded: true,
                headers: {
                    "content-encoding": "identity",
                    ...responseHeaders,
                    ...headers
                }
            };
        }

        console.log(`Bypassing compression, size: ${data.length} bytes`);
        return {
            statusCode: 200,
            body: data.toString("base64"),
            isBase64Encoded: true,
            headers: {
                "content-encoding": "identity",
                ...responseHeaders
            }
        };
    } catch (err) {
        console.error("Request failed:", err);
        return {
            statusCode: 500,
            body: err.message || "Internal server error"
        };
    }
};
