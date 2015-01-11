# taily

[![version](https://img.shields.io/npm/v/taily.svg?style=flat-square)](https://www.npmjs.com/package/taily)
[![dls](https://img.shields.io/npm/dm/taily.svg?style=flat-square)](https://www.npmjs.com/package/taily)
![license](https://img.shields.io/npm/l/taily.svg?style=flat-square)
![Is it ready?](https://img.shields.io/badge/Is%20it%20ready%20yet%3F-Yes-green.svg?style=flat-square)

Taily tails teh logz. Now with colors!

![taily](https://camo.githubusercontent.com/a945ae2d867613afd15a52aa703287ed3782e36f/687474703a2f2f636c6f75642e6c6f756973652e6d61726f6c696e642e636f6d2f7075626c69632e7068703f736572766963653d66696c657326743d613039386437303434326130366330316666383337333663313061666432343226646f776e6c6f6164)

#### What does it do?

It takes all files set in `~/.taily.json` and tails them. As soon as any file updates, it shows the output in terminal for you. In single terminal. Not 50.

#### Installation

Locally

`npm install taily`

or Globally

`npm install taily -g`

#### Usage

	taily [options]

	Options:

	-h, --help                output usage information
	-V, --version             output the version number
	-g, --grep [regex]        Grep the results of the output. Accepts multiple arguments sepparated by comma,
	 						  for example, "foo|baz,bar" will match all lines containing (foo OR baz) AND bar.
	-b, --backlog             Output ALL lines, and continue with tailing. Useful with -g.
	-s, --server [host:port]  Run pretty web ui
	--init                    Create blank .taily.json.dist in $HOME
	-e, --edit                Launch $EDITOR to edit .taily.json.dist



#### Configuration 

In your home, create file called .taily.json. In that file put something like this:


	{
        "files": {
            "syslog": {
                "file": "/var/log/syslog",
                "color": "blue",
                "filters": [],
                "lineSeparator": "\n"
            }
        },
        "server": {
            "host": "127.0.0.1",
            "port": 9800,
            "preserve": 100
        }
    }

##### File paths

File paths can be ordinary paths, like `/var/log/syslog` and can also be glob's, like `/var/log/*`. In later case Taily will append basename of the file to the entry key in output, and it will look something like this:

`syslog>Xorg.1.log: [151362.142] X Protocol Version 11, Revision 0`

##### Allowed colors:

`black, red, green, yellow, blue, magenta, cyan, white`

##### Filters

Filters are OR combined conditions to filter the output of a log. For example, you can set this to ["foo","bar"] to only see line containing foo OR bar. 

##### Web ui

Web ui provides simple output of taily via web. Bear in mind, there is no authentication or anything of the kind. If you want to run this as a daemon, it will be best if you put it behind, for example, Nginx proxy and/or firewall. Security folks will, of course, adore this.

##### P.S.

`filters` and `lineSeparator` is optional.

##### Changelog

1.0.5: Simple web ui.