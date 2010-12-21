/*
Copyright 2009 Keith Stribley http://www.thanlwinsoft.org/

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

function MyanmarConverterEventListener(conv)
{
    this.messages = Components.classes["@mozilla.org/intl/stringbundle;1"]
                .getService(Components.interfaces.nsIStringBundleService)
                .createBundle("chrome://myanmar-converter/locale/MyanmarConverter.properties");
    this.conv=conv;
    this.utn11 = new TlsMyanmarUtn11();
    return this;
}

MyanmarConverterEventListener.prototype.handleEvent = function(event)
{
try{

    MyanmarConverterExtension._trace('myanmarConverterEvent' + event.type +
        ' ' + event.target.nodeName + ' "' + event.target.value + '"');
    if(event.type=='focus')
    {
        var fontName=this.messages.GetStringFromName(this.conv.data.fonts[0]);
        var statusBar = document.getElementById('myanmarConverter.status.text');
        statusBar.setAttribute("label", this.messages.formatStringFromName("sendAs",[fontName],1));
        var origSyllables = this.utn11.findSyllables(event.target.value);
        var origSpellStatus = MyanmarConverterExtension.spellCheckSyllables(origSyllables);
        var converted = this.conv.convertToUnicodeSyllables(event.target.value);
        var convertedSpellStatus = MyanmarConverterExtension.spellCheckSyllables(converted.syllables);
        if (convertedSpellStatus.knownWords > origSpellStatus.knownWords ||
            ((convertedSpellStatus.knownWords == origSpellStatus.knownWords) &&
             (convertedSpellStatus.unknownSyllables < origSpellStatus.unknownSyllables)))
            event.target.value = converted.outputText;
    }
    else if(event.type=='change' || event.type=='blur')
    {
        var origSyllables = this.utn11.findSyllables(event.target.value);
        var origSpellStatus = MyanmarConverterExtension.spellCheckSyllables(origSyllables);
        
        var nonUnicode = this.conv.convertFromUnicode(event.target.value);
        var backToUnicode = this.conv.convertToUnicodeSyllables(nonUnicode);
        var backSpellStatus = MyanmarConverterExtension.spellCheckSyllables(backToUnicode.syllables);
        if ((origSpellStatus.knownWords > 0) && 
            (backSpellStatus.knownWords >= origSpellStatus.knownWords))
        {
            event.target.value= nonUnicode;
            //event.target.tlsUnicode = false;
             MyanmarConverterExtension._trace('myanmarConverterEvent nonUnicode=' + nonUnicode);
        }
        MyanmarConverterExtension._trace("myanmarConverterEvent orig wc:" + 
            origSpellStatus.knownWords + " bcwc:" + backSpellStatus.knownWords );
        var statusBar = document.getElementById('myanmarConverter.status.text');
        statusBar.setAttribute("label","");
    }
    else if(event.type=='keypress' || event.type=='keydown')
    {
        if((event.keyCode==13) && (event.shiftKey == false))
        {
            event.target.value=this.conv.convertFromUnicode(event.target.value);
            MyanmarConverterExtension._trace('myanmarConverterEvent Enter');
        }
    }
  }
  catch (gm)
  {
     MyanmarConverterExtension._fail(gm);
  }
};

function MyanmarConverterWordSeparatorListener(input)
{
    this.input = input;
    this.spaceCount = this.countSpaces();
    return this;
}

MyanmarConverterWordSeparatorListener.prototype.countSpaces = function()
{
    var count = 0;
    var prevIndex = 0;
    var i = this.input.value.indexOf(' ');
    var maxWordLength = 0;
    while (i > -1)
    {
        ++count;
        var wordLength = i - prevIndex;
        var zwspPos = this.input.value.substring(prevIndex, i).lastIndexOf('\u200B', i);
        // this is approx but if zwsp are present we have probably already 
        // processed into words, so just check end of phrase
        if (zwspPos > -1)
            wordLength -= zwspPos;
        if (wordLength > maxWordLength)
            maxWordLength = wordLength;
        prevIndex = i + 1;
         i = this.input.value.indexOf(' ', i + 1);
    }
    var lastWordLength = this.input.value.length - prevIndex;
    var lastZwspPos = this.input.value.lastIndexOf("\u200B", this.input.value.length);
    if (lastZwspPos > -1)
        lastWordLength = this.input.value.length - lastZwspPos;
    if (lastWordLength > maxWordLength)
        maxWordLength = lastWordLength;
    var countData = new Object();
    countData.count = count;
    countData.maxWordLength = maxWordLength;
    return countData;
}

MyanmarConverterWordSeparatorListener.prototype.handleEvent = function(event)
{
    try
    {
        MyanmarConverterExtension._trace("Event.type:" + event.type + " wordsep key: " + event.keyCode +
            " char:" + event.charCode + " which: " + event.which);
        // tab, space or arrow keys
        if(((event.type=='keydown')||(event.type=='keyup')) && (event.keyCode == 9 || event.keyCode == 32 ||
             event.keyCode == 37 || event.keyCode == 38 || event.keyCode == 39 || event.keyCode == 40))
        {
            MyanmarConverterExtension.segmentInputWords(event.target);
        }
        else if ((event.type=='keyup') && (this.input.value.length > 0))
        {
            // count spaces and length of longest word
            var spaceCountData = this.countSpaces();
            MyanmarConverterExtension._trace("input.value='" + this.input.value + "' maxWordLength=" +
                spaceCountData.maxWordLength + " spaceCount=" + spaceCountData.count);
            // Apps like gmail will insert zwsp arbitrarily after 16 characters
            // if there aren't spaces or ZWSP. This causes problems if 
            // inserted mid-syllable.
            if (spaceCountData.maxWordLength >= 14)
            {
                MyanmarConverterExtension.segmentInputWords(event.target);
            }
            if (event.keyCode == 229) // Windows IME
            {
                // check for a trailing space
                if (this.input.value.charAt(this.input.value.length - 1) == ' ')
                {
                    MyanmarConverterExtension.segmentInputWords(event.target);
                }
                else // count number of spaces in case inserting in middle of paragraph
                {
                    if (spaceCountData.count > this.spaceCount)
                    {
                        MyanmarConverterExtension.segmentInputWords(event.target);
                    }
                }
            }
            this.spaceCount = spaceCountData.count;
        }
    }
    catch (except)
    {
        MyanmarConverterExtension._fail(except);
    }
};

