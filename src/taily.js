var fs = require('fs'),
    tail = require('tail').Tail,
    clc = require('cli-color');

process.stdin.resume();

var allowCollors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

var taily = {
    config: {
        files: []
    },
    tails: {}
};

taily.line = function (line, instance) {
    var color = 'blue';
    if (
        typeof taily.config.files[instance.__idOfTail].color !== 'undefined' &&
        allowCollors.indexOf(taily.config.files[instance.__idOfTail].color) !== -1
    ) {
        color = taily.config.files[instance.__idOfTail].color;
    }

    var logLine = clc[color](instance.__idOfTail + ': ') + line;
    console.log(logLine);
};


taily.run = function () {
    console.log('Taily now tailing teh logz...');
    if (this.loadConfig() === false) {
        return;
    }
    for (var fileIndex in this.config.files) {
        var filename = this.config.files[fileIndex].file;
        var instanceOfTail = new tail(filename);
        instanceOfTail.__idOfTail = fileIndex;
        instanceOfTail.on('line', function (line) {
            taily.line(line, this);
        });
        instanceOfTail.on('error', function (error) {
            console.error('TAILY ERROR: ' + error);
        });
        instanceOfTail.watch();
        this.tails[fileIndex] = instanceOfTail;
    }

};

taily.loadConfig = function () {
    var filename = taily.getUserHome() + '/.taily.json';
    if (fs.existsSync(filename) == false) {
        console.error('Mind to make a ~/.taily.json?');
        return false;
    }
    var configContents = fs.readFileSync(filename, 'UTF8');
    this.config = JSON.parse(configContents);
};

taily.getUserHome = function () {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}


module.exports = taily;