var webUi;

webUi = {
    socket: null,

    connectSocket: function () {
        this.socket = io.connect();
        this.bindSocketEvents();
    },

    bindSocketEvents: function () {
        this.socket.on('line', function (data) {
            console.log(data);
            webUi.appendLogLine(data);
        });
    },

    run: function () {
        this.connectSocket();
    },

    appendLogLine: function (data) {
        var scrollable = $('#log-container');
        var inner = $('#log-container > #log');
        var atBottom = Math.abs(inner.offset().top) + scrollable.height() + scrollable.offset().top >= inner.outerHeight();
        console.log(atBottom);
        if ( atBottom ) {
            scrollable.animate({ scrollTop: scrollable.prop('scrollHeight') },5);
        }

        data.line = data.line.replace(/\[31m(.*)\[39m/g,'<span style="color:red">$1</span>');
        $('#log').append(this.logLineTemplate.render(data));
    },

    logLineTemplate: null
};

$(document).ready(function(){
    webUi.logLineTemplate = twig({
        id: 'logLine',
        data: '<div class="log-line {{color}}"><div class="id">{{id}}>{{appendToId}}</div><div class="message">{{ line }}</div></div>'
    });
    for(backlogIndex in __preserved){
        webUi.appendLogLine(__preserved[backlogIndex]);
    }
    webUi.run();
});