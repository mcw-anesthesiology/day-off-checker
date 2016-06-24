#!/bin/sh
# Requires mongodump >= 3.0

DATE=$(date +%F_%H-%M)
BACKUP_FILENAME=${DATE}.db
BACKUP_TAR_FILENAME=${DATE}.tar.gz

BACKUP_DIRECTORY=/root/day-off-checker-backups
DOCKER_CONTAINER=mongodb
MONGO_DB=day-off-checker
MLAB_HOST=ds017070.mlab.com:17070
MLAB_USERNAME=day-off-checker
MLAB_PASSWORD=GS4hU9ZEXe4juxEz

BOX_DIRECTORY=day-off-checker-backups
BOX_USERNAME=jmischka@mcw.edu
BOX_EXTERNAL_PASSWORD=98sNU9FJTXFXIdFu

cd $BACKUP_DIRECTORY

# To backup local mongo db
#docker exec -it $DOCKER_CONTAINER mongodump -d $MONGO_DB -o $BACKUP_FILENAME
#docker cp $DOCKER_CONTAINER:$BACKUP_FILENAME $BACKUP_FILENAME

mongodump -h $MLAB_HOST -d $MONGO_DB -u $MLAB_USERNAME -p $MLAB_PASSWORD -o $BACKUP_FILENAME

tar -cf $BACKUP_TAR_FILENAME $BACKUP_FILENAME

curl -1 --disable-epsv --ftp-skip-pasv-ip -u $BOX_USERNAME:$BOX_EXTERNAL_PASSWORD --upload-file $BACKUP_TAR_FILENAME --ftp-ssl ftp://ftp.box.com/$BOX_DIRECTORY/
