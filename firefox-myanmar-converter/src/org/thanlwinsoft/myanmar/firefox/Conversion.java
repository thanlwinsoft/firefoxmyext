package org.thanlwinsoft.myanmar.firefox;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.net.URL;

import org.thanlwinsoft.doccharconvert.converter.CharConverter;
import org.thanlwinsoft.doccharconvert.converter.ReversibleConverter;
import org.thanlwinsoft.doccharconvert.converter.SyllableConverter;
import org.thanlwinsoft.doccharconvert.converter.CharConverter.FatalException;
import org.thanlwinsoft.doccharconvert.converter.CharConverter.RecoverableException;
import org.thanlwinsoft.myanmar.MyanmarValidator;
import org.thanlwinsoft.myanmar.Validator;

/**
 * Firefox Myanmar Converter Extension
 * @author keith
 *
 */
public class Conversion
{
	private ReversibleConverter mConv = null;
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
		try
		{
			//mInitialized = convParser.parseStream(url.openStream());
			mConv = new SyllableConverter(url);
			mConv.setDirection(true);
			mConv.initialize();
			mInitialized = mConv.isInitialized();
		}
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
	 * @param defaultToZawGyi 
	 * @return converted text
	 */
	public String convert(String text, Boolean defaultToZawGyi)
	{
		if (mConv == null) return text;
		try
		{
			Validator mv = new MyanmarValidator();
			BufferedReader inReader = new BufferedReader(new StringReader(text));
	        StringWriter outWriter = new StringWriter();
	        BufferedWriter bufferedOut = new BufferedWriter(outWriter);
	        mv.validate(inReader, bufferedOut);
	        //long errorsBefore = mv.getErrorCount();
	        bufferedOut.close();
	        mv.reset();
			String converted = mConv.convert(text);
			inReader = new BufferedReader(new StringReader(converted));
			outWriter = new StringWriter();
			bufferedOut = new BufferedWriter(outWriter);
			mv.validate(inReader, bufferedOut);
	        //long errorsAfter = mv.getErrorCount();
	        bufferedOut.close();            
            outWriter.flush();
	        // only return the result if it has fewer encoding errors than the original
            /*
	        if (errorsAfter < errorsBefore)
	        	return outWriter.toString();
	        if ((errorsAfter == errorsBefore) && defaultToZawGyi)
	        {
	        	return outWriter.toString();
	        }
	        */
        	return outWriter.toString();
		}
		catch (FatalException e)
		{
			e.printStackTrace();
		}
		catch (RecoverableException e)
		{
			e.printStackTrace();
		}
		catch (IOException e)
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
