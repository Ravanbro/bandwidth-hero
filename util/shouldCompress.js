function shouldCompress(originType, originSize) {
    if (!originType || !originType.startsWith("image/") || originSize === 0) {
        return false;
    }
    return true;
}

module.exports = shouldCompress;
