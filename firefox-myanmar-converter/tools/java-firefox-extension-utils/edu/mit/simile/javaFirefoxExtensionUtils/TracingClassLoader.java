package edu.mit.simile.javaFirefoxExtensionUtils;

import java.net.URL;
import java.net.URLClassLoader;
import java.util.Date;

/**
 * Traces the loading of classes for debugging purposes.
 * 
 * @author stefanom
 */
public class TracingClassLoader extends URLClassLoader {
    boolean m_trace = false;

    public static URLClassLoader newInstance(boolean trace) {
        return new TracingClassLoader(trace);
    }

    private TracingClassLoader(boolean trace) {
        super(new URL[0]);
        this.m_trace = trace;
    }

    /**
     * Adds a URL to a class directory or to a JAR file.
     * 
     * @param url
     */
    public void add(URL url) {
        super.addURL(url);
    }

    /**
     * Turns tracing on or off. Tracing messages go to the Java console.
     * 
     * @param enable
     */
    public void setTracing(boolean enable) {
        this.m_trace = enable;
    }

    /* (non-Javadoc)
     * @see java.lang.ClassLoader#loadClass(java.lang.String, boolean)
     */
    protected Class loadClass(String name, boolean resolve) throws ClassNotFoundException {
        Class clazz = super.loadClass(name, resolve);
        // the above will throw a ClassNotFoundException and avoid tracing the class
        trace(name);
        return clazz;
    }

    /* (non-Javadoc)
     * @see java.lang.ClassLoader#getResource(java.lang.String)
     */
    public URL getResource(String name) {
        URL url = super.getResource(name);
        trace(name + " -> " + url);
        return url;
    }

    /**
     * @param msg
     */
    private void trace(String msg) {
        if (this.m_trace) {
            Date d = new Date();
            long millis = System.currentTimeMillis() % 1000;
            System.out.println(
                pad(d.getHours(),2) + ":" + 
                pad(d.getMinutes(),2) + ":" + 
                pad(d.getSeconds(),2) + "." + 
                pad(millis,3) + 
                " [classloader] " + 
                msg
            );
        }
    }
    
    private static String pad(long number, int digits) {
        StringBuffer str = new StringBuffer(Long.toString(number));
        for (int i = digits - 1 ; i > 0 ; i--) {
            if (number < Math.pow(10,i)) {
                str.insert(0,'0');
            }
        }
        return str.toString();
    }
}
