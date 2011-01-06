/*
Copyright 2009-2011 Keith Stribley
Website: http://www.thanlwinsoft.org/

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
            var conv = new TlsMyanmarConverter(tlsMyanmarConverterData[this.legacyFonts[i].toLowerCase()]);
            conv.listener = new MyanmarConverterEventListener(conv);
            MyanmarConverterExtension._trace("Loaded " + this.legacyFonts[i]);
        }
        this.utn11 = new TlsMyanmarUtn11();

        //page load listener
        var appcontent = document.getElementById("appcontent"); // browser
        if (!appcontent)
        {
            appcontent = document.getElementById("frame_main_pane"); // songbird
        }
        if (appcontent)
        {
            appcontent.addEventListener("DOMContentLoaded", MyanmarConverterExtension.onPageLoad, true);
            var container = gBrowser.tabContainer;
            if (typeof container != "undefined")
                container.addEventListener("TabSelect", this, false);
        }
        
        // Different versions of Firefox have different contract IDs
        var spellClass = "@mozilla.org/spellchecker/myspell;1";
        if ("@mozilla.org/spellchecker/hunspell;1" in Components.classes)
	        spellClass = "@mozilla.org/spellchecker/hunspell;1";
        if ("@mozilla.org/spellchecker/engine;1" in Components.classes)
	        spellClass = "@mozilla.org/spellchecker/engine;1";
	    this.spellChecker = Components.classes[spellClass]
	        .createInstance(Components.interfaces.mozISpellCheckingEngine);
	    var list = new Object();
	    var dictCount = new Object();
	    this.spellChecker.getDictionaryList(list, dictCount);
	    this._trace(list.value);
	    this.spellChecker.dictionary = "my_MM";
	    this._trace("Dict: " + " Lang: " + this.spellChecker.language);
	    
	    this.personalDict = Components.classes["@mozilla.org/spellchecker/personaldictionary;1"]
            .getService(Components.interfaces.mozIPersonalDictionary);
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
        MyanmarConverterExtension._trace("onPageLoad " + event.originalTarget.nodeName +
            " " + event.originalTarget.location.href + " "
            /*+ event.originalTarget.body.innerHTML*/);
        var enableMenu = document.getElementById("myanmarConverter.enable.menu");
        if (enableMenu)
        {
            enableMenu.setAttribute("checked", MyanmarConverterExtension.enabled);
        }
        //else
        //    MyanmarConverterExtension._trace("enable.menu not found");

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

