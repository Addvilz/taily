# taily
Taily tails teh logz. Now with colors!

#### What does it do?

It takes all files set in `~/.taily.json` and tails them. As soon as any file updates, it shows the output in terminal for you. In single terminal. Not 50.

#### Configuration 

In your home, create file called .taily.json. In that file put something like this:


	{
 	"files": {
			"syslog" : {
        	    "file": "/var/log/syslog",
            	"color": "red"
        	}
		}
	}

Allowed colors:

`black, red, green, yellow, blue, magenta, cyan, white`
