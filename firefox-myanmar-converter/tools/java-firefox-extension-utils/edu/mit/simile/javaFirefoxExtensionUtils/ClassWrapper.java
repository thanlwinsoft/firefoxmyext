/*
 * Created on Jan 9, 2005
 */
package edu.mit.simile.javaFirefoxExtensionUtils;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.Set;

/**
 * Wraps a class so that Javascript code can more easily perform reflection
 * on the class, such as calling its static methods. Note that the marshalling
 * code is not perfect.
 *  
 * @author dfhuynh
 */
public class ClassWrapper {
    private Class       m_class;

    ClassWrapper(Class klass) {
        m_class = klass;
    }

    /**
     * @return the wrapped class as a java.lang.Class
     */
    public Class getWrappedClass() {
        return m_class;
    }

    /**
     * @return the name of the wrapped class as a String
     */
    public String getWrappedClassName() {
        return m_class.getName();
    }

    /**
     * @return a set of unique Strings that are names of methods of the wrapped class 
     */
    public Set getUniqueMethodNames() {
        Method[]    methods = m_class.getMethods();
        Set         names = new HashSet();

        for (int i = 0; i < methods.length; i++) {
            Method m = methods[i];

            names.add(m.getName());
        }

        return names;
    }

    /**
     * @return a set of unique Strings that are names of fields of the wrapped class
     */
    public Set getFieldNames() {
        Field[] fields = m_class.getFields();
        Set     names = new HashSet();

        for (int i = 0; i < fields.length; i++) {
            Field f = fields[i];

            names.add(f.getName());
        }

        return names;
    }

    /**
     * @param name
     * @return the value of a static field with the given name
     * 
     * @throws IllegalArgumentException
     * @throws SecurityException
     * @throws IllegalAccessException
     * @throws NoSuchFieldException
     */
    public Object getField(String name)
            throws IllegalArgumentException, SecurityException,
                IllegalAccessException, NoSuchFieldException {
        return m_class.getField(name).get(null);
    }

    /**
     * Calls the static method of the given name with the given array of arguments.
     * Performs coercion as much as possible.
     * 
     * @param name
     * @param arguments
     * @return
     * @throws IllegalArgumentException
     * @throws IllegalAccessException
     * @throws InvocationTargetException
     */
    public Object callMethod(String name, Object[] arguments)
            throws IllegalArgumentException, IllegalAccessException, InvocationTargetException {
        Method[]    methods = m_class.getMethods();
        Method      applicableMethod = null;
        Object[]    coercedArguments = new Object[arguments.length];

        for (int i = 0; i < methods.length; i++) {
            Method m = methods[i];

            if (m.getName().equals(name)) {
                Class[] paramTypes = m.getParameterTypes();
                if (paramTypes.length == arguments.length) {
                    int j = 0;
                    while (j < paramTypes.length) {
                        if (!argumentMatchType(arguments, paramTypes, coercedArguments, j)) {
                            //System.err.println("[class '" + m_class.getName() + "' [method '" + name + "'] Failed matching '" + arguments[j].getClass() + "' with '" + paramTypes[j] + "'");
                            break;
                        }
                        j++;
                    }

                    if (j == paramTypes.length) {
                        if (applicableMethod == null) {
                            applicableMethod = m;
                        } else {
                            throw new NoSuchMethodError(
                                "More than one method named " +
                                name +
                                " is applicable on provided arguments");
                        }
                    }
                }
            }
        }

        if (applicableMethod != null) {
            return applicableMethod.invoke(null, coercedArguments);
        }

        throw new NoSuchMethodError(
                    "No method named " + name + " is applicable on provided arguments");
    }

    /**
     * Constructs an instance of the wrapped class with the given array of arguments.
     * 
     * @param arguments
     * @return
     * @throws IllegalArgumentException
     * @throws InstantiationException
     * @throws IllegalAccessException
     * @throws InvocationTargetException
     */
    public Object callConstructor(Object[] arguments)
            throws IllegalArgumentException, InstantiationException,
                IllegalAccessException, InvocationTargetException {
        Constructor[]   constructors = m_class.getConstructors();
        Constructor     applicableConstructor = null;
        Object[]        coercedArguments = new Object[arguments.length];

        for (int i = 0; i < constructors.length; i++) {
            Constructor c = constructors[i];
            Class[]     paramTypes = c.getParameterTypes();

            if (paramTypes.length == arguments.length) {
                int j = 0;
                while (j < paramTypes.length) {
                    if (!argumentMatchType(arguments, paramTypes, coercedArguments, j)) {
                        break;
                    }
                    j++;
                }

                if (j == paramTypes.length) {
                    if (applicableConstructor == null) {
                        applicableConstructor = c;
                    } else {
                        throw new NoSuchMethodError(
                            "More than one constructor is applicable on provided arguments");
                    }
                }
            }
        }

        if (applicableConstructor != null) {
            return applicableConstructor.newInstance(coercedArguments);
        }

        throw new NoSuchMethodError(
                "No constructor is applicable on provided arguments");
    }

    final static private Class[] s_primitiveTypes = new Class[] {
        Boolean.TYPE,
        Byte.TYPE,
        Character.TYPE,
        Double.TYPE,
        Float.TYPE,
        Integer.TYPE,
        Long.TYPE,
        Short.TYPE
    };
    final static private Class[] s_primitiveClasses = new Class[] {
        Boolean.class,
        Byte.class,
        Character.class,
        Double.class,
        Float.class,
        Integer.class,
        Long.class,
        Short.class
    };

    private boolean argumentMatchType(
            Object[]    arguments,
            Class[]     types,
            Object[]    coercedArguments,
            int         index
        ) {
        Object  argument = arguments[index];
        Class   type = types[index];

        coercedArguments[index] = argument;

        if (argument == null) {
            coercedArguments[index] = null;
            return true;
        } else if (type.isAssignableFrom(argument.getClass())) {
            coercedArguments[index] = argument;
            return true;
        } else if (type.equals(String.class)) {
            coercedArguments[index] = argument.toString();
            return true;
        } else {
            if (argument instanceof Double) {
                double d = ((Double) argument).doubleValue();
                if ((d - ((int) d)) == 0.0) {
                    coercedArguments[index] = new Integer((int) d);
                }
            } else if (argument instanceof Float) {
                float f = ((Float) argument).floatValue();
                if ((f - ((int) f)) == 0) {
                    coercedArguments[index] = new Integer((int) f);
                }
            }

            if (type.isPrimitive()) {
                for (int i = 0; i < s_primitiveClasses.length; i++) {
                    if (type.equals(s_primitiveTypes[i])) {
                        type = s_primitiveClasses[i];
                        break;
                    }
                }
            }

            return type.isAssignableFrom(coercedArguments[index].getClass());
        }
    }
}