/**
* Segment between Myanmar words in an input or textarea element using ZWSP
* and adjust the selection accordingly.
*/
MyanmarConverterExtension.segmentInputWords = function(inputElement)
{
    var text = inputElement.value;
    if (!text.match("[က-႟]"))
        return;
    var oldSelStart = inputElement.selectionStart;
    var oldSelEnd = inputElement.selectionEnd;
    // Strip any old ZWSP and redo, since they may be in the wrong place after
    // editing, BUT leave ZWSP E-Vowel since otherwise U+1031 will hop to the
    // previous consonant with some input methods.
    var zwspWjRegEx = new RegExp("(​[ေႄ])|[​⁠]", "g");
    var beforeSelection = text.substring(0, oldSelStart).replace(zwspWjRegEx, "$1");
    var selectionText = text.substring(oldSelStart, oldSelEnd).replace(zwspWjRegEx, "$1");
    text = text.replace(zwspWjRegEx, "$1");
    oldSelStart = beforeSelection.length;
    oldSelEnd = beforeSelection.length + selectionText.length;
    var myNoPunctuationRegEx = new RegExp("[က-၉၌-႟]");
    var newSelStart = oldSelStart;
    var newSelEnd = oldSelEnd;
    var syllables = this.utn11.findSyllables(text);
    var checkResult = this.spellCheckSyllables(syllables);
    var output = "";
    var origIndex = 0;
    var newIndex = 0;
    var startIndex = 0;
    for (var i = 0; i < syllables.length; i++)
    {
        if ((oldSelStart > origIndex) && (oldSelStart < origIndex + syllables[i].length))
        {
            newSelStart += (newIndex - origIndex);
        }
        else if (oldSelStart == origIndex)
        {
            newSelStart += (newIndex - origIndex);
            // check if we should be before a zwsp
            if ((output.length > 0) &&
                (output.charAt(output.length - 1) == '\u200B') &&
                (inputElement.selectionStart == newSelStart - 1))
                newSelStart = inputElement.selectionStart;
        }
        if ((oldSelEnd > origIndex) && (oldSelEnd < origIndex + syllables[i].length))
        {
            newSelEnd += (newIndex - origIndex);
        }
        else if (oldSelEnd == origIndex)
        {
            newSelEnd += (newIndex - origIndex);
            // check if we should be before a zwsp
            if ((output.length > 0) &&
                (output.charAt(output.length - 1) == '\u200B') &&
                (inputElement.selectionEnd == newSelEnd - 1))
                newSelEnd = inputElement.selectionEnd;
        }
        output += syllables[i];
        origIndex += syllables[i].length;
        newIndex += syllables[i].length;
        
        if ((checkResult.wordBreaks.length > 0) && (checkResult.wordBreaks[0] == i))
        {
            var nextWord = "";
            if (checkResult.wordBreaks.length > 1)
            {
                for (var j = i+1; j <= checkResult.wordBreaks[1]; j++)
                {
                    nextWord += syllables[j];
                }
            }
            this._trace("NextWord::" + nextWord);
            if((nextWord.length > 0) &&
                (newIndex - startIndex == nextWord.length) &&
                (output.substring(startIndex,newIndex) == nextWord))
            {
                newIndex += 1;
                output += "\u2060";
                checkResult.wordBreaks.shift();
            }
            else if ((syllables[i].length > 0) && 
                    !(syllables[i].substring(syllables[i].length-1,
                     syllables[i].length).match(myNoPunctuationRegEx)))
            {
                startIndex = newIndex;
                checkResult.wordBreaks.shift();
            }
            else if ((i + 1 < syllables.length) && (syllables[i+1].length > 0)
                && syllables[i+1].substring(0,1).match(myNoPunctuationRegEx))
            {
                newIndex += 1;
                startIndex = newIndex;
                output += "\u200B";
                checkResult.wordBreaks.shift();
                this._trace("zwsp between " + syllables[i] + "'" + 
                    syllables[i+1] +"'");
            }
            else
            {
                startIndex = newIndex;
                checkResult.wordBreaks.shift();
            }
        }
        else if (!syllables[i].match(myNoPunctuationRegEx))
        {
            startIndex = newIndex;
        }
    }
    if (oldSelStart >= origIndex)
    {
        newSelStart = newIndex;
    }
    if (oldSelEnd >= origIndex)
    {
        newSelEnd = newIndex;
    }
    this._trace("segmentInputWords old:" + oldSelStart + "-" + oldSelEnd + " " +
        inputElement.selectionStart + "-" +
        inputElement.selectionEnd + " new" + newSelStart + "-" + newSelEnd);
    inputElement.value = output;
    inputElement.setSelectionRange(newSelStart, newSelEnd);
}

/**
* Spell check an array of Myanmar syllables counting the number of known Myanmar
* words and number of unknown syllables.
*/
MyanmarConverterExtension.spellCheckSyllables = function(syllables)
{
    var convertedText = "";
    var unknownSyllables = 0;
    var knownWordCount = 0;
    var wordBreaks = new Array();
    for (var j = 0 ; j< syllables.length; j++)
    {
        var testWord = syllables[j];
        var checkedWord = "";
        var matchedSyllables = 0;
        if (this.spellChecker.check(testWord))
        {
            checkedWord = testWord;
            matchedSyllables = 1;
        }
        // assume max of 8 'syllables' per word
        var k = j + 1;
        for (; k < j + 8 && k < syllables.length; k++)
        {
            if (!(syllables[k].match("[က-႟]")))
                break;
            testWord += syllables[k];
            if (this.spellChecker.check(testWord))
            {
                checkedWord = testWord;
                matchedSyllables = k - j + 1;
            }
        }
        if (matchedSyllables > 0)
        {
            convertedText += checkedWord;
            j += matchedSyllables - 1;
            if ((j + 1 < syllables.length) && (syllables[j+1].match("[က-၉၌-႟]")))
            {
                wordBreaks.push(j);
            }
            knownWordCount += 1;
        }
        else
        {
            convertedText += syllables[j];
            if (syllables[j].match("[က-၉၌-႟]"))
            {
                unknownSyllables += 1;
                if ((j + 1 < syllables.length) && (syllables[j+1].match("[က-၉၌-႟]")))
                {
                    wordBreaks.push(j);
                }
            }
        }
    }
    var ret = new Object();
    ret.text = convertedText;
    ret.knownWords = knownWordCount;
    ret.unknownSyllables = unknownSyllables;
    ret.wordBreaks = wordBreaks;
    this._trace(ret.text + " Known: " + ret.knownWords + " Unknown: " + ret.unknownSyllables + " " + wordBreaks);
    return ret;
}

