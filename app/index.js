const scanPublicId = window.pageData.scanPublicId;

[
    fetchAndIndexOutputLog,
    fetchAndIndexCustomValues,
    fetchAndIndexTimelineTasks,
    fetchAndIndexFailures
].forEach(indexer => indexer(scanPublicId));

angular.module('pet-scan', ['uxGenie']);

function fetchAndIndexOutputLog(scanPublicId) {
    const dataExtractor = ({lines}) => lines.map(({spans}) => spans.map(({text}) => text).join(' '));
    const outputLineIndexer = createOutputLineIndexer(scanPublicId);
    const dataIndexer = outputLines => outputLines.forEach(outputLineIndexer);

    fetchAndIndexScanSectionData(scanPublicId, 'output', dataExtractor, dataIndexer);

    function createOutputLineIndexer(scanPublicId) {
        return (outputLine, outputLineIndex) => indexData(
            outputLine,
            () => navigateToSectionLine(scanPublicId, 'log', outputLineIndex + 1),
            'LOG'
        );
    }
}

function fetchAndIndexCustomValues(scanPublicId) {
    const dataExtractor = ({allCustomValues}) => allCustomValues;
    const customValueIndexer = createCustomValueIndexer(scanPublicId);
    const dataIndexer = customValues => customValues.forEach(customValueIndexer);

    fetchAndIndexScanSectionData(scanPublicId, 'custom-values', dataExtractor, dataIndexer);

    function createCustomValueIndexer(scanPublicId) {
        return ({name, value}, customValueIndex) => indexData(
            `${name}: ${value}`,
            () => navigateToSectionLine(scanPublicId, 'custom-values', customValueIndex + 1),
            'CUSTOM_VALUE'
        );
    }
}

function fetchAndIndexTimelineTasks(scanPublicId) {
    const dataExtractor = ({timelineTasks}) => timelineTasks;
    const timelineTaskIndexer = createTimelineTaskIndexer(scanPublicId);
    const dataIndexer = timelineTasks => timelineTasks.forEach(timelineTaskIndexer);

    fetchAndIndexScanSectionData(scanPublicId, 'timeline', dataExtractor, dataIndexer);

    function createTimelineTaskIndexer(scanPublicId) {
        return ({id, path, outcome}) => indexData(
            `${path}: ${outcome}`,
            () => navigateToSectionItem(scanPublicId, 'timeline', 'task', id),
            'TASK'
        );
    }
}

function fetchAndIndexFailures(scanPublicId) {
    const dataExtractor = ({failure: {exceptions}}) => exceptions;
    const exceptionIndexer = createFailureIndexer(scanPublicId);
    const dataIndexer = exceptions => exceptions.forEach(exceptionIndexer);

    fetchAndIndexScanSectionData(scanPublicId, null, dataExtractor, dataIndexer);

    function createFailureIndexer(scanPublicId) {
        return ({message}, exceptionIndex) => indexData(
            message, () => navigateToSectionItem(scanPublicId, 'failure', 'top', exceptionIndex, true),
            'FAILURE'
        );
    }
}

function indexData(magicWords, action, type) {
    genie({
        magicWords,
        action,
        data: {
            uxGenie: {
                iIcon: getIconClass(type)
            }
        }
    });
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
    const maybeSection = section ? `/${section}` : '';

    return `/scan-data/${scanPublicId}${maybeSection}`;
}

function navigateToSectionLine(scanPublicId, section, line) {
    const applicationUrl = `/s/${scanPublicId}/${section}#L${line}`;

    navigateToApplicationUrl(applicationUrl);
}

function navigateToSectionItem(scanPublicId, section, itemIdParameter, itemId, isHashParameter = false) {
    const parameterSeparator = isHashParameter ? '#' : '?';
    const applicationUrl = `/s/${scanPublicId}/${section}${parameterSeparator}${itemIdParameter}=${itemId}`;

    navigateToApplicationUrl(applicationUrl);
}

function navigateToApplicationUrl(applicationUrl) {
    const browserHistory = window.browserHistory;

    if (browserHistory) {
        browserHistory.push(applicationUrl);
    } else {
        window.location = applicationUrl;
    }
}

function getIconClass(type) {
    let iconClass;

    switch (type) {
        case 'TASK':
            iconClass = 'tasks';
            break;
        case 'FAILURE':
            iconClass = 'exclamation-circle';
            break;
        case 'CUSTOM_VALUE':
            iconClass = 'dashboard';
            break;
        case 'LOG':
            iconClass = 'comment';
            break;
    }

    return `ps-icon ps-icon-${type.toLowerCase().replace('_', '-')} fa fa-${iconClass}`;
}
