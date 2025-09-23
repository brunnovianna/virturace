import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const darkModeDefault = false;

const ThemeContext = createContext({
    toggleDarkTheme: () => {},
    darkMode: darkModeDefault
});

export function useTheme () {
    return useContext(ThemeContext);
}

export function ThemeProvider ({ children }: { children: ReactNode}) {
    const [darkMode, setDarkMode] = useState(darkModeDefault);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    const toggleDarkTheme = () => {
        setDarkMode((currentDarkMode) => !currentDarkMode);
    }

    return (<ThemeContext.Provider value={{ toggleDarkTheme, darkMode }}>
        { children }
    </ThemeContext.Provider>)
}