MyanmarConverterExtension.guessConvert = function(parentNode, nodeText, pageConverter, toUnicode)
{

    var ret = new Object();
    var nodeFontFamily = "";
    try
    {
        if (parentNode)
            nodeFontFamily = window.getComputedStyle(parentNode, null).fontFamily;
    }
    catch(e)
    {
        this._trace("ParentNode::" + parentNode );
        this._fail(e);
    }
    var matchIndex = -1;
    var nodeConverter = null;
    var bestFreq = 0;
    var convertedText = nodeText;
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
              .getService(Components.interfaces.nsIPrefService)
              .getBranch("extensions.myanmarconverter.");

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
        else if (toUnicode)
        {
            // it is quite common for short Zawgyi phrases not to use Mon, Karen, Shan codes, so need to
            // change for any characters in Myanmar code range
            if (nodeText.match("[က-႟]") && testConv.isPseudoUnicode())
            {
                var uniFreqMatch = testConv.matchFrequency(nodeText, true);
                var uniFreq = uniFreqMatch.freq;
                var pseudoFreq = testConv.matchFrequency(nodeText, false).freq;
                if ((pseudoFreq > uniFreq) && (pseudoFreq > bestFreq))
                {
                    nodeConverter = testConv;
                    bestFreq = pseudoFreq;
                    if (prefs.getBoolPref("useZwsp"))
                    {
                        convertedText = testConv.convertToUnicodeSyllables(nodeText);
                        var syllables = convertedText.syllables;
                        var convertedResult = this.spellCheckSyllables(syllables);
                        ret.converted = this.segmentWords(syllables, convertedResult.wordBreaks);
                        ret.converter = testConv;
                        this._trace(((parentNode)? parentNode.nodeName : "") + " segmented words in guessConvert " + ret.converted);
                        return ret;
                    }
                    this._trace("Not segmented words in guessConvert " + ret.converted);
                }
                else if (pseudoFreq == uniFreq)
                {
                    this._trace("pf:" + pseudoFreq + " uf:" + uniFreq);
                    convertedText = testConv.convertToUnicodeSyllables(nodeText);
                    var syllables = convertedText.syllables;
                    var convertedResult = this.spellCheckSyllables(syllables);
                    var unconvertedResult = this.spellCheckSyllables(uniFreqMatch.syllables);
                    if (convertedResult.unknownSyllables >= unconvertedResult.unknownSyllables)
                    {
                        ret.converted = nodeText;
                        ret.converter = null;
                        return ret;
                    }
                    else
                    {
                        if (prefs.getBoolPref("useZwsp"))
                        {
                            ret.converted = this.segmentWords(syllables, convertedResult.wordBreaks);
                            this._trace("segmented words in guessConvert (freq equal)" + ret.converted);
                        }
                        else
                        {
                            ret.converted = convertedText.outputText;
                            this._trace("Not segmented words in guessConvert (freq equal)" + ret.converted);
                        }
                        ret.converter = testConv;
                        return ret;
                    }
                }
            }
        }
    }

    ret.converter = nodeConverter;
    if (nodeConverter)
        ret.converted = (toUnicode)? nodeConverter.convertToUnicode(nodeText) : 
                nodeConverter.convertFromUnicode(nodeText);
    else
        ret.converted = nodeText;
    return ret;
}

MyanmarConverterExtension.segmentWords = function (syllables, wordBreaks)
{
    var converted = "";
    for (var i = 0; i < syllables.length; i++)
    {
        converted += syllables[i];
        if ((wordBreaks.length > 0) &&
            (wordBreaks[0] == i))
        {
            converted += "​";
            wordBreaks.shift();
        }
    }
    return converted;
}

