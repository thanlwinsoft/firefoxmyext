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
        if (convertedSpellStatus.knownWords > origSpellStatus.knownWords)
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
    return this;
}

MyanmarConverterWordSeparatorListener.prototype.handleEvent = function(event)
{
    try
    {
        MyanmarConverterExtension._trace("Event.type:" + event.type + " wordsep key: " + event.keyCode + " char:" + event.charCode);
        if(((event.type=='keydown')||(event.type=='keyup')) && (event.keyCode == 32)) // space
        {
            MyanmarConverterExtension.segmentInputWords(event.target);
        }
    }
    catch (except)
    {
        MyanmarConverterExtension._fail(except);
    }
};

