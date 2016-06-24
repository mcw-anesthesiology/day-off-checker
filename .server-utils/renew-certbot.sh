#!/bin/sh

rm /etc/nginx/sites-enabled/dayoff.site.conf
cp /etc/nginx/sites-available/certbot-dayoff.site.conf /etc/nginx/sites-enabled/certbot-dayoff.site.conf
service nginx reload
/root/certbot-auto renew
rm /etc/nginx/sites-enabled/certbot-dayoff.site.conf
cp /etc/nginx/sites-available/dayoff.site.conf /etc/nginx/sites-enabled/dayoff.site.conf
service nginx reload
