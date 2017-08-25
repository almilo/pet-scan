const scanPublicId = window.pageData.scanPublicId;

indexData(scanPublicId);

angular.module('pet-scan', ['uxGenie']);

function indexData(scanPublicId) {
    indexOutputData(scanPublicId);
}

function indexOutputData(scanPublicId) {
    const outputEndpointUrl = `/scan-data/${scanPublicId}/output`;
    const outputLineIndexer = createOutputLineIndexer(scanPublicId);

    fetch(outputEndpointUrl, {credentials: 'same-origin'})
        .then(response => response.json())
        .then(json => json.data.lines)
        .then(lines => lines.map(({spans}) => spans.map(({text}) => text).join(' ')))
        .then(lines => lines.forEach(outputLineIndexer));
}

function createOutputLineIndexer(scanPublicId) {
    return (outputLine, outputLineIndex) => {
        genie({
            magicWords: outputLine,
            action: () => navigateToOutputLine(outputLineIndex)
        });

        function navigateToOutputLine(outputLineIndex) {
            const outputLineUrl = `/s/${scanPublicId}/log#L${outputLineIndex + 1}`;

            // window.history.pushState(null, null, outputLineUrl);
            window.location = outputLineUrl;
        }
    };
}