MyanmarConverterExtension.parseNodes = function(parent, converter, toUnicode)
{
    var doc = parent.ownerDocument;
    if (converter == null)
    {
        if (doc.tlsMyanmarEncoding && (typeof doc.tlsMyanmarEncoding != "undefined"))
            converter = tlsMyanmarConverters[doc.tlsMyanmarEncoding.toLowerCase()];
        if (typeof converter == "undefined")
        {
            MyanmarConverterExtension.guessMyanmarEncoding(doc, parent);
            this._trace("doc.tlsMyanmarEncoding" + typeof doc.tlsMyanmarEncoding);
            if (doc.tlsMyanmarEncoding && (typeof doc.tlsMyanmarEncoding == "Object"))
            {
                converter = tlsMyanmarConverters[doc.tlsMyanmarEncoding.toLowerCase()];
            }
            if (typeof converter == "undefined")
            {
                //MyanmarConverterExtension._trace("converter undefined: " + doc.tlsMyanmarEncoding);
                // still parse checking for specific styles
            }
        }
    }
    var convertText = true;
    //this._trace("parseNodes " + parent.innerHTML);
    // if this is directly called by the event it may not be a text node
    if (parent.nodeType == Node.TEXT_NODE)
    {
        var node = parent;
        var theParent = node.parentNode;
        var oldValue = new String(node.nodeValue);
        var bestConv = converter;
        // don't convert within a text area
        if (theParent && (theParent.nodeName == "TEXTAREA")) return;
        if (toUnicode)
        {
            var convResult = MyanmarConverterExtension.guessConvert(node.parentNode, node.nodeValue, converter, toUnicode);
            bestConv = convResult.converter;
        }
        //this._trace("ForOldValueInParseNodes::"+oldValue+" "+typeof bestConv);
        if (bestConv)
        {
            var newValue = convResult.converted;
            if (oldValue != newValue)
            {
                var newNode =  node.ownerDocument.createTextNode(newValue);
                theParent.replaceChild(newNode, node);
                theParent.style.fontFamily = bestConv.getFontFamily(toUnicode);
                if (toUnicode) theParent.lang = "my";
            }
            if((converter == null) && toUnicode)
            {
                doc.tlsMyanmarEncoding = bestConv.data.fonts[0];
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
            NodeFilter.SHOW_TEXT, { acceptNode: function(node) {
                        if (node.parentNode && (node.parentNode.nodeName == "TEXTAREA"))
                        {return NodeFilter.FILTER_SKIP;} 
                        else return NodeFilter.FILTER_ACCEPT; }}, false);
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
        var oldValue = new String(textNode.nodeValue);
        var prevNode = textNode;
        var hasWbr = false;
        textNode = walker.nextNode();
        if (converter || toUnicode)
        {
            while ((prevNode.nextSibling &&
                (prevNode.nextSibling.nodeName.toLowerCase() == "wbr")) ||
                (prevNode.nextSibling == null && prevNode.parentNode.nextSibling &&
                 prevNode.parentNode.nextSibling.nodeName.toLowerCase() == "wbr"))
            {
                this._trace("found wbr");
                var wbr = (prevNode.nextSibling)? prevNode.nextSibling :
                    prevNode.parentNode.nextSibling;
                if (wbr.nextSibling && wbr.nextSibling.nodeName.toLowerCase() == "span" &&
                    wbr.nextSibling.hasAttribute("class") &&
                    wbr.nextSibling.getAttribute("class") == "word_break")
                {
                    if (textNode.previousSibling == wbr.nextSibling)
                    {
                        hasWbr = true;
                        oldValue += textNode.nodeValue;
                        var nextNode = textNode;
                        textNode = walker.nextNode();
                        wbr.parentNode.removeChild(nextNode);
                        wbr.parentNode.removeChild(wbr.nextSibling);
                        wbr.parentNode.removeChild(wbr);
                    }
                    else if (textNode.parentNode.previousSibling == wbr.nextSibling)
                    {
                        var nextStyle = window.getComputedStyle(textNode.parentNode, null);
                        if (nextStyle.fontFamily == style.fontFamily)
                        {
                            hasWbr = true;
                            oldValue += textNode.nodeValue;
                            var nextNode = textNode;
                            textNode = walker.nextNode();
                            if (nextNode.parentNode.childNodes.length == 1)
                            {
                                wbr.parentNode.removeChild(nextNode.parentNode);
                            }
                            else
                            {
                                nextNode.parentNode.removeChild(nextNode);
                            }
                            wbr.parentNode.removeChild(wbr.nextSibling);
                            wbr.parentNode.removeChild(wbr);
                        }
                    }
                }
                else if (wbr.nextSibling == textNode)
                {
                    hasWbr = true;
                    oldValue += textNode.nodeValue;
                    var nextNode = textNode;
                    textNode = walker.nextNode();
                    wbr.parentNode.removeChild(nextNode);
                    wbr.parentNode.removeChild(wbr);
                }
                else if (wbr.nextSibling == textNode.parentNode)
                {
                    var nextStyle = window.getComputedStyle(textNode.parentNode, null);
                    if (nextStyle.fontFamily == style.fontFamily)
                    {
                        hasWbr = true;
                        oldValue += textNode.nodeValue;
                        var nextNode = textNode;
                        textNode = walker.nextNode();
                        if (nextNode.parentNode.childNodes.length == 1)
                        {
                            wbr.parentNode.removeChild(nextNode.parentNode);
                        }
                        else
                        {
                            nextNode.parentNode.removeChild(nextNode);
                        }
                        wbr.parentNode.removeChild(wbr);
                    }
                }
                else
                {
                    this._trace("MyanmarConverter: wbr ignored after '" + prevNode.nodeValue + "'");
                    break;
                }
            }
            var guessResult = this.guessConvert(walker.currentNode.parentNode, oldValue, converter, toUnicode);    
            var newValue = guessResult.converted;
            bestConv = guessResult.converter;
            if ((oldValue != newValue) || wbr)
            {
                var newNode = prevNode.ownerDocument.createTextNode(newValue);
                if (theParent.childNodes.length == 1)
                {
                    theParent.replaceChild(newNode, prevNode);
                    if (bestConv != null)
                        theParent.style.fontFamily = bestConv.getFontFamily(toUnicode);
                    if (toUnicode) theParent.lang = "my";
                }
                else
                {
                    var span = prevNode.ownerDocument.createElement("span");
                    if (bestConv != null)
                        span.style.fontFamily = bestConv.getFontFamily(toUnicode);
                    if (toUnicode) span.lang = "my";
                    span.appendChild(newNode);
                    theParent.replaceChild(span, prevNode);
                }
                if ((converter == null) && (bestConv != null) && toUnicode)
                {
                    doc.tlsMyanmarEncoding = bestConv.data.fonts[0];
                    converter = bestConv;
                }
            }
        }
    }
    // convert alt text
    if (converter != null || toUnicode)
    {
        var altConv = converter;
        var images=parent.getElementsByTagName('img');
        for(var i = 0 ;i < images.length ; i++)
        {
            if(images[i].hasAttribute("alt"))
            {
                var oldAlt=images[i].getAttribute('alt');
                var guess = this.guessConvert(images[i], oldAlt, converter, toUnicode);
                var newAlt = guess.converted;
                images[i].setAttribute('alt',newAlt);
            }
        }
        //convert title text
        var treeWalker = parent.ownerDocument.createTreeWalker(parent,
                    NodeFilter.SHOW_ELEMENT,{ acceptNode: function(node) {
                        if (node.hasAttribute("title"))
                        {return NodeFilter.FILTER_ACCEPT;} 
                        else return NodeFilter.FILTER_SKIP; }} 
                    , false);
        while(treeWalker.nextNode())
        {
            var oldTitle=treeWalker.currentNode.getAttribute('title');
            var guess = this.guessConvert(treeWalker.currentNode, oldTitle, converter, toUnicode);
            var newTitle = guess.converted;
            treeWalker.currentNode.setAttribute("title",newTitle);
        }
    }
}

MyanmarConverterExtension.processDoc = function(doc) {
    var enc = MyanmarConverterExtension.guessMyanmarEncoding(doc, doc.body);

    if (doc.body)
    {
        // status TODO
        var statusBar = document.getElementById('myanmarConverter.status.text');
        if((enc != null) && (enc != 'unicode'))
        {
            var fontName=this.messages.GetStringFromName(enc);
            statusBar.setAttribute("label", this.messages.formatStringFromName("converted",[fontName],1));
        }
        else
        {
            statusBar.setAttribute("label","");
        }
        MyanmarConverterExtension.parseNodes(doc.body, null, true);
        MyanmarConverterExtension.addWordSegmenters(doc.body);
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
                var titleSyllables = this.utn11.findSyllables(doc.title);
                var unconvertedCheck = this.spellCheckSyllables(titleSyllables);
                var converted = converter.convertToUnicodeSyllables(doc.title);
                var convertedCheck = this.spellCheckSyllables(converted.syllables);
                if ((convertedCheck.unknownSyllables <= unconvertedCheck.unknownSyllables) &&
                    (convertedCheck.knownWords <= unconvertedCheck.knownWords))
                    doc.title = converted.outputText;
            }
            else if (doc.tlsMyanmarEncoding != "unicode")
            {
                MyanmarConverterExtension._trace("No converter for: " + doc.tlsMyanmarEncoding);
            }
        }
    }
    catch (e)
    {
        MyanmarConverterExtension._fail(e);
    }
};

