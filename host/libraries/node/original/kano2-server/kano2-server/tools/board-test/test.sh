#!/bin/bash

if [ $UID -ne 0 ]; then
    echo "Need eleveted privileges re run with sudo"
    exit 1
fi

readonly LOGTAG="kano2-board-test"
#readonly DATE_SUFFIX="$(date --iso-8601=seconds)"
readonly DATE_SUFFIX="$(date --utc +%Y%m%d_%H%M%SZ)"
readonly LOGS_DIRNAME="logs-${DATE_SUFFIX}"

# Filenames of logs that this script creates
readonly IMAGE_FILENAME="camera-test-${DATE_SUFFIX}.jpg"
readonly FSWEBCAM_LOG_FILENAME="fswebcam-${DATE_SUFFIX}.log"
readonly IMAGE_ANALYSIS_FILENAME="camera-test-${DATE_SUFFIX}-analysis.log"
readonly VIDEO_FILENAME="video-test-${DATE_SUFFIX}.mp4"
readonly VIDEO_RAW_FILENAME="video-test.h264"
readonly VIDEOENC_LOG_FILENAME="videoenc-${DATE_SUFFIX}.log"
readonly STRESS_LOG_FILENAME="stress-${DATE_SUFFIX}.log"
readonly DMESG_LOG_FILENAME="journalctl-${DATE_SUFFIX}.log"
readonly USER_SYSLOG_FILENAME="user-syslog-${DATE_SUFFIX}.log"
LOGFILES=(
    "${IMAGE_FILENAME}"
    "${FSWEBCAM_LOG_FILENAME}"
    "${IMAGE_ANALYSIS_FILENAME}"
    "${VIDEO_FILENAME}"
    "${VIDEOENC_LOG_FILENAME}"
    "${STRESS_LOG_FILENAME}"
    "${DMESG_LOG_FILENAME}"
    "${USER_SYSLOG_FILENAME}"
)

function log_error {
    logger --priority user.error --tag "$LOGTAG" --stderr "$1"
}

function log_warn {
    logger --priority user.warning --tag "$LOGTAG" --stderr "$1"
}

function log_info {
    logger --priority user.info --tag "$LOGTAG" --stderr "$1"
}

function copy_if_exists {
    test -f "$1" && cp "$1" "${LOGS_DIRNAME}"
}

function delete_if_exists {
    test -f "$1" && rm "$1"
}

function at_exit_hook {
    # Create a dump of journalctl for easier debugging
    dmesg -H > "${DMESG_LOG_FILENAME}"
    cp /var/log/user.log "${USER_SYSLOG_FILENAME}"

    # Copy all log and other files to a nice tar for easier debugging
    mkdir "${LOGS_DIRNAME}"
    for i in "${LOGFILES[@]}"
    do
        copy_if_exists "$i"
    done
    tar --force-local -czf "${LOGS_DIRNAME}.tar.gz" "${LOGS_DIRNAME}"
    log_info "Logs zipped use the following to copy them to a machine that is connected to the same network"
    log_info "    scp '$(logname)@$(hostname).local:~/${LOGS_DIRNAME}.tar.gz' . "
}

trap at_exit_hook EXIT

# Disable kernel messages
echo 0 > /proc/sys/kernel/printk

log_info "PROCESSORS: $(cat /proc/cpuinfo | grep 'processor' -c)"
log_info "MEMORY: $(free -h | head -n 2 | tail -n 1 | awk '{ printf $2 }')"

log_info "TEMPERATURE: $(cat /sys/class/thermal/thermal_zone1/temp)"
log_info "USB DEVICES:\n$(lsusb -tv)"


log_info "LOOKING FOR CAMERA:"
lsmod | grep --silent ov5640
if [ $? -ne 0 ]; then
    modprobe ov5640

    if [ $? -ne 0 ]; then
        log_error "Couldn't load ov5640 module"
    fi

    modprobe vfe_v4l2

    if [ $? -ne 0 ]; then
        log_error "Couldn't load vfe_v4l2 module"
    fi
else
    log_info "CAMERA MODULES ALREADY LOADED"
fi

sleep 3
statresult="$(stat --format=%F /dev/video0)"
if [ $? -ne 0 ] || [ "$statresult" != "character special file" ] ; then
    log_error "Camera device is not mounted correctly"
else
    log_info "CAMERA DEVICE IN PLACE"
fi

log_info "Checking that fswebcam is installed"
which fswebcam &> /dev/null
if [ $? -ne 0 ]; then
    log_error "fswebcam not installed"
else
    log_info "fswebcam found will attempt to take a picture"
    fswebcam -r 1280x720 -p YUV420P --save "${IMAGE_FILENAME}" 2>&1 | tee "${FSWEBCAM_LOG_FILENAME}"
    if [ $? -ne 0 ]; then
        log_error "Error while capturing the picture"
    else
        log_info "Printing info about the picture taken"
        identify -verbose "${IMAGE_FILENAME}" 2>&1 | tee "${IMAGE_ANALYSIS_FILENAME}"
        if [ $? -ne 0 ]; then
            log_error "Captured picture couldn't be identified"
        else
            log_info "Image identified as valid, see ${IMAGE_ANALYSIS_FILENAME} for details"
        fi
    fi
fi

log_info "Checking whether our version of videoenc is installed"
which videoenc &> /dev/null
if [ $? -ne 0 ]; then
    log_error "videoenc is not installed"
else
    log_info "videoenc found, will attempt to record a video for 10 secs"
    touch "${VIDEO_RAW_FILENAME}"
    videoenc -i /dev/video0 -s "1920x1080" -t 10 -o "${VIDEO_RAW_FILENAME}" 2>&1 | tee "${VIDEOENC_LOG_FILENAME}"
    ffmpeg -i "${VIDEO_RAW_FILENAME}" -vcodec copy -f mp4 "${VIDEO_FILENAME}"
    if [ $? -ne 0 ]; then
        log_error "Couldn't wrap raw h264 stream with mp4 extension"
    fi
    # We no longer need the raw file, we have the mp4 container
    delete_if_exists "${VIDEO_RAW_FILENAME}"
fi

log_info "Running stress for 10 secs"
stress --cpu 4 --io 1 --vm 1 --vm-bytes 128M --timeout 10s 2>&1 | tee "${STRESS_LOG_FILENAME}"

# WIFI

log_info "LOOKING FOR WIFI"
lsmod | grep --silent bcmdhd
if [ $? -ne 0 ]; then
    modprobe bcmdhd

    if [ $? -ne 0 ]; then
        log_error "Couldn't load bcmdhd module"
    fi

else
    log_info "WIFI KERNEL MODULE ALREADY LOADED"
fi

# Wait here to allow the device to show up
sleep 3
grep --silent wlan0 /proc/net/dev
if [ $? -ne 0 ]; then
    log_error "Wifi device is not mounted correctly"
else
    log_info "WIFI DEVICE IN PLACE"
fi

log_info "Will now set up Ad Hoc Mode, use your phone to check that it is working"
systemctl start kano2-hostap.service

log_info "Tests done, now run:"
log_info "  node kano2-server/bin/start --device=camera"
log_info "For the ultimate test"
