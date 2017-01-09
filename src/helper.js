
/**
 * This applies the given options to the scrollbar elements
 *
 * @param {HTMLElement} aElement The scrollbar element to apply the options to
 * @param {string} aElementName The element name (xElement and yElement) to create the options read propertys from
 * @param {object} aOptions The options to read from
 */
export function applyOptionsToScollBarElement(aElement, aElementName, aOptions) {
    // frist create the option keys, that should get read
    const stylesKey = `${aElementName}Styles`;
    const classKey = `${aElementName}Class`;

    // then go for the style key and apply it to the element
    if (aOptions && aOptions[stylesKey] && typeof aOptions[stylesKey] === 'object' &&
        !Array.isArray(aOptions[stylesKey])
    ) {
        Object.keys(aOptions[stylesKey]).forEach((aKey) => {
            // here we need to disable the param reassign, because we want to make clear where we write to
            aElement.style[aKey] = aOptions[stylesKey][aKey]; // eslint-disable-line no-param-reassign
        });
    }

    // then apply the classes to the elements
    if (aOptions && aOptions[classKey] && typeof aOptions[classKey] === 'string') {
        aElement.classList.add(aOptions[classKey]);
    }
    else if (aOptions && Array.isArray(aOptions[classKey])) {
        aOptions[classKey].forEach((aClass) => {
            aElement.classList.add(aClass);
        });
    }
}

/**
 * Debounces given callback by given waittime. No arguments will be passed through
 *
 * @param {function} aCallback The callback to call debounced
 * @param {number} aWaitTime The time to wait till calling the callback
 * @return {function} The replacment function
 */
export function debounce(aCallback, aWaitTime) {
    let pointer = null;

    return () => {
        window.clearTimeout(pointer);
        pointer = window.setTimeout(aCallback, aWaitTime);
    };
}
