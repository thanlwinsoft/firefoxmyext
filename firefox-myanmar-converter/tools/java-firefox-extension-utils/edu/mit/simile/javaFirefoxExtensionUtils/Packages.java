/*
 * Created on Jan 9, 2005
 */
package edu.mit.simile.javaFirefoxExtensionUtils;

/**
 * Lets Javascript code easily look up a class (wrapped).
 * 
 * @author dfhuynh
 */
public class Packages {
    public ClassWrapper getClass(String name) {
        try {
            Class klass = Class.forName(name);

            if (klass != null) {
                return new ClassWrapper(klass);
            }
        } catch (ClassNotFoundException e) {
            // do nothing, return null
        }
        return null;
    }
}
