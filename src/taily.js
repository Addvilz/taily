var fs = require('fs'),
    tail = require('tail').Tail,
    clc = require('cli-color'),
    commander = require('commander'),
    glob = require('glob'),
    path = require('path'),
    objectMerge = require('object-merge'),
    events = require('events'),
    http = require('http'),
    socket = require('socket.io'),
    url = require('url')
    ;

var taily = {
    /**
     * Colors allowed in tail output
     */
    colors: ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'],

    /**
     * Default ID color
     */
    colorDefault: 'blue',

    /**
     * Active config
     */
    config: null,

    /**
     * Instances of tailed files
     */
    tails: {},
    tailsCount: 0,

    /**
     * Filters for commander
     */
    commanderFilters: {
        list: function (val) {
            return val.split(',');
        },
        host: function (val) {
            return val.split(':');
        }
    },

    /**
     * Runtime options
     */
    runtimeOptions: {
        withGrep: false,
        withFullReplay: false
    },

    eventEmitter: null,

    webPreserver: [],

    filterLine: function (line, config) {
        if (config.filters.length === 0) {
            return false;
        }
        for (filterIndex in config.filters) {
            if (config.filters[filterIndex].match(line)) {
                return true;
            }
        }
        return false;
    },

    grepLine: function (line) {
        if (this.runtimeOptions.withGrep === false) {
            return false;
        }

        var grepLine = line;
        replaceable = clc.red('$&').toString();

        var score = 0,
            reqScore = this.runtimeOptions.withGrep.length;

        for (grepIndex in this.runtimeOptions.withGrep) {
            if (this.runtimeOptions.withGrep[grepIndex].test(line)) {
                grepLine = grepLine.replace(this.runtimeOptions.withGrep[grepIndex], replaceable);
                score++;
            }
        }

        if (score == reqScore) {
            return grepLine;
        }
        return false;
    },

    getLineData: function (line, instance) {
        var fileConfig = instance.fileConfig;
        var appendToId = instance.appendToId === null ? '' : '>' + instance.appendToId;


        if (this.filterLine(line, fileConfig) === true) {
            return null;
        }

        var grepLine = false;
        if (this.runtimeOptions.withGrep.length > 0 && (grepLine = this.grepLine(line)) === false) {
            return null;
        } else if (grepLine !== false) {
            line = grepLine;
        }

        return {
            line: line,
            color: fileConfig.color,
            id: instance.idOfTail,
            appendToId: appendToId
        };
    },

    processLine: function (line, instance) {

        var lineData = this.getLineData(line, instance);
        if (lineData === null) {
            return;
        }

        var logLine = clc[lineData.color](lineData.id + lineData.appendToId + ': ') + lineData.line;
        console.log(logLine);
    },

    run: function () {

        commander
            .version('1.0.5')
            .option('-g, --grep [regex]', 'Grep the results of the output. Accepts multiple arguments sepparated by comma, for example, "foo|baz,bar" will match all lines containing (foo OR baz) AND bar.', taily.commanderFilters.list)
            .option('-b, --backlog', 'Output ALL lines, and continue with tailing. Useful with -g.')
            .option('-s, --server [host:port]', 'Run pretty web ui', taily.commanderFilters.host)
            .option('--init', 'Create blank .taily.json.dist in $HOME')
            .option('-e, --edit', 'Launch $EDITOR to edit .taily.json.dist')
            .parse(process.argv);

        if (commander.init) {
            this.initConfigFile();
            return;
        }

        if (commander.edit) {
            this.runConfigEditor();
            return;
        }

        this.eventEmitter = new events.EventEmitter();

        this.loadConfig();

        if (commander.backlog) {
            this.runtimeOptions.withFullReplay = true;
        }

        if (commander.grep) {
            this.runtimeOptions.withGrep = [];
            for (grepIndex in commander.grep) {
                this.runtimeOptions.withGrep.push(this.makeRegex(commander.grep[grepIndex]));
            }
        }

        if (commander.grep && commander.backlog) {
            console.log('Using full reply (--backlog option). This might take some time...');
        }

        this.eventEmitter.on('line', function (line, tail) {
            taily.processLine(line, tail);
        });

        if (commander.server) {
            var hostPort = this.resolveServerPortAddress(commander.server);
            console.log('Starting web UI on ' + hostPort.host + ':' + hostPort.port);
            this.createServer(hostPort);
        }

        this.bindPreserver();

        this.createWatchers();

        if (this.tailsCount > 0) {
            console.log('Tailing ' + this.tailsCount + ' files');
            this.fixateExecution();
        } else {
            console.error('Nothing to tail...');
        }
    },

    bindPreserver: function () {
        this.eventEmitter.on('line', function (line, instance) {
            var lineData = taily.getLineData(line, instance);
            if (lineData === null) {
                return;
            }
            taily.webPreserver.push(lineData);
            taily.webPreserver = taily.webPreserver.slice(-taily.config.server.preserve);
        });
    },

    resolveServerPortAddress: function (arg) {
        var addr = {
            host: typeof taily.config.server !== 'undefined' && typeof taily.config.server.host !== 'undefined' ? taily.config.server.host : '127.0.0.1',
            port: typeof taily.config.server !== 'undefined' && typeof taily.config.server.port !== 'undefined' ? taily.config.server.port : 9800
        };
        if (arg.length == 1) {
            addr.port = arg[0];
        }
        if (arg.length == 2) {
            addr.host = arg[0];
            addr.port = arg[1];
        }
        return addr;
    },

    createServer: function (hostPort) {
        server = http.createServer(function (request, response) {
            var path = url.parse(request.url).pathname;
            switch (path) {
                case '/':
                    fs.readFile(__dirname + '/web/web.html', {encoding: 'utf8'}, function (error, data) {
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.end(data);
                    });
                    break;
                case '/web/web.js':
                    fs.readFile(__dirname + '/web/web.js', {encoding: 'utf8'}, function (error, data) {
                        response.writeHead(200, {'Content-Type': 'application/javascript'});
                        response.end(data);
                    });
                    break;
                case '/web/preserved.js':
                    response.writeHead(200, {'Content-Type': 'application/javascript'});
                    response.end('var __preserved = ' + JSON.stringify(taily.webPreserver));
                    break;
                case '/web/web.css':
                    fs.readFile(__dirname + '/web/web.css', {encoding: 'utf8'}, function (error, data) {
                        response.writeHead(200, {'Content-Type': 'text/css'});
                        response.end(data);
                    });
                    break;
                default:
                    response.writeHead(404);
                    response.end('404d');
                    break;
            }
        });
        server.listen(hostPort.port, hostPort.host);
        var socketServer = socket.listen(server);

        this.eventEmitter.on('line', function (line, tail) {
            taily.processSocketLine(socketServer, line, tail);
        });
    },

    processSocketLine: function (socketServer, line, instance) {
        var lineData = this.getLineData(line, instance);
        if (lineData === null) {
            return;
        }

        socketServer.emit('line', lineData);
    },

    makeRegex: function (regexString) {
        return new RegExp(regexString, 'g');
    },

    createWatchers: function () {
        for (var fileIndex in this.config.files) {

            var fileConfig = this.config.files[fileIndex];

            if (fs.existsSync(fileConfig.file)) {
                this.createInstanceOfWatcher(fileIndex, fileConfig, fileConfig.file);
            } else {
                var files = glob.sync(
                    fileConfig.file,
                    {
                        nonull: false,
                        nodir: true
                    }
                );

                for (globFileIndex in files) {
                    taily.createInstanceOfWatcher(fileIndex, fileConfig, files[globFileIndex], true)
                }
            }
        }
        for (tailIndex in this.tails) {
            this.tails[tailIndex].watch();
        }
    },

    createInstanceOfWatcher: function (loggerName, config, file, isGlob) {
        if (!this.checkFileWatchable(file)) {
            return;
        }

        var instanceOfTail = new tail(file, config.lineSeparator, {}, this.runtimeOptions.withFullReplay);

        this.tails[loggerName] = instanceOfTail;

        instanceOfTail.fileConfig = config;
        instanceOfTail.idOfTail = loggerName;
        instanceOfTail.appendToId = isGlob ? path.basename(file) : null;

        instanceOfTail.on('line', function (line) {
            taily.eventEmitter.emit('line', line, this);
        });
        instanceOfTail.on('error', function (error) {
            console.error('TAILY ERROR: ' + error);
        });

        this.tailsCount++;
    },

    checkFileWatchable: function (file) {
        try {
            var watcher = fs.watch(file);
            watcher.close();
        } catch (e) {
            return false;
        }
        return true;
    },

    initConfigFile: function () {
        var file = this.getConfigFilePath();
        if (fs.existsSync(file) == true) {
            console.error('Taily configuration file already exists. Care to --edit?');
            return;
        }
        fs.writeFile(file, this.getConfigTemplate(), function (err) {
            if (err) throw err;
            console.log('New config file in $HOME has been made. Care to --edit?');
        });
    },

    runConfigEditor: function () {
        var editorProcess = require('child_process');
        var editor = editorProcess.spawn('editor', [this.getConfigFilePath()], {
            stdio: 'inherit'
        });
        editor.on('exit', process.exit);
    },

    getUserHome: function () {
        return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    },

    loadConfig: function () {
        var filename = this.getConfigFilePath();
        if (fs.existsSync(filename) == false) {
            console.error('Mind to make a ~/.taily.json?');
            return false;
        }
        var configContents = fs.readFileSync(filename, 'UTF8');
        var config = JSON.parse(configContents);
        if (typeof config.files !== 'object') {
            throw 'Config error: files key must be present and be an object'
        }
        for (fileIndex in config.files) {
            var fileEntry = config.files[fileIndex];
            if (typeof fileEntry !== 'object') {
                throw 'Config error: file entries must be an objects'
            }
            if (typeof fileEntry.file !== 'string') {
                throw 'Config error: file path must be string'
            }
            fileEntry = objectMerge(this.getFileEntryDefaults(), fileEntry);
            for (filterIndex in fileEntry.filters) {
                fileEntry.filters[fileIndex] = this.makeRegex(fileEntry.filters[filterIndex]);
            }

            config.files[fileIndex] = fileEntry;

        }
        if (typeof config.server == 'undefined') {
            config.server = {};
        }
        config.server = objectMerge(this.getDefaultConfig().server, config.server);
        this.config = config;
    },

    getConfigFilePath: function () {
        return this.getUserHome() + '/.taily.json';
    },

    fixateExecution: function () {
        process.stdin.resume();
    },

    getConfigTemplate: function () {
        return JSON.stringify(this.getDefaultConfig(), null, 4);
    },

    getDefaultConfig: function () {
        return {
            files: {
                syslog: {
                    file: '/var/log/syslog',
                    color: 'blue',
                    filters: [],
                    lineSeparator: '\n'
                }
            },
            server: {
                host: '127.0.0.1',
                port: 9800,
                preserve: 100
            }
        };
    },

    getFileEntryDefaults: function () {
        return {
            color: 'blue',
            filters: [],
            lineSeparator: '\n'
        }
    }
};


module.exports = taily;