MyanmarConverterExtension.addWordSegmenters = function(parentNode)
{
    try
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
          .getService(Components.interfaces.nsIPrefService)
          .getBranch("extensions.myanmarconverter.");
        if (prefs.getBoolPref("useZwsp") && parentNode.nodeType == Node.ELEMENT_NODE)
        {
            var treeWalker = parentNode.ownerDocument.createTreeWalker(parentNode,
                        NodeFilter.SHOW_ELEMENT,{ acceptNode: function(node) {
                            if (node.nodeName == 'INPUT' || node.nodeName == 'TEXTAREA')
                            {return NodeFilter.FILTER_ACCEPT;}
                            else return NodeFilter.FILTER_SKIP; }} 
                        , false);
            while(treeWalker.nextNode())
            {
                MyanmarConverterExtension.addSegmentWordListener(treeWalker.currentNode);
            }
        }
    }
    catch (e)
    {
        MyanmarConverterExtension._fail(e);
    }
}

MyanmarConverterExtension.onTreeModified = function(event)
{
    if (event.target)
    {
        try
        {
        MyanmarConverterExtension._trace(event.type + " " + event.target + ' ' +
            event.target.nodeName + ' ' /*+ event.target.innerHTML*/);
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
                MyanmarConverterExtension.addWordSegmenters(event.target);
            }
            doc.addEventListener("DOMCharacterDataModified",MyanmarConverterExtension.onTreeModified, true);
            doc.addEventListener("DOMNodeInserted", MyanmarConverterExtension.onTreeModified, true);
        }
        catch (e)
        {
            MyanmarConverterExtension._fail(e);
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
    //this._trace("target.textContent:"+target.textContent);
};

MyanmarConverterExtension.isEnabledForUrl = function(url) {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                                      .getService(Components.interfaces.nsIPrefService)
                                      .getBranch("extensions.myanmarconverter.");

    this.enabled = (prefs)? prefs.getBoolPref("enabled") : true;
    try
    {
        if (url)
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
                        hostMatch = true;
                }
                else
                {
                    var pos = url.hostname.indexOf(pattern.hostname);
                    if ((pos > -1) && (pos + pattern.hostname.length == url.hostname.length))
                    {
                        hostMatch = true;
                    }
                }
                if (hostMatch &&
                    ((pattern.pathnameExact && url.pathname == pattern.pathname) || 
                    (url.pathname.indexOf(pattern.pathname) == 0)))
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
                unicodeFreq = conv.matchFrequency(testNode.textContent, true).freq;
            // converters using Latin script code points can match English with
            // very bad consequences
            if (!conv.isPseudoUnicode())
                continue;
            var f = conv.matchFrequency(testNode.textContent, false).freq;
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
        var mu=document.createElement("menu");
        mu.setAttribute("id", "myanmarconverter.context.popup.form.menu");
        var label=this.messages.GetStringFromName("formMenu");
        mu.setAttribute("label", label);
        popup.appendChild(mu);
        var mupp=document.createElement("menupopup")
        mupp.setAttribute("id","myanmarconverter.context.popup.form.menupopup");
        mu.appendChild(mupp);
        for (var i = 0; i < this.legacyFonts.length; i++)
        {
            var mi = document.createElement("menuitem");
            mi.setAttribute("id", "myanmarconverter.context.popup.menu." + this.legacyFonts[i] +"2unicode");
            var fontName=this.messages.GetStringFromName(this.legacyFonts[i]);
            mi.setAttribute("label", this.messages.formatStringFromName("asFont",
                [fontName], 1));
            mi.setAttribute("oncommand", "MyanmarConverterExtension.addFormEventHandlers('" +
                this.legacyFonts[i] + "', document.popupNode);");
            mupp.appendChild(mi);
        }
        mu=document.createElement("menu");
        mu.setAttribute("id", "myanmarconverter.context.popup.toUnicode.menu");
        label=this.messages.GetStringFromName("convertToUnicodeMenu");
        mu.setAttribute("label", label);
        popup.appendChild(mu);
        mupp=document.createElement("menupopup")
        mupp.setAttribute("id","myanmarconverter.context.popup.toUnicode.menupopup");
        mu.appendChild(mupp);
        for (var i = 0; i < this.legacyFonts.length; i++)
        {
            var mi = document.createElement("menuitem");
            mi.setAttribute("id", "myanmarconverter.context.popup.menu." + this.legacyFonts[i] +"2unicode");
            var fontName=this.messages.GetStringFromName(this.legacyFonts[i]);
            mi.setAttribute("label", this.messages.formatStringFromName("fromFont",
                [fontName], 1));
            mi.setAttribute("oncommand", "MyanmarConverterExtension.convertSubTree('" +
                this.legacyFonts[i] + "', true, document.popupNode);");
            mupp.appendChild(mi);
        }
        mu=document.createElement("menu");
        mu.setAttribute("id", "myanmarconverter.context.popup.fromUnicode.menu");
        label=this.messages.GetStringFromName("convertFromUnicodeMenu");
        mu.setAttribute("label", label);
        popup.appendChild(mu);
        mupp=document.createElement("menupopup")
        mupp.setAttribute("id","myanmarconverter.context.popup.fromUnicode.menupopup");
        mu.appendChild(mupp);
        for (var i = 0; i < this.legacyFonts.length; i++)
        {
            var mi = document.createElement("menuitem");
            mi.setAttribute("id", "myanmarconverter.context.popup.menu.unicode2" + this.legacyFonts[i]);
            var fontName=this.messages.GetStringFromName(this.legacyFonts[i]);
            mi.setAttribute("label", this.messages.formatStringFromName("toFont",
                [fontName], 1));
            mi.setAttribute("oncommand", "MyanmarConverterExtension.convertSubTree('" +
                this.legacyFonts[i] + "', false, document.popupNode);");
            mupp.appendChild(mi);
        }
        var splitWordsMenu = document.createElement("menuitem");
        splitWordsMenu.setAttribute("id", "myanmarconverter.context.popup.menu.separateWords");
        splitWordsMenu.setAttribute("label", this.messages.GetStringFromName("separateWordsWithZwsp"));
        splitWordsMenu.setAttribute("oncommand", "MyanmarConverterExtension.addSegmentWordListener(document.popupNode);");
        popup.appendChild(splitWordsMenu);
        
        var convertToUnicodeMenu = document.createElement("menuitem");
        convertToUnicodeMenu.setAttribute("id", "myanmarConverter.context.menuDefault");
        convertToUnicodeMenu.setAttribute("label", this.messages.GetStringFromName("convertPageToUnicode"));
        convertToUnicodeMenu.setAttribute("oncommand", "MyanmarConverterExtension.convertDocument(document.popupNode);");
        popup.appendChild(convertToUnicodeMenu);
        
    }
};


