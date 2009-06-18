/*
Copyright 2009 Keith Stribley http://www.thanlwinsoft.org/

The java wrapper code is based on the java-firefox-extension which is
Copyright The SIMILE Project 2003-2005.

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

var MyanmarConverterExtension = new Object();

MyanmarConverterExtension.initialize = function() {
    try {
        /*
         *  Get a MyConv component
         */
        var myConv = this.getMyConv();

        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                                      .getService(Components.interfaces.nsIPrefService)
                                      .getBranch("extensions.myanmarconverter.");

        this.enabled = (prefs)? prefs.getBoolPref("enabled") : true;
        this.trace = (prefs)? prefs.getBoolPref("trace") : false;
        this.prefs = prefs;

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

        //page load listener
		var appcontent = document.getElementById("appcontent"); // browser
		if (!appcontent)
		{
			appcontent = document.getElementById("frame_main_pane"); // songbird
		}
		if (appcontent)
		{
			appcontent.addEventListener("DOMContentLoaded", MyanmarConverterExtension.onPageLoad, true);
		}
    }
    catch (e)
    {
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

MyanmarConverterExtension.toggleEnable = function() {
    try {
    	this.enabled = ! this.enabled;

    	this.prefs.setBoolPref("enabled", this.enabled);
        //var myConv = this.getMyConv();
        //var test = myConv.wrappedJSObject.getConv();
        
    } catch (e) {
        this._fail(e);
    }
};

MyanmarConverterExtension.getMyConv = function() {
    return Components.classes["@thanlwinsoft.org/myanmar-converter;1"]
        .getService(Components.interfaces.nsIMyanmarConverter);
};

MyanmarConverterExtension._trace = function (msg) {
	if (MyanmarConverterExtension.trace)
	{
		Components.classes["@mozilla.org/consoleservice;1"]
		                   .getService(Components.interfaces.nsIConsoleService)
		                   .logStringMessage(msg);
	}
};

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
    if (MyanmarConverterExtension.trace)
	{
    	alert(msg);
	}
};

MyanmarConverterExtension.onPageLoad = function(event) {
	try
	{
		var enableMenu = document.getElementById("myanmarConverter.enable.menu");
        if (enableMenu)
        {
        	enableMenu.setAttribute("checked", MyanmarConverterExtension.enabled);
        }
        else
        	MyanmarConverterExtension._trace("enable.menu not found");

		if (event.originalTarget.nodeName == "#document" &&
			((!event.originalTarget.location) ||
			 event.originalTarget.location.href.indexOf("chrome:") == -1))
		{
			var doc = event.originalTarget;

			if (doc && (!doc.location || MyanmarConverterExtension.isEnabledForUrl(doc.location.href)))
			{
				MyanmarConverterExtension.processDoc(doc);
			}
			
		}
	}
	catch (e) { MyanmarConverterExtension._fail(e); }
};


