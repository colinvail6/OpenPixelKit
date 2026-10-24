# kano2-server


## Directory structure
   * `/arduino` contains the Arduino code
   * `/lib` contains JS libraries
   * `/utils` contains JS utils that are not necessarily directly related to the purpose of the system
   * `tests` guess what it contains  

## Dependencies

Running this project requires several Debian packages to be installed:

```
sudo apt-get install ffmpeg python-minimal fswebcam
```

You'll also need to install Node 4.4:

```
wget https://nodejs.org/dist/v4.4.7/node-v4.4.7-linux-armv7l.tar.xz --no-check-certificate`
sudo tar --strip-components=1 -xvf node-v4.4.7-linux-armv7l.tar.xz -C /usr/local
node --version`
```

## Setting it up on the Mac

If a board isn't available or you want to just test it on your Mac, you need to follow these additional steps after cloning the repo locally.

Install ffmpeg via Homebew:
https://trac.ffmpeg.org/wiki/CompilationGuide/MacOSX

Install cairo via Homebrew:
```brew install pkg-config cairo libpng jpeg giflib```

#### Simulator
A lightboard simulator is embedded, but you need electron on your system. To install it:
```sh
npm install -g electron-prebuilt
```


You can start simulators to preview the actions that will happen on the real board by setting the env variable SIMULATOR to true.

## Working with the real board

### Aliases

Here's a handful of useful aliases when working on the board

```
alias kstatus="sudo systemctl status kano2-server-lightboard"
alias krestart="sudo systemctl restart kano2-server-lightboard"
alias kstop="sudo systemctl stop kano2-server-lightboard"
alias fixstty="stty cols 180 rows 55"
alias kjournal="sudo journalctl -u kano2-server-lightboard -f -n 50"
```

### Syncing

Use a recent image of the OS running on the real board. It will contain the server and its dependencies.
make changes to your local copy of the repo. Sync the changes with the board by running the sync.sh script

```sh
sync.sh kano@[ip of your board]
```

Then restart the server
