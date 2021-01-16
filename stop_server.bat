@echo off
cd ./tools
node kickAvatar.js
TIMEOUT  /T -1
cd ../
pomelo stop