MyanmarConverterExtension.addSegmentWordListener = function(n)
{
    try
    {
        if (n.nodeName == 'TEXTAREA' || (n.nodeName == 'INPUT' && (!n.hasAttribute('type') || !n.getAttribute('type').match("password|checkbox|radio|submit|reset|file|hidden|image|button"))))
        {
            MyanmarConverterExtension.segmentInputWords(n);
            var eListener = new MyanmarConverterWordSeparatorListener(n);
            n.addEventListener('keydown', eListener, false);
            n.addEventListener('keyup', eListener, false);
            n.addEventListener('keypress', eListener, false);
        }
    }
    catch(e)
    {
        MyanmarConverterExtension._fail(e);
    }
}

MyanmarConverterExtension.addFormEventHandlers = function(converterName, node)
{
    try
    {
        var conv=tlsMyanmarConverters[converterName.toLowerCase()];
        MyanmarConverterExtension._trace('addFormEventHandlers' + node.nodeName + ' "' + node.value + '"');
        var doc = node.ownerDocument;
        
        if(node.nodeName == 'TEXTAREA' || (node.nodeName == 'INPUT' && (!node.hasAttribute('type') || !node.getAttribute('type').match("password|checkbox|radio|submit|reset|file|hidden|image|button"))))
        {
            for (var i = 0; i < this.legacyFonts.length; i++)
            {
                var oldConv = tlsMyanmarConverters[this.legacyFonts[i].toLowerCase()];
                node.removeEventListener('keydown',oldConv.listener,false);
                node.removeEventListener('focus',oldConv.listener,false);
                node.removeEventListener('change',oldConv.listener,false);
                node.removeEventListener('blur',oldConv.listener,false);
            }
            node.addEventListener('keydown',conv.listener,false);
            node.addEventListener('focus',conv.listener,false);
            node.addEventListener('change',conv.listener,false);
            node.addEventListener('blur',conv.listener,false);
            //node.tlsEventListener = conv.listener;
            //node.tlsUnicode = true;
            // status TODO
            var fontName=this.messages.GetStringFromName(converterName);
            MyanmarConverterExtension._trace('Font As::::' + fontName);
            
            var statusBar = document.getElementById('myanmarConverter.status.text');
            statusBar.setAttribute("label", this.messages.formatStringFromName("sendAs",[fontName],1));
        }
        else
        {
            var area=node.getElementsByTagName('textarea');
            var input=node.getElementsByTagName('input');
            
            if(area.length > 0 || input.length > 0 )
            {
                if(doc.forms.length)
                {
                    for(var i=0 ; i<area.length ; i++)
                    {
                        if(typeof node.tlsEventListener == "object")
                        {
                            node.removeEventListener('focus',node.tlsEventListener,false);
                            node.removeEventListener('change',node.tlsEventListener,false);
                            node.removeEventListener('blur',node.tlsEventListener,false);
                        }
                        area[i].addEventListener('focus',eListener,false);
                        area[i].addEventListener('change',eListener,false);
                        area[i].addEventListener('blur',eListener,false);
                        area[i].tlsUnicode = true;
                    }
                    for(var i=0 ; i<input.length ; i++)
                    {
                        if(!input[i].hasAttribute('type') || input[i].getAttribute('type')=='text')
                        {
                            if(typeof node.tlsEventListener == "object")
                            {
                                node.removeEventListener('focus',node.tlsEventListener,false);
                                node.removeEventListener('change',node.tlsEventListener,false);
                                node.removeEventListener('blur',node.tlsEventListener,false);
                            }
                            input[i].addEventListener('focus',eListener,false);
                            input[i].addEventListener('change',eListener,false);
                            input[i].addEventListener('blur',eListener,false);
                            input[i].tlsUnicode = true;
                        }
                    }
                }
                else
                {
                    for(var i=0 ; i<area.length ; i++)
                    {
                        if(typeof node.tlsEventListener == "object")
                        {
                            node.removeEventListener('keydown',node.tlsEventListener,false);   
                        }
                        area[i].addEventListener('keydown',eListener,false);
                        MyanmarConverterExtension._trace("area Event Listener " + area[i].id);
                    }
                    for(var i=0 ; i<input.length ; i++)
                    {
                        if(!input[i].hasAttribute('type') || input[i].getAttribute('type')=='text')
                        {
                            if(typeof node.tlsEventListener == "object")
                            {
                                node.removeEventListener('keydown',node.tlsEventListener,false);   
                            }
                            input[i].addEventListener('keydown',eListener,false);
                        }
                    }
                    doc.defaultView.addEventListener('keydown', eListener, false);
                }

            }
        }
    }
    catch(gm)
    {
        MyanmarConverterExtension._fail(gm);
    }
    
};

MyanmarConverterExtension.handleEvent = function(event)
{
    try
    {
        if(event.type == 'TabSelect')
        {
//            this._trace("MyanmarConverterExtension.handleEvent " + event.type 
//                + gBrowser.contentDocument.tlsMyanmarEncoding);
                
            var doc = gBrowser.contentDocument;
            var statusBar = document.getElementById('myanmarConverter.status.text');
            if((typeof doc.tlsMyanmarEncoding != "undefined") &&
               (doc.tlsMyanmarEncoding != "unicode"))
            {
                var fontName=this.messages.GetStringFromName(doc.tlsMyanmarEncoding);
                statusBar.setAttribute("label", this.messages.formatStringFromName("converted",[fontName],1));
            }
            else
            {
                statusBar.setAttribute("label", "");
            }
        }
    }
    catch(gm)
    {
        MyanmarConverterExtension._fail(gm);
    }
}

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

