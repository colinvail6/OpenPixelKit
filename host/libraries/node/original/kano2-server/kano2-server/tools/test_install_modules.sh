# Instal npm dependencies
npm install nan
npm install || rc=$?
if [ $rc -ne 0 ]; then
    echoerr "Npm install error"
    exit 3
fi

# Create tar with node_modules
tar -czvf kano2-server-node-modules.tar.gz ./node_modules/

# Upload the aws folders/
aws s3 cp kano2-server-node-modules.tar.gz s3://kano2-server-node-modules/node_modules/
