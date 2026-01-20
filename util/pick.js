/**
 * Pick specific keys from an object.
 * @param {Object} obj - Source object
 * @param {string|string[]} keys - Key(s) to pick
 * @returns {Object} New object with only the specified keys
 */
module.exports = (obj, keys) => {
    const result = {};

    if (!obj) {
        return result;
    }

    const keyList = Array.isArray(keys) ? keys : [keys];

    for (const key of keyList) {
        if (Object.hasOwnProperty.call(obj, key)) {
            result[key] = obj[key];
        }
    }

    return result;
};
