const scanPublicId = window.pageData.scanPublicId;
const browserHistory = window.browserHistory;

[
    fetchAndIndexOutputLog,
    fetchAndIndexCustomValues,
    fetchAndIndexTimelineTasks
].forEach(indexer => indexer(scanPublicId));

angular.module('pet-scan', ['uxGenie']);

function fetchAndIndexOutputLog(scanPublicId) {
    const dataExtractor = ({lines}) => lines.map(({spans}) => spans.map(({text}) => text).join(' '));
    const outputLineIndexer = createOutputLineIndexer(scanPublicId);
    const dataIndexer = outputLines => outputLines.forEach(outputLineIndexer);

    fetchAndIndexScanSectionData(scanPublicId, 'output', dataExtractor, dataIndexer);

    function createOutputLineIndexer(scanPublicId) {
        return (outputLine, outputLineIndex) => indexData(`LOG - ${outputLine}`, () => navigateToSectionLine(scanPublicId, 'log', outputLineIndex + 1));
    }
}

function fetchAndIndexCustomValues(scanPublicId) {
    const dataExtractor = ({allCustomValues}) => allCustomValues;
    const customValueIndexer = createCustomValueIndexer(scanPublicId);
    const dataIndexer = customValues => customValues.forEach(customValueIndexer);

    fetchAndIndexScanSectionData(scanPublicId, 'custom-values', dataExtractor, dataIndexer);

    function createCustomValueIndexer(scanPublicId) {
        return ({name, value}, customValueIndex) => indexData(`VAL - ${name}: ${value}`, () => navigateToSectionLine(scanPublicId, 'custom-values', customValueIndex + 1));
    }
}

function fetchAndIndexTimelineTasks(scanPublicId) {
    const dataExtractor = ({timelineTasks}) => timelineTasks;
    const timelineTaskIndexer = createTimelineTaskIndexer(scanPublicId);
    const dataIndexer = timelineTasks => timelineTasks.forEach(timelineTaskIndexer);

    fetchAndIndexScanSectionData(scanPublicId, 'timeline', dataExtractor, dataIndexer);

    function createTimelineTaskIndexer(scanPublicId) {
        return ({id, path, outcome}) => indexData(`TSK - ${path}: ${outcome}`, () => navigateToSectionItem(scanPublicId, 'timeline', 'task', id));
    }
}

function indexData(magicWords, action) {
    genie({magicWords, action});
}

function fetchAndIndexScanSectionData(scanPublicId, section, extractData, indexData) {
    const endpointUrl = createScanDataUrl(scanPublicId, section);

    return fetch(endpointUrl, {credentials: 'same-origin'})
        .then(response => response.json())
        .then(json => json.data)
        .then(extractData)
        .then(indexData);
}

function createScanDataUrl(scanPublicId, section) {
    return `/scan-data/${scanPublicId}/${section}`;
}

function navigateToSectionLine(scanPublicId, section, line) {
    const applicationUrl = `/s/${scanPublicId}/${section}#L${line}`;

    navigateToApplicationUrl(applicationUrl);
}

function navigateToSectionItem(scanPublicId, section, itemIdParameter, itemId) {
    const applicationUrl = `/s/${scanPublicId}/${section}?${itemIdParameter}=${itemId}`;

    navigateToApplicationUrl(applicationUrl);
}

function navigateToApplicationUrl(applicationUrl) {
    if (browserHistory) {
        browserHistory.push(applicationUrl);
    } else {
        window.location = applicationUrl;
    }
}
