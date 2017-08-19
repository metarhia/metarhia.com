#!/usr/bin/env bash

{

# install node and the latest npm
export NVS_HOME="/usr/local/nvs"
git clone https://github.com/jasongin/nvs "$NVS_HOME"
source "$NVS_HOME/nvs.sh" install
nvs add lts
nvs use lts
nvs link

npm install --global npm@latest

isInsideGitRepo=true
# if using the script downloading it from server
if [ -z $(git rev-parse --git-dir 2> /dev/null) ]; then
  isInsideGitRepo=false
  git clone https://github.com/metarhia/server
  cd server
fi

npm install

# certificate obtaining
curl -O https://dl.eff.org/certbot-auto
chmod a+x certbot-auto
echo
echo 'Installation complete'
if [ "$isInsideGitRepo" = true ]; then
  echo 'To generate certificates run "./certbot-auto certonly" under root'
  echo 'To start server run "./server.sh"'
  echo 'Server configuration is placed in ./config'
else
  echo 'To generate certificates run "./server/certbot-auto certonly" under root'
  echo 'To start server run "cd server; ./server.sh"'
  echo 'Server configuration is placed in ./server/config'
fi

}
