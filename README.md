# taily
Taily tails teh logz. Now with colors!

![taily](http://cloud.louise.marolind.com/public.php?service=files&t=a098d70442a06c01ff83736c10afd242&download)

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

    -h, --help          output usage information
    -V, --version       output the version number
    -g, --grep [regex]  Grep the results of the output. Accepts multiple arguments sepparated by comma, 
						for example, "foo|baz,bar" will match all lines containing (foo OR baz) AND bar.
    -b, --backlog       Output ALL lines, and continue with tailing. Useful with -g.
    --init              Create blank .taily.json.dist in $HOME
    -e, --edit          Launch $EDITOR to edit .taily.json.dist


#### Configuration 

In your home, create file called .taily.json. In that file put something like this:


	{
 	"files": {
			"syslog" : {
        	    "file": "/var/log/syslog",
            	"color": "red",
            	"filters": [],
            	"lineSeparator": "\n"
        	}
		}
	}

##### File paths

File paths can be ordinary paths, like `/var/log/syslog` and can also be glob's, like `/var/log/*`. In later case Taily will append basename of the file to the entry key in output, and it will look something like this:

`syslog>Xorg.1.log: [151362.142] X Protocol Version 11, Revision 0`

##### Allowed colors:

`black, red, green, yellow, blue, magenta, cyan, white`

##### Filters

Filters are OR combined conditions to filter the output of a log. For example, you can set this to ["foo","bar"] to only see line containing foo OR bar. 


##### P.S.

`filters` and `lineSeparator` is optional.