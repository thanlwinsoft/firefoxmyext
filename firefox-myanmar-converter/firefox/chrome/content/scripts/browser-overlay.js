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

        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                                      .getService(Components.interfaces.nsIPrefService)
                                      .getBranch("extensions.myanmarconverter.");

        this.enabled = (prefs)? prefs.getBoolPref("enabled") : true;
        this.trace = (prefs)? prefs.getBoolPref("trace") : false;
        this.urlPatternsLoadTime = prefs.getIntPref("urlPatternsUpdateTime");
        this.urlPatterns = MyanmarConverterOptions.loadUrlPatterns();
        var prefBranch2 = prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
        prefBranch2.addObserver("extensions.myanmarconverter.enabled", this, false);
        prefBranch2.addObserver("extensions.myanmarconverter.urlPatternsUpdateTime", this, false);
        this.prefs = prefBranch2;

        this.messages = Components.classes["@mozilla.org/intl/stringbundle;1"]
            .getService(Components.interfaces.nsIStringBundleService)
            .createBundle("chrome://myanmar-converter/locale/MyanmarConverter.properties");

        // Load the data for the converters
        var path = MyanmarConverterExtension._getExtensionPath("myanmar-converter");
        MyanmarConverterExtension._trace("Path: " + path);
        this.legacyFonts = [ "Zawgyi-One", "WinInnwa", "Wwin_Burmese1" ];
        //var conversionData = [ "zawgyi", "wininnwa", "wwin_burmese" ];
        for (var i = 0; i < this.legacyFonts.length; i++)
        {
            new TlsMyanmarConverter(tlsMyanmarConverterData[this.legacyFonts[i].toLowerCase()]);
            MyanmarConverterExtension._trace("Loaded " + this.legacyFonts[i]);
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


MyanmarConverterExtension.toggleEnable = function() {
    try {
    	this.enabled = ! this.enabled;
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                                      .getService(Components.interfaces.nsIPrefService)
                                      .getBranch("extensions.myanmarconverter.");
    	prefs.setBoolPref("enabled", this.enabled);
        
    } catch (e) {
        this._fail(e);
    }
};

/*
MyanmarConverterExtension.getMyConv = function() {
    return Components.classes["@thanlwinsoft.org/myanmar-converter;1"]
        .getService(Components.interfaces.nsIMyanmarConverter);
};
*/

MyanmarConverterExtension._trace = function (msg) {
	if (MyanmarConverterExtension.trace)
	{
		Components.classes["@mozilla.org/consoleservice;1"]
		                   .getService(Components.interfaces.nsIConsoleService)
		                   .logStringMessage(msg);
	}
};

MyanmarConverterExtension._fail = function(e) {
    if (MyanmarConverterExtension.trace)
	{
        var msg;
        if (e.getMessage) {
            msg = e;
            for (var p in e)
            {
                msg += p + ":" + e[p] + "\n";
            }
            while (e.getCause() != null) {
                e = e.getCause();
                msg += "caused by " + e + ": " + e.getMessage() + "\n";
            }
        } else {
            msg = e + "\n";
            for (var p in e)
            {
                msg += p + ":" + e[p] + "\n";
            }
        }
    	//alert(msg);
    	MyanmarConverterExtension._trace(msg);
	}
};

MyanmarConverterExtension.onPageLoad = function(event) {
	try
	{
	    MyanmarConverterExtension._trace("onPageLoad " + event.originalTarget.nodeName);
	    var enableMenu = document.getElementById("myanmarConverter.enable.menu");
        if (enableMenu)
        {
        	enableMenu.setAttribute("checked", MyanmarConverterExtension.enabled);
        }
        //else
        //	MyanmarConverterExtension._trace("enable.menu not found");

	    if (event.originalTarget.nodeName == "#document" &&
		    ((!event.originalTarget.location) ||
		     event.originalTarget.location.href.indexOf("chrome:") == -1))
	    {
		    var doc = event.originalTarget;

		    if (doc && (!doc.location || MyanmarConverterExtension.isEnabledForUrl(doc.location)))
		    {
			    MyanmarConverterExtension.processDoc(doc);
		    }
		
	    }
	}
	catch (e) { MyanmarConverterExtension._fail(e); }
};

MyanmarConverterExtension.guessConverterForNode = function(node)
{
    var nodeFontFamily = window.getComputedStyle(node.parentNode, null).fontFamily;
	var matchIndex = -1;
	var nodeConverter = null;
	var bestFreq = 0;
	// take the converter matching the font in the style with the lowest index just in case the web 
    // page actually mixed different fonts in the same style!
	for (var i = 0; i < MyanmarConverterExtension.legacyFonts.length; i++)
	{
	    var testConv = tlsMyanmarConverters[MyanmarConverterExtension.legacyFonts[i].toLowerCase()];
	    var testIndex = nodeFontFamily.indexOf(MyanmarConverterExtension.legacyFonts[i]);
	    if (testIndex > -1 && (matchIndex == -1 || testIndex < matchIndex))
	    {
	        nodeConverter = testConv;
	        matchIndex = testIndex;
	    }
	    // it is quite common for short Zawgyi phrases not to use Mon, Karen, Shan codes, so need to
	    // change for any characters in Myanmar code range
	    if (node.nodeValue.match("[\u1000-\u109F]") && testConv.isPseudoUnicode())
	    {
	        var uniFreq = testConv.matchFrequency(node.nodeValue, true);
	        var pseudoFreq = testConv.matchFrequency(node.nodeValue, false);
	        if (pseudoFreq > uniFreq && pseudoFreq > bestFreq)
	        {
	            nodeConverter = testConv;
	            bestFreq = pseudoFreq;
	        }
	    }
	}
	if (nodeConverter == null)
    	MyanmarConverterExtension._trace("No Converter matched: " + node.nodeValue);
	return nodeConverter;
}

MyanmarConverterExtension.parseNodes = function(parent, converter, toUnicode)
{
	var doc = parent.ownerDocument;
	if (converter == null)
	{
        if (doc.tlsMyanmarEncoding && typeof doc.tlsMyanmarEncoding != "undefined")
    	    converter = tlsMyanmarConverters[doc.tlsMyanmarEncoding.toLowerCase()];
		if (typeof converter == "undefined")
		{
            MyanmarConverterExtension.guessMyanmarEncoding(doc, parent);
            this._trace("doc.tlsMyanmarEncoding" + typeof doc.tlsMyanmarEncoding);
            if (doc.tlsMyanmarEncoding && typeof doc.tlsMyanmarEncoding == "Object")
            {
                converter = tlsMyanmarConverters[doc.tlsMyanmarEncoding.toLowerCase()];
            }
	        if (typeof converter == "undefined")
	        {
			    MyanmarConverterExtension._trace("converter undefined: " + doc.tlsMyanmarEncoding);
			    // still parse checking for specific styles
		    }
		}
	}
	var convertText = true;
	// if this is directly called by the event it may not be a text node
	if (parent.nodeType == Node.TEXT_NODE)
	{
		var node = parent;
		var theParent = node.parentNode;
		var oldValue = new String(node.nodeValue);
        var bestConv = converter;
        if (toUnicode)
        {
            bestConv = MyanmarConverterExtension.guessConverterForNode(node);
        }
		if (bestConv)
		{
			var newValue = (toUnicode)? bestConv.convertToUnicode(oldValue) : 
			    bestConv.convertFromUnicode(oldValue);
			if (oldValue != newValue)
			{
    			var newNode =  node.ownerDocument.createTextNode(newValue);
				theParent.replaceChild(newNode, node);
				theParent.style.fontFamily = bestConv.getFontFamily(toUnicode);
				if (toUnicode) theParent.lang = "my";
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
	
	var walker = parent.ownerDocument.createTreeWalker(parent,
			NodeFilter.SHOW_TEXT, null, false);
	var textNode = walker.currentNode;
	if (textNode != null && textNode.nodeType != Node.TEXT_NODE)
	{
		textNode = walker.nextNode();
	}
	var parents = new Array();
	while (textNode != null)
	{
		var theParent = textNode.parentNode;
		var style = window.getComputedStyle(theParent, null);
		var bestConv = converter;
		if (toUnicode)
        {
            bestConv = MyanmarConverterExtension.guessConverterForNode(textNode);
        }
        if (bestConv)
		{
		    convertText = true;
		}
		else
		{
		    convertText = false;
		}
		var oldValue = new String(textNode.nodeValue);
		var prevNode = textNode;
		textNode = walker.nextNode();
		if (convertText)
		{
			var newValue = (toUnicode)? bestConv.convertToUnicode(oldValue) : 
			    bestConv.convertFromUnicode(oldValue);
			if (oldValue != newValue)
			{
    			var newNode = prevNode.ownerDocument.createTextNode(newValue);
    			if (theParent.childNodes.length == 1)
    			{
				    theParent.replaceChild(newNode, prevNode);
				    theParent.style.fontFamily = bestConv.getFontFamily(toUnicode);
				    if (toUnicode) theParent.lang = "my";
				}
				else
				{
				    var span = prevNode.ownerDocument.createElement("span");
				    span.style.fontFamily = bestConv.getFontFamily(toUnicode);
				    if (toUnicode) span.lang = "my";
				    span.appendChild(newNode);
				    theParent.replaceChild(span, prevNode);
				}
			}
		}
	}
}

MyanmarConverterExtension.processDoc = function(doc) {
    var enc = MyanmarConverterExtension.guessMyanmarEncoding(doc, doc.body);

    if (doc.body)
    {
    	MyanmarConverterExtension.parseNodes(doc.body, null, true);
    	MyanmarConverterExtension.convertTitle(doc);
    	doc.addEventListener("DOMNodeInserted", MyanmarConverterExtension.onTreeModified, true);
    	doc.addEventListener("DOMCharacterDataModified",MyanmarConverterExtension.onTreeModified, true);
    }
};

MyanmarConverterExtension.convertTitle = function(doc)
{
	try
	{
	    if (typeof doc.tlsMyanmarEncoding != "undefined")
	    {
		    var converter = tlsMyanmarConverters[doc.tlsMyanmarEncoding.toLowerCase()];
		    if (typeof converter != "undefined")
		    {
		        doc.title = converter.convertToUnicode(doc.title);
	        }
	        else if (doc.tlsMyanmarEncoding != "unicode")
	        {
	            MyanmarConverterExtension._trace("No converter for: " + doc.tlsMyanmarEncoding);
	        }
	    }
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
				MyanmarConverterExtension.parseNodes(event.target, null, true);
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
	var converter = tlsMyanmarConverters[target.ownerDocument.tlsMyanmarEncoding.toLowerCase()];
	if (typeof converter == "undefined")
	{
	    MyanmarConverterExtension.guessMyanmarEncoding(target.ownerDocument, target);
	    converter = tlsMyanmarConverters[target.ownerDocument.tlsMyanmarEncoding.toLowerCase()];
	}
	if (typeof converter != "undefined")
	{
	    var converted = converter.convertToUnicode(toConvert);
    	target.textContent = new String(prefix + converted + suffix);
	}
};

MyanmarConverterExtension.isEnabledForUrl = function(url) {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                                      .getService(Components.interfaces.nsIPrefService)
                                      .getBranch("extensions.myanmarconverter.");

    this.enabled = (prefs)? prefs.getBoolPref("enabled") : true;
    try
	{
	    if (url && url.hostname && url.pathname)
    	{
	    
	        var patternsTime = (prefs)? prefs.getIntPref("urlPatternsUpdateTime") : 0;
	        if (patternsTime != this.urlPatternsLoadTime)
	        {
	            this.urlPatternsLoadTime = patternsTime;
                this.urlPatterns = MyanmarConverterOptions.loadUrlPatterns();
            }
            for (var i = 0; i < this.urlPatterns.length; i++)
            {
                var hostMatch = false;
                var pattern = this.urlPatterns[i];
                if (pattern.hostnameExact)
                {
                    if (url.hostname == pattern.hostname)
                        hostMatch = false;
                }
                else
                {
                    var pos = url.hostname.find(pattern.hostname);
                    if (pos > -1 && pos + pattern.hostname.length == url.hostname.length)
                    {
                        hostMatch = true;
                    }
                }
                if (hostMatch &&
                    (pattern.pathnameExact && url.pathname == pattern.pathname) || 
                    (url.pathname.indexOf(pattern.pathname) == 0))
                {
                    return pattern.enableConversion;
                }
            }
        }
    }
    catch (e)
    {
        this._fail(e);
    }
	return this.enabled;
};

MyanmarConverterExtension.guessMyanmarEncoding = function(doc, testNode) {
    // try to guess the encoding, but ignore if the test text is too short
    if (testNode && testNode.textContent.length > 100)
    {
        var bestMatch = 0.90;
        var unicodeFreq = 0;
        if (! doc.tlsMyanmarEncoding)
        {
            doc.tlsMyanmarEncoding = "unicode";
        }
        for (var i = 0; i < this.legacyFonts.length; i++)
        {
            var conv = tlsMyanmarConverters[this.legacyFonts[i].toLowerCase()];
            if (i == 0)
                unicodeFreq = conv.matchFrequency(testNode.textContent, true);
            // converters using Latin script code points can match English with
            // very bad consequences
            if (!conv.isPseudoUnicode())
                continue;
            var f = conv.matchFrequency(testNode.textContent, false);
            if (f > bestMatch && f > unicodeFreq)
            {
                doc.tlsMyanmarEncoding = this.legacyFonts[i];
                bestMatch = f;
                this._trace(doc.location + ": encoding " + this.legacyFonts[i] + " f=" + f + " ");
            }
            else
            {
                this._trace(doc.location + ": no match for encoding " + this.legacyFonts[i] + " f=" + f +
                    "uni freq =" + unicodeFreq);
            }
        }
        return doc.tlsMyanmarEncoding;
    }    
    return null;
};

/*
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
		var testContent = doc.body.textContent;
		var converted = converter.convert(testContent, false);
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
*/

MyanmarConverterExtension.convertDocument = function(node)
{
	try
	{
		if (node)
		{
			var doc = node.ownerDocument;
			//MyanmarConverterExtension._trace(doc.location);
			if (doc)
			{
				MyanmarConverterExtension.processDoc(doc);
			}
		}
	}
	catch (e)
	{
		MyanmarConverterExtension._fail(e);
	}
};

MyanmarConverterExtension.convertTextNode = function(textNode, converter, toUnicode, startOffset, endOffset)
{
    var doc = textNode.ownerDocument;
    if (endOffset == null || endOffset < 0)
        endOffset = textNode.nodeValue.length;
    var toConvert = textNode.nodeValue.substring(startOffset, endOffset);
    var converted = (toUnicode)? converter.convertToUnicode(toConvert) :
        converter.convertFromUnicode(toConvert);
    if (converted == toConvert) return textNode;
    if (textNode.parentNode.childNodes.length == 1 && startOffset == 0 && endOffset == textNode.nodeValue.length)
    {
        textNode.parentNode.style.fontFamily = converter.getFontFamily(toUnicode);
        var replacement = doc.createTextNode(converted);
        textNode.parentNode.replaceChild(replacement, textNode);
        return replacement;
    }
    else
    {
        if (startOffset > 0)
        {
            var prefixText = doc.createTextNode(textNode.nodeValue.substring(0, startOffset));
            textNode.parentNode.insertBefore(prefixText, textNode);
        }
        var span = doc.createElement("span");
        span.style.fontFamily = converter.getFontFamily(toUnicode);
        span.appendChild(doc.createTextNode(converted));
        textNode.parentNode.insertBefore(span, textNode);
        var suffixText = doc.createTextNode(textNode.nodeValue.substring(endOffset, textNode.nodeValue.length));
        textNode.parentNode.replaceChild(suffixText, textNode);
        return span;
    }
};

MyanmarConverterExtension.convertElementNode = function(eNode, converter, toUnicode, refNode)
{
    var firstConverted = null;
    var lastConverted = null;
    for (var i = 0; i < eNode.childNodes.length; i++)
    {
        var n = eNode.childNodes[i];
        var docPos = (refNode)? n.compareDocumentPosition(refNode) :
            Node.DOCUMENT_POSITION_FOLLOWING;
        if (docPos & Node.DOCUMENT_POSITION_PRECEDING || docPos == 0)
        {
            break;
        }
        else
        {
            if (n.nodeType == Node.TEXT_NODE)
            {
                lastConverted = MyanmarConverterExtension.convertTextNode(n, converter, toUnicode, 0, n.nodeValue.length);
                if (firstConverted == null) firstConverted = lastConverted;
            }
            else if (n.nodeType == Node.ELEMENT_NODE)
            {
                var convertedNodes = MyanmarConverterExtension.convertElementNode(n, converter, toUnicode, refNode);
                if (firstConverted == null) firstConverted = convertedNodes.first;
                lastConverted = convertedNodes.last;
            }
        }
    }
    var retValue = new Object();
    retValue.first = firstConverted;
    retValue.last = lastConverted;
    return retValue;
};

MyanmarConverterExtension.convertSelection = function(popupNode, converter, toUnicode)
{
    var doc = popupNode.ownerDocument;
    var s = doc.defaultView.getSelection();
    if (s instanceof Selection)
    {
        //MyanmarConverterExtension._trace("Selection has " + s.rangeCount + " ranges active element " +
        //    doc.activeElement.nodeName);
        if (s.rangeCount == 0 && doc.activeElement.nodeName.toLowerCase() == "textarea" ||
            doc.activeElement.nodeName.toLowerCase() == "input")
        {
            var origText = doc.activeElement.value;
            var prefix = origText.substring(0, doc.activeElement.selectionStart);
            var suffix = origText.substring(doc.activeElement.selectionEnd, origText.length);
            var toConvert = origText.substring(doc.activeElement.selectionStart, doc.activeElement.selectionEnd);
            var converted = (toUnicode)? converter.convertToUnicode(toConvert) :
                converter.convertFromUnicode(toConvert);
            if (converted != toConvert)
            {
                doc.activeElement.value = prefix + converted + suffix;
                doc.activeElement.setSelectionRange(prefix.length, prefix.length + converted.length);
                doc.activeElement.style.fontFamily = converter.getFontFamily(toUnicode);
            }
        }
        for (var i = 0; i < s.rangeCount; i++)
        {
            var r = s.getRangeAt(i);
            var newRange = doc.createRange();
            var endOffset = -1;
            var offset = 0;
            if (r.startContainer == r.endContainer)
            {
                // simple case start and end are the same container
                if (r.startContainer.nodeType == Node.TEXT_NODE)
                {
                    var replacement = MyanmarConverterExtension.convertTextNode(r.startContainer, converter, toUnicode,
                        r.startOffset, r.endOffset);
                    if (replacement)
                    {
                        if (replacement == r.startContainer)
                        {
                            newRange.setStart(r.startContainer, r.startOffset);
                            newRange.setEnd(r.endContainer, r.endOffset);
                        }
                        else
                        {
                            if (replacement.nodeType == Node.TEXT_NODE)
                            {
                                newRange.setStart(replacement, 0);
                                newRange.setEnd(replacement, replacement.value.length);
                            }
                            else
                            {
                                // it is a span with a single text node
                                newRange.setStart(replacement, 0);
                                newRange.setEnd(replacement, 1);
                            }
                        }
                    }
                }
                else
                {
                    for (var i = r.startOffset; i < r.endOffset; i++)
                    {
                        var n = r.startContainer.childNodes[i];
                        if (n.nodeType == Node.TEXT_NODE)
                        {
                            var replacement = MyanmarConverterExtension.convertTextNode(n, converter, toUnicode, 0, n.nodeValue.length);
                            if (i == r.startOffset && replacement)
                                newRange.setStart(replacement, 0); // should be ok for both text and element node
                            if (i + 1 == r.endOffset && replacement)
                            {
                                if (replacement.nodeType == Node.TEXT_NODE)
                                    newRange.setEnd(replacement, replacement.nodeValue.length);
                                else
                                    newRange.setEnd(replacement, 1);
                            }
                        }
                        else if (n.nodeType == Node.ELEMENT_NODE)
                        {
                            // should be no need to change start
                            var converted = MyanmarConverterExtension.convertElementNode(n, converter, toUnicode, null);
                            if (i == r.startOffset && converted.first) newRange.setStart(converted.first, 0);
                            if (i + 1 == r.endOffset && converted.last)
                            {
                                if (converted.last.nodeType == Node.TEXT_NODE)
                                    newRange.setEnd(converted.last, converted.last.nodeValue.length);
                                else
                                    newRange.setEnd(converted.last, 1);
                            }
                        }
                    }
                }
            }
            else
            {
                // make a record of the nextNode before we modify the startContainer
                var parentNode = r.startContainer.parentNode;
                var nextNode = r.startContainer.nextSibling;
                if (r.startContainer.nodeType == Node.TEXT_NODE)
                {
                    var newRangeStart = MyanmarConverterExtension.convertTextNode(r.startContainer, converter, toUnicode,
                        r.startOffset, r.startContainer.nodeValue.length);
                    if (newRangeStart == r.startContainer)
                    {
                        newRange.setStart(r.startContainer, r.startOffset);
                    }
                    else
                    {
                        newRange.setStart(newRangeStart, 0);
                    }
                }
                else if (r.startContainer.nodeType == Node.ELEMENT_NODE)
                {
                    for (var i = r.startOffset; i < r.startContainer.childNodes.length; i++)
                    {
                        var n = r.startContainer.childNodes[i];
                        if (n.nodeType == Node.TEXT_NODE)
                        {
                            var converted = MyanmarConverterExtension.convertTextNode(n, converter, toUnicode, 0, n.nodeValue.length);
                            if (i == r.startOffset && converted)
                            {
                                newRange.setStart(converted, 0);
                            }
                        }
                        else if (n.nodeType == Node.ELEMENT_NODE)
                        {
                            var converted = MyanmarConverterExtension.convertElementNode(n, converter, toUnicode, null);
                            if (i == r.startOffset && converted.first) newRange.setStart(converted.first, 0);
                        }
                    }
                }
                // find nodes between startContainer and endContainer
                var maxIter = 10;
                do
                {
                    --maxIter;
                    while (nextNode == null && parentNode != null)
                    {
                        nextNode = parentNode.nextSibling;
                        if (nextNode == null)
                        {
                            parentNode = parentNode.parentNode;
                        }
                        else
                        {
                            parentNode = nextNode.parentNode;
                        }
                    }
                    if (nextNode == null)
                    {
                        MyanmarConverterExtension._trace("end of doc reached while looking for endContainer");
                        break;
                    }
                    var docPos = nextNode.compareDocumentPosition(r.endContainer);
                    if (docPos & Node.DOCUMENT_POSITION_PRECEDING || docPos == 0)
                        break;
                    if (nextNode.nodeType == Node.TEXT_NODE)
                    {
                        MyanmarConverterExtension._trace("nextNode text: " + nextNode.nodeValue);
                        MyanmarConverterExtension.convertTextNode(nextNode, converter, toUnicode,
                            0, nextNode.nodeValue.length);
                    }
                    else if (nextNode.nodeType == Node.ELEMENT_NODE)
                    {
                        MyanmarConverterExtension._trace("nextNode name: " + nextNode.nodeName);
                        MyanmarConverterExtension.convertElementNode(nextNode, converter, toUnicode,
                            r.endContainer);
                    }
                    nextNode = nextNode.nextSibling;
                } while (nextNode !== r.endContainer);
                // convert end
                if (r.endContainer.nodeType == Node.TEXT_NODE)
                {
                    var lastConverted = MyanmarConverterExtension.convertTextNode(r.endContainer, converter, toUnicode,
                        0, r.endOffset);
                    if (lastConverted == r.endContainer)
                    {
                        newRange.setEnd(r.endContainer, r.endOffset);
                    }
                    else
                    {
                        if (lastConverted.nodeType  == Node.TEXT_NODE)
                            newRange.setEnd(lastConverted, lastConverted.nodeValue.length);
                        else
                            newRange.setEnd(lastConverted, 1);
                    }
                }
                else
                {
                    var lastConverted = null;
                    for (var i = 0; i < r.endOffset; i++)
                    {
                        var n = r.endContainer.childNodes[i];
                        if (n.nodeType == Node.TEXT_NODE)
                        {
                            lastConverted = MyanmarConverterExtension.convertTextNode(n, converter, toUnicode, 0, n.nodeValue.length);
                        }
                        else if (n.nodeType == Node.ELEMENT_NODE)
                        {
                            lastConverted = MyanmarConverterExtension.convertElementNode(n, converter, toUnicode, null).last;
                        }
                    }
                    if (lastConverted)
                    {
                        if (lastConverted.nodeType  == Node.TEXT_NODE)
                            newRange.setEnd(lastConverted, lastConverted.nodeValue.length);
                        else
                            newRange.setEnd(lastConverted, 1);
                    }
                }
            }
            if (!newRange.isCollapsed)
            {
                s.removeRange(r);
                s.addRange(newRange);
            }
            MyanmarConverterExtension._trace("Selection is " + newRange.startContainer.nodeName + " " +
                newRange.endContainer.nodeName);
        }
    }
    else
    {
        MyanmarConverterExtension._trace("Selection is " + typeof s);
        for (var p in s)
        {
            MyanmarConverterExtension._trace("s " + p + ":" + s[p]);
        }
    }
};

MyanmarConverterExtension.convertSubTree = function(converter, toUnicode, node)
{
    try
    {
        var conv = tlsMyanmarConverters[converter.toLowerCase()];
        if (conv)
        {
            var doc = node.ownerDocument;
			doc.removeEventListener("DOMNodeInserted", MyanmarConverterExtension.onTreeModified, true);
			doc.removeEventListener("DOMCharacterDataModified",MyanmarConverterExtension.onTreeModified, true);
            if (node.ownerDocument.defaultView.getSelection())
            {
                MyanmarConverterExtension.convertSelection(node, conv, toUnicode);
            }
            else
            {
                MyanmarConverterExtension.parseNodes(node, conv, toUnicode);
            }
            doc.addEventListener("DOMNodeInserted", MyanmarConverterExtension.onTreeModified, true);
			doc.addEventListener("DOMCharacterDataModified",MyanmarConverterExtension.onTreeModified, true);
        }
        else
            MyanmarConverterExtension._trace("ConvertSubTree: " + converter + " not found" + conv);
    }
    catch (e)
    {
        MyanmarConverterExtension._fail(e);
    }
};

MyanmarConverterExtension.onPopupShowing = function(popup, event)
{
    if (!popup.hasChildNodes())
    {
        for (var i = 0; i < this.legacyFonts.length; i++)
        {
            var mi = document.createElement("menuitem");
            mi.setAttribute("id", "myanmarconverter.context.popup.menu." + this.legacyFonts[i] +"2unicode");
            mi.setAttribute("label", this.messages.formatStringFromName("convertToUnicode",
                [this.legacyFonts[i]], 1));
            mi.setAttribute("oncommand", "MyanmarConverterExtension.convertSubTree('" +
                this.legacyFonts[i] + "', true, document.popupNode);");
            popup.appendChild(mi);
            mi = document.createElement("menuitem");
            mi.setAttribute("id", "myanmarconverter.context.popup.menu.unicode2" + this.legacyFonts[i]);
            mi.setAttribute("label", this.messages.formatStringFromName("convertFromUnicode",
                [this.legacyFonts[i]], 1));
            mi.setAttribute("oncommand", "MyanmarConverterExtension.convertSubTree('" +
                this.legacyFonts[i] + "', false, document.popupNode);");
            popup.appendChild(mi);
        }
    }
};

MyanmarConverterExtension.observe = function(subject, topic, data)
{
    this._trace("MyanmarConverterExtension.observe " + subject + " " + topic +
        " "  + data);
    try
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                                      .getService(Components.interfaces.nsIPrefService)
                                      .getBranch("extensions.myanmarconverter.");

        this.enabled = (prefs)? prefs.getBoolPref("enabled") : true;
        this.trace = (prefs)? prefs.getBoolPref("trace") : false;
        this.urlPatterns = MyanmarConverterOptions.loadUrlPatterns();
        
        this._trace("MyanmarConverterExtension.observe reread settings");
    }
    catch (e)
    {
        this._fail(e);
    }
};

MyanmarConverterExtension.onPopupHiding = function()
{
};

MyanmarConverterExtension.optionsDialog = function()
{
    var currentLocation = document.getElementById("content").contentDocument.location;
    MyanmarConverterExtension._trace("open ConverterOptions");
    window.openDialog("chrome://myanmar-converter/content/ConverterOptions.xul", "myanmar-converter-options",
        "chrome", this, currentLocation);
};

if (typeof TlsDebug === "undefined")
{
    function TlsDebug()
    {
        this.print = MyanmarConverterExtension._trace;
        this.FINE = 1;
        this.DEBUG = 2;
        this.INFO = 4;
        this.WARN = 8;
        this.dbgMsg = function(level, msg) {};
        return this;
    }
}

