IDL files in this directory specify IDL interfaces that XPCOM components can
implement. These files need to be compiled into XPT files that Firefox can load.
Since these IDL files don't get changed that often, we don't include this 
compilation step in the build process. Rather, we can compile these files just 
whenever we change them and then check the XPT files into our code repository. 
These XPT files are cross-platformed.


You need to use xpidl.exe to compile your IDL files, you can find xpidl.exe in 
the Gecko SDK, the latest version of which is here:

	ftp://ftp.mozilla.org/pub/mozilla.org/mozilla/releases/mozilla1.7.3/
	
Hunt around that site a bit for the latest version if you wish. Alternatively 
download the whole mozilla codebase just to build xpidl.exe, but I would not
recommend it.

xpidl.exe by itself is not enough. If you run it now, it probably complains 
that it can't find libIDL-0.6.dll in the path. You need to download the 
Netscape build tools as well:

	http://ftp.mozilla.org/pub/mozilla.org/mozilla/source/wintools.zip

Unzip this zip file into some folder, say C:\buildtools, and include 
C:\buildtools\windows\bin\x86 in your path if you are using Windows, or some
corresponding directory if you're on another platform.

And then xpidl.exe will whine some more, e.g., it can't read nsISupports.idl 
and nsrootidl.idl. Just copy those files from gecko-sdk\idl over to your 
current directory and try to compile again. That is to say, copy nsISupports.idl
and nsrootidl.idl over to

	java-firefox-extension/firefox/components/

Finally, run something like this

	C:\gecko-sdk\bin\xpidl.exe -m typelib -w -v -I $XPIDL_INC -o nsIHelloWorld nsIHelloWorld.idl

That should generate nsIJavaFirefoxExtension.xpt. Then, don't forget to delete
the files nsISupports.idl and nsrootidl.idl from

	java-firefox-extension/firefox/components/
	
