const fs = require('fs');
const connect = require('connect');
const httpProxy = require('http-proxy');
const harmon = require('harmon');

const indexCss = fs.readFileSync('./app/index.css', 'utf-8');
const indexJs = fs.readFileSync('./app/index.js', 'utf-8');

const fontawesome = `<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">`;
const css = `<style>${indexCss}</style>`;
const angular = '<script src="https://unpkg.com/angular@1.6.6/angular.min.js"></script>';
const genie = '<script src="https://cdn.rawgit.com/kentcdodds/genie/master/src/genie.js"></script>';
const lamp = '<script src="https://cdn.rawgit.com/kentcdodds/genie/master/dist/lamps/angular/genie-lamp-angular.js"></script>';
const content = '<div class="light large fast" ng-app="pet-scan"><div ux-lamp rub-class="visible" wish-callback="noop()"></div></div>';
const app = `<script>${indexJs}</script>`;
const transforms = [
    {query: 'head', func: inject(fontawesome + css + angular + genie + lamp)},
    {query: 'body', func: inject(content + app)}
];
const port = 3000;
const proxy = httpProxy.createProxyServer({target: 'http://localhost:5050'});

connect()
    .use(harmon([], transforms, true))
    .use((req, res) => proxy.web(req, res))
    .listen(port, () => console.log(`Listening on port: ${port}.`));

function inject(content) {
    return node => {
        const input = node.createReadStream();
        const output = node.createWriteStream({outer: false});

        input.pipe(output, {end: false});
        input.on('end', () => output.end(content));
    }
}
