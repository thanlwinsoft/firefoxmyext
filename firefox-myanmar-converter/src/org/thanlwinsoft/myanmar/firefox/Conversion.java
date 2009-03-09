package org.thanlwinsoft.myanmar.firefox;

import java.net.URL;

import org.thanlwinsoft.doccharconvert.converter.CharConverter;
import org.thanlwinsoft.doccharconvert.converter.SyllableConverter;
import org.thanlwinsoft.doccharconvert.converter.CharConverter.FatalException;
import org.thanlwinsoft.doccharconvert.converter.CharConverter.RecoverableException;

/**
 * Firefox Myanmar Converter Extension
 * @author keith
 *
 */
public class Conversion
{
	private CharConverter mConv = null;
	private boolean mInitialized = false;
	private StringBuilder mErrors = new StringBuilder();

	/**
	 * Firefox extension entry point
	 * @param converterName
	 */
	public Conversion(String converterName)
	{

		URL url = this.getClass().getClassLoader().getResource(converterName + ".xml");
		if (url == null)
		{
			System.out.println("url not found");
			mErrors.append("url not found:" + converterName + ".xml");
			return;
		}
		//ConverterXmlParser convParser = new ConverterXmlParser();
		try
		{
			//mInitialized = convParser.parseStream(url.openStream());
			mConv = new SyllableConverter(url);
//			if (mInitialized && convParser.getConverters().size() > 0)
//			{
//				//mConv = convParser.getConverters().firstElement();
				mConv.initialize();
				mInitialized = mConv.isInitialized();
//			}
//			else
//			{
//				mErrors.append("Failed to parse stream");
//			}
		}
//		catch (IOException e)
//		{
//			mErrors.append("IOError: " + e.toString());
//			e.printStackTrace();
//		}
		catch (FatalException e)
		{
			e.printStackTrace();
			mErrors.append("Fatal error: " + e.toString());
			mConv = null;
		}
	}

	public String toString()
	{
		return getAbout() + " (init " + mInitialized + " " + mErrors.toString() + ")";
	}
	/**
	 * 
	 * @return about text
	 */
	public static String getAbout()
	{
		return "Myanmar Converter from ThanLwinSoft.org";
	}
	/**
	 * 
	 * @param text
	 * @return converted text
	 */
	public String convert(String text)
	{
		if (mConv == null) return text;
		try
		{
			return mConv.convert(text);
		}
		catch (FatalException e)
		{
			e.printStackTrace();
		}
		catch (RecoverableException e)
		{
			e.printStackTrace();
		}
		return text;
	}
	/**
	 * 
	 * @param var
	 * @return value
	 */
	public String getEnvironmentVariable(String var)
	{
    	return System.getenv(var);
    }
}
