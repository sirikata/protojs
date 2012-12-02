#!/bin/sh

if [ -e antlr-3.2.jar ]; then
	true
else
	echo "Downloading ANTLR 3.2 JAR from http://www.antlr.org/download.html"
	curl http://www.antlr.org/download/antlr-3.2.jar > antlr-3.2.jar || \
	(echo "Failed to download ANTLR. Aborting.";rm -f antlr-3.2.jar;exit 1)
fi
if [ -e antlr-3.2/lib/libantlr3c.a -o -e libantlr3c-3.2.tar.gz ]; then
	true
else
	echo "Downloading ANTLR 3.2 C Runtime from http://www.antlr.org/download/C"
	curl http://www.antlr.org/download/C/libantlr3c-3.2.tar.gz \
		> libantlr3c-3.2.tar.gz || \
	(echo "Failed to download. Aborting.";rm libantlr3c-3.2.tar.gz;exit 1)
fi
if [ -e antlr-3.2/lib/libantlr3c.a ]; then
	true
else
	MYPWD="$PWD"
        FLAGS64=
        if uname -m | grep x86_64 && ! uname | grep Darwin; then
            FLAGS64=--enable-64bit ;
        fi
	tar -zxf libantlr3c-3.2.tar.gz && \
	cd libantlr3c-3.2 && \
	./configure --prefix="$MYPWD"/antlr-3.2 $FLAGS64 --disable-shared && \
	make && \
	make install && \
	cd "$MYPWD"
fi
if [ -e antlr-3.2.jar -o -e antlr-3.2/lib/libantlr3c.a ]; then
	true
else
	echo "Compile finished, but couldn't find all output files."; exit 1
fi

echo "Type 'make' to compile javascript files."