MyanmarConverterExtension.parseNodes = function(parent)
{
	var myConv = MyanmarConverterExtension.getMyConv();
	if (typeof myConv == "undefined")
	{
		MyanmarConverterExtension._trace("myConv undefined");
		return;
	}
	var convertText = true;
	var defaultToZawGyi = false;
	var converter = myConv.wrappedJSObject.getConv();
	var doc = parent.ownerDocument;
	if (typeof doc.myconvDefaultToZawGyi != "undefined")
	{
		defaultToZawGyi = doc.myconvDefaultToZawGyi;
	}
	// if this is directly called by the event it may not be a text node
	if (parent.nodeType == Node.TEXT_NODE)
	{
		MyanmarConverterExtension._trace("text node");
		var node = parent;
		var theParent = node.parentNode;
		var oldValue = new String(node.nodeValue);
		if (convertText && oldValue.match("[\u1000-\u109F]"))
		{
			var newValue = converter.convert(oldValue, defaultToZawGyi);
			var newNode =  node.ownerDocument.createTextNode(newValue);
			if (oldValue != newValue)
			{
				theParent.replaceChild(newNode, node);
				theParent.style.fontFamily = "Padauk,Myanmar3";
				theParent.lang = "my";
			}
		}
		return;
	}
	else if (parent.nodeType != Node.ELEMENT_NODE)
	{
		return;
	}
	var nodes = parent.childNodes;
	var convertedCount = 0;
	var style = window.getComputedStyle(parent, null);
	if (style.fontFamily.toLowerCase().indexOf("padauk") > -1
		|| parent.lang == "my")
	{
		convertText = false;
	}
	for (var i = 0; i < nodes.length; i++)
	{
		var node = nodes.item(i);
		switch (node.nodeType)
		{
		case Node.ELEMENT_NODE:
			if (node.hasChildNodes())
			{
				// don't parse the tree if there is no Myanmar text
				if (node.textContent.match("[\u1000-\u109F]"))
					MyanmarConverterExtension.parseNodes(node);
			}
			break;
		case Node.TEXT_NODE:
			var oldValue = new String(node.nodeValue);
			if (convertText && oldValue.match("[\u1000-\u109F]"))
			{
				var newValue = converter.convert(oldValue, defaultToZawGyi);
				var newNode =  node.ownerDocument.createTextNode(newValue);
				if (oldValue != newValue)
				{
					parent.replaceChild(newNode, node);
					convertedCount++;
				}
			}
			break;
		}
	}
	if (convertedCount > 0)
	{
		parent.style.fontFamily = "Padauk,Myanmar3";
		parent.lang = "my";
		if (typeof doc.myconvDefaultToZawGyi == "undefined")
		{
			doc.myconvDefaultToZawGyi = true;
			MyanmarConverterExtension._trace(doc.location + " Default to ZawGyi");
		}
	}
}

/*
MyanmarConverterExtension.walkNodes = function(treeNode)
{	
	var walker = treeNode.ownerDocument.createTreeWalker(treeNode, NodeFilter.SHOW_TEXT, null, false);
	var textNode = walker.currentNode;
	if (textNode.nodeType != Node.TEXT_NODE)
	{
		textNode = walker.nextNode();
	}
	var count = 0;
	var convertedCount = 0;
	var trueUnicodeCount = 0;
	var alreadyConverted = false;
	var myConv = MyanmarConverterExtension.getMyConv();
	if (typeof myConv == "undefined")
	{
		MyanmarConverterExtension._trace("myConv undefined");
		return;
	}
	var converter = myConv.wrappedJSObject.getConv();

	while (textNode != null)
	{
		count++;
		var oldValue = new String(textNode.nodeValue);
		if (typeof oldValue == 'undefined')
		{
			textNode = walker.nextNode();
			continue;
		}
		var parent = textNode.parentNode;
		var style = window.getComputedStyle(parent, null);
		// TODO this gets confused when we convert some text in the parent element before text in
		// a child element
		if (style.fontFamily.toLowerCase().indexOf("padauk") > -1)
		{
			textNode = walker.nextNode();
			alreadyConverted = true;
			continue;
		}
		var oldNode = textNode;
		var defaultToZawGyi = (convertedCount > trueUnicodeCount)? true : false;
		if (typeof treeNode.ownerDocument.assumeZawGyi != "undefined")
		{
			defaultToZawGyi = treeNode.ownerDocument.assumeZawGyi;
		}
		textNode = walker.nextNode();
		if (oldValue.match("[\u1000-\u109F]"))
		{
			var newValue = converter.convert(oldValue, defaultToZawGyi);
			var newNode =  treeNode.ownerDocument.createTextNode(newValue);
			if (oldValue != newValue)
			{
				parent.replaceChild(newNode, oldNode);
				parent.style.fontFamily = "Padauk,Myanmar3";
				convertedCount++;
				parent.lang = "my";
			}
			else
			{
				trueUnicodeCount++;
			}
		}
	}
	if (typeof treeNode.ownerDocument.assumeZawGyi == "undefined")
	{
		MyanmarConverterExtension._trace("converted " + convertedCount + ", unicode " + trueUnicodeCount);
		treeNode.ownerDocument.assumeZawGyi = (convertedCount > trueUnicodeCount)? true : false;
	}
};
*/

