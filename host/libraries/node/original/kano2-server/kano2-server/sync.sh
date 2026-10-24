#!/bin/bash
rsync -avz ./ --exclude ".git" --exclude "node_modules" $1:/home/kano/kano2-server/

