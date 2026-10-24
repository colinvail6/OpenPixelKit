#!/bin/bash

# Don't add tidy up code here, instead make it into a systemd unit file to
# ensure that it is called, regardless of the way the shutdown was invoked

sync
systemctl poweroff
