import { useTheme } from '../contexts/Theme';


export default function Theme () {
    const { darkMode, toggleDarkTheme } = useTheme();
    
    return (
        <div className="flex justify-end">
            <div 
                onClick={toggleDarkTheme}
                className="w-10 h-6 rounded-full cursor-pointer bg-gray-300 dark:bg-gray-600 flex items-center p-1">
                <div className={`
                    w-4 h-4 rounded-full bg-white shadow-md
                    transform transition-transform duration-300 ease-in-out
                    ${ darkMode ? 'translate-x-4' : 'translate-x-0' }
                `}>
                </div>
            </div>
        </div>
    );
}