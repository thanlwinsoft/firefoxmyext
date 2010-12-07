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
        if(event.target.tlsUnicode == false)
        {
            event.target.value=this.conv.convertToUnicode(event.target.value);
            event.target.tlsUnicode = true;
        }
    }
    else if(event.type=='change' || event.type=='blur')
    {
        if(event.target.tlsUnicode == true)
        {
            event.target.value=this.conv.convertFromUnicode(event.target.value);
            event.target.tlsUnicode = false;
        }
        else if(event.target.length == 0)
        {
            event.target.tlsUnicode = true;
        }
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
    var i = this.input.value.indexOf(' ');
    while (i > -1)
    {
        ++count;
         i = this.input.value.indexOf(' ', i + 1);
    }
    return count;
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
        else if ((event.type=='keyup') && (event.keyCode == 229) && (this.input.value.length > 0)) // Windows IME
        {
            MyanmarConverterExtension._trace("input.value='" + this.input.value + "'");
            // check for a trailing space
            if (this.input.value.charAt(this.input.value.length - 1) == ' ')
            {
                MyanmarConverterExtension.segmentInputWords(event.target);
                this.spaceCount++;
            }
            else // count number of spaces in case inserting in middle of paragraph
            {
                var newSpaceCount = this.countSpaces();
                if (newSpaceCount > this.spaceCount)
                {
                    MyanmarConverterExtension.segmentInputWords(event.target);
                }
                this.spaceCount = newSpaceCount;
            }
        }
    }
    catch (except)
    {
        MyanmarConverterExtension._fail(except);
    }
};