MyanmarConverterExtension.processDoc = function(doc) {
	if (!MyanmarConverterExtension.isZawGyi(doc))
	{
		doc.addEventListener("DOMNodeInserted", MyanmarConverterExtension.onTreeModified, true);
    	doc.addEventListener("DOMCharacterDataModified",MyanmarConverterExtension.onTreeModified, true);
		return;
	}

    if (doc.body)
    {
    	MyanmarConverterExtension.parseNodes(doc.body);
    	MyanmarConverterExtension.convertTitle(doc);
    	doc.addEventListener("DOMNodeInserted", MyanmarConverterExtension.onTreeModified, true);
    	doc.addEventListener("DOMCharacterDataModified",MyanmarConverterExtension.onTreeModified, true);
    }
};

MyanmarConverterExtension.convertTitle = function(doc)
{
	try
	{
		var converter = MyanmarConverterExtension.getMyConv().wrappedJSObject.getConv();
		if (typeof doc.myconvDefaultToZawGyi != "undefined")
		{
			defaultToZawGyi = doc.myconvDefaultToZawGyi;
		}
		doc.title = converter.convert(doc.title, defaultToZawGyi);
	}
	catch (e)
	{
		MyanmarConverterExtension._trace(e);
	}
};

MyanmarConverterExtension.onTreeModified = function(event)
{
	MyanmarConverterExtension._trace(event.type + " " + event.target);
	if (event.target)
	{
		try
		{
			// the parse may change nodes itself, so remove the event listener temporarily
			var doc = event.target.ownerDocument;
			doc.removeEventListener("DOMNodeInserted", MyanmarConverterExtension.onTreeModified, true);
			doc.removeEventListener("DOMCharacterDataModified",MyanmarConverterExtension.onTreeModified, true);
			if (event.type == "DOMCharacterDataModified")
			{
				MyanmarConverterExtension.updateText(event.target, event.prevValue, event.newValue);
			}
			else
			{
				MyanmarConverterExtension.parseNodes(event.target);
			}
			doc.addEventListener("DOMCharacterDataModified",MyanmarConverterExtension.onTreeModified, true);
			doc.addEventListener("DOMNodeInserted", MyanmarConverterExtension.onTreeModified, true);
		}
		catch (e)
		{
			MyanmarConverterExtension._trace(e);
		}
	}
};

MyanmarConverterExtension.updateText = function(target, prevValue, newValue)
{
	if (!prevValue) prevValue = "";
	if (!newValue) newValue = "";
	var s = 0;
	var prevE = prevValue.length - 1;
	var newE = newValue.length - 1;
	// find common text at start
	for (s = 0; s < prevValue.length && s < newValue.length; s++)
	{
		if (prevValue[s] != newValue[s]) break;
	}
	// find common text at end
	for (; prevE > s && newE > s; --prevE, --newE)
	{
		if (prevValue[prevE] != newValue[newE]) break;
	}
	var prefix = prevValue.substring(0, s);
	var suffix = prevValue.substring(prevE+1, prevValue.length);
	var toConvert = newValue.substring(s, newE+1);
	var myConv = MyanmarConverterExtension.getMyConv();
	if (typeof myConv == "undefined")
	{
		MyanmarConverterExtension._trace("myConv undefined");
		return;
	}
	var defaultToZawGyi = false;
	if (typeof target.ownerDocument.myconvDefaultToZawGyi != "undefined")
	{
		defaultToZawGyi = target.ownerDocument.myconvDefaultToZawGyi;
	}
	var converter = myConv.wrappedJSObject.getConv();
	var converted = converter.convert(toConvert, defaultToZawGyi);
	target.textContent = new String(prefix + converted + suffix);
};

MyanmarConverterExtension.isEnabledForUrl = function(url) {
	// TODO
	return MyanmarConverterExtension.enabled;
};

MyanmarConverterExtension.isZawGyi = function(doc) {
	if (doc.body && doc.body.textContent.match("[\u1050-\u109F]"))
	{
		var myConv = MyanmarConverterExtension.getMyConv();
		if (typeof myConv == "undefined")
		{
			MyanmarConverterExtension._trace("myConv undefined");
			return false;
		}
		var converter = myConv.wrappedJSObject.getConv();
		var converted = converter.convert(doc.body.textContent, false);
		if (converted != doc.body.textContent)
		{
			doc.myconvDefaultToZawGyi = true;
			MyanmarConverterExtension._trace(doc.location + " Default to ZawGyi");
			return true;
		}
		return false;
	}
	return false;
};
