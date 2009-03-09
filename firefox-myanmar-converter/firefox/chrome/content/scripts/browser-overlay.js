var MyanmarConverterExtension = new Object();

MyanmarConverterExtension.initialize = function() {
    try {
        /*
         *  Get a MyConv component
         */
        var myConv = this.getMyConv();
        
        /*
         *  Initialize it. The trick is to get past its IDL interface
         *  and right into its Javascript implementation, so that we
         *  can pass it the LiveConnect "java" object, which it will
         *  then use to load its JARs. Note that XPCOM Javascript code
         *  is not given LiveConnect by default.
         */
         
        if (!myConv.wrappedJSObject.initialize(MyanmarConverterExtension._packageLoader, true)) {
            alert(myConv.wrappedJSObject.error);
        }
    } catch (e) {
        this._fail(e);
    }
};

MyanmarConverterExtension._getExtensionPath = function(extensionName) {
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


MyanmarConverterExtension._packageLoader = function(urlStrings, trace) {
    MyanmarConverterExtension._trace("packageLoader {");
    
    var toUrlArray = function(a) {
        var urlArray = java.lang.reflect.Array.newInstance(java.net.URL, a.length);
        for (var i = 0; i < a.length; i++) {
            var url = a[i];
            java.lang.reflect.Array.set(
                urlArray, 
                i, 
                (typeof url == "string") ? new java.net.URL(url) : url
            );
        }
        return urlArray;
    };
        
    var firefoxClassLoaderURL = 
        new java.net.URL(
            MyanmarConverterExtension._getExtensionPath("myanmar-converter") + 
            "java/javaFirefoxExtensionUtils.jar");
    
    if (trace) MyanmarConverterExtension._trace("classLoaderURL " + firefoxClassLoaderURL);
    
    //===== Stage 1. Prepare to Give All Permission to the Java Code to be Loaded =====
    
        /*
         *  Step 1. Load the bootstraping firefoxClassLoader.jar, which contains URLSetPolicy.
         *  We need URLSetPolicy so that we can give ourselves more permission.
         */
        var bootstrapClassLoader = java.net.URLClassLoader.newInstance(toUrlArray([ firefoxClassLoaderURL ]));
        if (trace) MyanmarConverterExtension._trace("created loader");
        
        /*
         *  Step 2. Instantiate a URLSetPolicy object from firefoxClassLoader.jar.
         */
        var policyClass = java.lang.Class.forName(
            "edu.mit.simile.javaFirefoxExtensionUtils.URLSetPolicy",
            true,
            bootstrapClassLoader
        );
        var policy = policyClass.newInstance();
        if (trace) MyanmarConverterExtension._trace("policy");
        
        /*
         *  Step 3. Now, the trick: We wrap our own URLSetPolicy around the current security policy 
         *  of the JVM security manager. This allows us to give our own Java code whatever permission 
         *  we want, even though Firefox doesn't give us any permission.
         */
        policy.setOuterPolicy(java.security.Policy.getPolicy());
        java.security.Policy.setPolicy(policy);
        if (trace) MyanmarConverterExtension._trace("set policy");
        
        /*
         *  Step 4. Give ourselves all permission. Yay!
         */
        policy.addPermission(new java.security.AllPermission());
        if (trace) MyanmarConverterExtension._trace("got all permissions");
        
        /*
         *  That's pretty much it for the security bootstraping hack. But we want to do a little more. 
         *  We want our own class loader for subsequent JARs that we load.
         */
    
    
    //===== Stage 2. Create Our Own Class Loader so We Can Do Things Like Tracing Class Loading =====
    
        /*
         *  Reload firefoxClassLoader.jar and so we can make use of TracingClassLoader. We 
         *  need to reload it because when it was loaded previously, we had not yet set the policy 
         *  to give it enough permission for loading classes.
         */
      
        policy.addURL(firefoxClassLoaderURL);
        if (trace) MyanmarConverterExtension._trace("added url");
        
        var firefoxClassLoaderPackages = new WrappedPackages(
            java.net.URLClassLoader.newInstance(toUrlArray([ firefoxClassLoaderURL ]))
        );
        if (trace) MyanmarConverterExtension._trace("wrapped loader");
        
        var tracingClassLoaderClass = 
            firefoxClassLoaderPackages.getClass("edu.mit.simile.javaFirefoxExtensionUtils.TracingClassLoader");
        if (trace) MyanmarConverterExtension._trace("got class");
    
        var classLoader = tracingClassLoaderClass.m("newInstance")(trace);
        MyanmarConverterExtension._trace("got new loader");
        
    //===== Stage 3. Actually Load the Code We Were Asked to Load =====
    
        var urls = toUrlArray(urlStrings);
        
        /*
         *  Give it the JARs we were asked to load - should now load them with 
         *  all permissions.
         */
        classLoader.add(firefoxClassLoaderURL);

        for (var i = 0; i < urls.length; i++) {
            var url = java.lang.reflect.Array.get(urls, i);
            classLoader.add(url);
            policy.addURL(url);
        }
        MyanmarConverterExtension._trace("added urls");
        java.lang.Thread.currentThread().setContextClassLoader(classLoader);
        MyanmarConverterExtension._trace("set context");
        
        /*
         *  Wrap up the class loader and return
         */
        var packages = new WrappedPackages(classLoader);
        MyanmarConverterExtension._trace("wrapped");
        
        MyanmarConverterExtension._trace("} packageLoader");
        
        return packages;
};

/*
 *  Wraps a class loader and allows easy access to the classes that it loads.
 */
function WrappedPackages(classLoader) {
    var packages = classLoader.loadClass("edu.mit.simile.javaFirefoxExtensionUtils.Packages").newInstance();
    
    var argumentsToArray = function(args) {
        var a = java.lang.reflect.Array.newInstance(java.lang.Object, args.length);
        for (var i = 0; i < args.length; i++) {
            java.lang.reflect.Array.set(a, i, args[i]);
        }
        return a;
    }

    this.getClass = function(className) {
        var classWrapper = packages.getClass(className);
        if (classWrapper) {
            return {
                n : function() {
                    return classWrapper.callConstructor(argumentsToArray(arguments));
                },
                f : function(fieldName) {
                    return classWrapper.getField(fieldName);
                },
                m : function(methodName) {
                    return function() {
                        return classWrapper.callMethod(methodName, argumentsToArray(arguments));
                    };
                }
            };
        } else {
            return null;
        }
    };
    
    this.setTracing = function(enable) {
        classLoader.setTracing((enable) ? true : false);
    };
}

MyanmarConverterExtension.doIt = function() {
    try {
        var myConv = this.getMyConv();
        
        var test = myConv.wrappedJSObject.getTest();
        var output = test.convert("ေက "  );
        
        alert(test.toString() + output);
    } catch (e) {
        this._fail(e);
    }
};

MyanmarConverterExtension.getMyConv = function() {
    return Components.classes["@thanlwinsoft.org/myanmar-converter;1"]
        .getService(Components.interfaces.nsIMyanmarConverter);
}

MyanmarConverterExtension._trace = function (msg) {
    Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(msg);
}

MyanmarConverterExtension._fail = function(e) {
    var msg;
    if (e.getMessage) {
        msg = e + ": " + e.getMessage() + "\n";
        while (e.getCause() != null) {
            e = e.getCause();
            msg += "caused by " + e + ": " + e.getMessage() + "\n";
        }
    } else {
        msg = e;
    }
    alert(msg);
};
