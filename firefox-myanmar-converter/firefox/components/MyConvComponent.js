/*----------------------------------------------------------------------
 * This file implements the MyConv component that exposes the nsIHelloWorld
 * interface. The implementation consists of 2 parts: the component
 * module (acting like an instance factory) and a function that creates
 * instances actually implementing the nsIHelloWorld interface.
 *----------------------------------------------------------------------
 */
 
/*
 *  ATTENTION
 *
 *  Firefox is very very unforgiving to syntax errors in XPCOM Javascript
 *  files. If this file does not parse properly once, it might not be
 *  loaded again even if you restart Firefox. Watch the JavaScript
 *  Console for any error message (only logged the first time the file
 *  fails to parse).
 *
 *  You might have to uninstall the whole extension, restart Firefox, 
 *  reinstall the extension (with fixes), and then restart Firefox.
 */
 
function _printToJSConsole(msg) {
    Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(msg);
}

/*----------------------------------------------------------------------
 * The Module (instance factory)
 *----------------------------------------------------------------------
 */

var MyConvModule = {
    /*
     *  VERY IMPORTANT: Modify these first 3 fields to make them unique
     *  to your components. Note that these fields have nothing to
     *  do with the extension ID, nor the IDL interface IDs that the
     *  component implements. A component can implement several interfaces.
     */
    _myComponentID : Components.ID("{09bcc5ad-0796-4e21-9f1b-16c74ec90d34}"),
    _myName :        "The MyConv component of the Myanmar Converter Firefox Extension",
    _myContractID :  "@thanlwinsoft.org/myanmar-converter;1",
    
    /*
     *  This flag specifies whether this factory will create only a
     *  single instance of the component.
     */
    _singleton :     true,
    _myFactory : {
        createInstance : function(outer, iid) {
            if (outer != null) {
                throw Components.results.NS_ERROR_NO_AGGREGATION;
            }
            
            var instance = null;
            
            if (this._singleton) {
                instance = this.theInstance;
            }
            
            if (!(instance)) {
                instance = new MyConvComponent(); // MyConvComponent is declared below
            }
            
            if (this._singleton) {
                this.theInstance = instance;
            }

            return instance.QueryInterface(iid);
        }
    },
    
    registerSelf : function(compMgr, fileSpec, location, type) {
        compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        compMgr.registerFactoryLocation(
            this._myComponentID,
            this._myName,
            this._myContractID,
            fileSpec,
            location,
            type
        );
    },

    unregisterSelf : function(compMgr, fileSpec, location) {
        compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        compMgr.unregisterFactoryLocation(this._myComponentID, fileSpec);
    },

    getClassObject : function(compMgr, cid, iid) {
        if (cid.equals(this._myComponentID)) {
            return this._myFactory;
        } else if (!iid.equals(Components.interfaces.nsIFactory)) {
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        }

        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    canUnload : function(compMgr) {
        /*
         *  Do any unloading task you want here
         */
        return true;
    }
}

/*
 *  This function NSGetModule will be called by Firefox to retrieve the
 *  module object. This function has to have that name and it has to be
 *  specified for every single .JS file in the components directory of
 *  your extension.
 */
function NSGetModule(compMgr, fileSpec) {
    return MyConvModule;
}




/*----------------------------------------------------------------------
 * The MyConv Component, implemented as a Javascript function.
 *----------------------------------------------------------------------
 */

function MyConvComponent() {
    /*
     *  This is a XPCOM-in-Javascript trick: Clients using an XPCOM
     *  implemented in Javascript can access its wrappedJSObject field
     *  and then from there, access its Javascript methods that are
     *  not declared in any of the IDL interfaces that it implements.
     *
     *  Being able to call directly the methods of a Javascript-based
     *  XPCOM allows clients to pass to it and receive from it
     *  objects of types not supported by IDL.
     */
    this.wrappedJSObject = this;
    
    this._initialized = false;
    this._packages = null;
}

/*
 *  nsISupports.QueryInterface
 */
MyConvComponent.prototype.QueryInterface = function(iid) {
    /*
     *  This code specifies that the component supports 2 interfaces:
     *  nsIMyanmarConverter and nsISupports.
     */
    if (!iid.equals(Components.interfaces.nsIMyanmarConverter) &&
        !iid.equals(Components.interfaces.nsISupports)) {
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
};

/*
 *  Initializes this component, including loading JARs.
 */
MyConvComponent.prototype.initialize = function (packageLoader, trace) {
    if (this._initialized) {
        this._trace("MyConvComponent.initialize already called before");
        return true;
    }
    
    this._traceFlag = (trace);
    
    this._trace("MyConvComponent.initialize {");
    try {
        this._packageLoader = packageLoader;
        
        var extensionPath = this._getExtensionPath("myanmar-converter");
        
        /*
         *  Enumerate URLs to our JARs and class directories
         */
        var javaPath = extensionPath + "java/";
        var jarFilepaths = [
            javaPath + "classes/", // our own classes, compiled from myanmar-converter/src
            javaPath + "lib/org.thanlwinsoft.myanmar.jar",
            javaPath + "lib/org.thanlwinsoft.doccharconvert_1.2.1.jar"
        ];
        this._packages = this._packageLoader(jarFilepaths, this._traceFlag);
        
        /*
         *  Test out a static method
         */
        this._trace("About: " + 
            this._packages.getClass("org.thanlwinsoft.myanmar.firefox.Conversion").m("getAbout")()
        );
        
        /*
         *  Create a sample Java object
         */
        this._test = this._packages.getClass("org.thanlwinsoft.myanmar.firefox.Conversion").n("ZawGyiOne");
        this._trace("Environment Variable PATH = " + this._test.getEnvironmentVariable("PATH"));
         
        this._initialized = true;
    } catch (e) {
        this._fail(e);
        this._trace(this.error);
    }
    this._trace("} MyConvComponent.initialize");
    
    return this._initialized;
};

/*
 *  Returns the packages of all the JARs that this component has loaded.
 */
MyConvComponent.prototype.getPackages = function() {
    this._trace("MyConvComponent.getPackages");
    return this._packages;
};

/*
 *  Returns the Test object instantiated by default.
 */
MyConvComponent.prototype.getConv = function() {
    //this._trace("MyConvComponent.getConv");
    return this._test;
};



MyConvComponent.prototype._fail = function(e) {
    if (e.getMessage) {
        this.error = e + ": " + e.getMessage() + "\n";
        while (e.getCause() != null) {
            e = e.getCause();
            this.error += "caused by " + e + ": " + e.getMessage() + "\n";
        }
    } else {
        this.error = e;
    }
};

MyConvComponent.prototype._trace = function (msg) {
    if (this._traceFlag) {
        _printToJSConsole(msg);
    }
}

/*
 *  Get the file path to the installation directory of this 
 *  extension.
 */
MyConvComponent.prototype._getExtensionPath = function(extensionName) {
    var chromeRegistry =
        Components.classes["@mozilla.org/chrome/chrome-registry;1"]
            .getService(Components.interfaces.nsIChromeRegistry);
            
    var uri =
        Components.classes["@mozilla.org/network/standard-url;1"]
            .createInstance(Components.interfaces.nsIURI);
    
    uri.spec = "chrome://" + extensionName + "/content/";
    
    var path = chromeRegistry.convertChromeURL(uri);
    if (typeof(path) == "object") {
        path = path.spec;
    }
    
    path = path.substring(0, path.indexOf("/chrome/") + 1);
    
    return path;
};
    
/*
 *  Retrieve the file path to the user's profile directory.
 *  We don't really use it here but it might come in handy
 *  for you.
 */
MyConvComponent.prototype._getProfilePath = function() {
    var fileLocator =
        Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties);
    
    var path = escape(fileLocator.get("ProfD", Components.interfaces.nsIFile).path.replace(/\\/g, "/")) + "/";
    if (path.indexOf("/") == 0) {
        path = 'file://' + path;
    } else {
        path = 'file:///' + path;
    }
    
    return path;
};


