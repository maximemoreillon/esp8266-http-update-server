# ESP8266 HTTP update server

Usage:

1. Update the semver in version.h
2. Export the compiled binary of the sketch
3. Upload version.h and the compiled binary using a POST request to this server

```
curl  -F firmware=@h<YOUR .bin FILE> -F version=@version.h http://192.168.1.2:7070/firmware
```
