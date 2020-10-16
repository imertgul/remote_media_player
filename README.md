# Remote Media Player

Remote Media Player that can be controlled over the network. Electron app displays the media. You can communicate with API as shown below or use Test UI that will be run automatically.

Project includes three directory. 

 - src
	 - node.js app that runs the API's, Electron app and Test UI for control the media
 - app
	 - Files of Electron app.
 - public
	 - Files of Test UI

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/imertgul/remote_media_player.git
# Go into the repository
cd remote_media_player
# Install dependencies
npm install
# Run the app
npm start
```
There will be an output  in console:

      Connect test UI: http://192.168.88.33:3000
      Your target on Test UI must be: http://192.168.88.33:3000

You should be in same network to use test UI. Also You have to set target ip as noted.
To use in same device please disable CORS. No need to set. Default is localhost already.

## Refererenses

| POST| Request | Response  |
|--|--|--|
| /init | playerName: string | res: Player |
| /play| val:boolean | res: Player |
| /loop| val:boolean | res: Player |
| /upload/:filename| data:selectedFile | res: Player |
| /playFrom | index:integer | res: Player |
| /brightness| brightness:int(0-10) | res: Player |
| /deleteMedia| val:id | res: Player |
| /updateList | playerName: string | res: Player |
| /updateDuration | playerName: string | res: Player |
| /screenSize | playerName: string | res: Player |
| /init | playerName: string | res: Player |

## Object

    function Media(myFileName, myLength) {
      this.id = Math.random().toString(36).slice(2);
      this.fileName = myFileName;
      this.duration = myLength;
      this.print = function () {
        console.log(this.id + "  " + this.fileName + " " + this.duration);
      };
      this.play = function (mainWindow) {
        mainWindow.webContents.send("file", this.fileName);
      };
    }

    function Player() {
      this.count = 0;
      this.play = false;
      this.loop = false;
      this.brightness = 10;
      this.screenSize = { height: 360, width: 192 };
      this.playList = [];
      this.add = function (object) {
        this.playList[this.count] = object;
        this.count++;
      };
      this.start = function (mainWindow, from) {
        if (!this.play) return 0;
        let index = from;
        console.log("index: " + index + " Count: " + this.count + " Loop: " + this.loop + " Play: " + this.play);
        if (index < this.count) this.playList[index].play(mainWindow);
        if (this.loop && index == this.count - 1) timeOut = setTimeout(() => this.start(mainWindow, 0), this.playList[index].duration);
        else if (!this.loop && index == this.count - 1) this.play = false;
        else if (this.play && index < this.count - 1) timeOut = setTimeout(() => this.start(mainWindow, ++index),this.playList[index].duration);
        return 0;
      };
      this.stop = function () {
        this.play = false;
        global.clearTimeout(timeOut);
        console.log("Player Halted");
      };
    }


